"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { ensamblarCorreo, renderTextoPlano, renderVariables, textoDesdeHtml, type Block } from "@/lib/plantillas";
import { enviarLote } from "@/lib/resend";
import { urlBaja } from "@/lib/baja";
import { congelarDestinatarios, procesarSiguienteLote } from "@/lib/campanas";

/** campaigns/campaign_recipients/campaign_sends tienen RLS sin policies: siempre service_role, detrás de requireUser(). */

export type EstadoCampana =
  | "borrador"
  | "en_revision"
  | "aprobada"
  | "programada"
  | "enviando"
  | "pausada"
  | "enviada"
  | "cancelada";

export interface CampanaFila {
  id: string;
  name: string;
  status: EstadoCampana;
  scheduled_for: string | null;
  updated_at: string;
  totals: { recipients?: number; enviados?: number; batches_total?: number; batches_done?: number };
}

export async function listarCampanas(): Promise<CampanaFila[]> {
  await requireUser();
  const admin = await createSupabaseAdmin();
  const { data } = await admin
    .from("campaigns")
    .select("id, name, status, scheduled_for, updated_at, totals")
    .order("updated_at", { ascending: false });
  return (data ?? []) as CampanaFila[];
}

export interface SegmentoOpcion {
  id: string;
  name: string;
}

export async function listarSegmentosParaSelector(): Promise<SegmentoOpcion[]> {
  await requireUser();
  const admin = await createSupabaseAdmin();
  const { data } = await admin.from("segments").select("id, name").order("name");
  return (data ?? []) as SegmentoOpcion[];
}

export interface PlantillaOpcion {
  id: string;
  name: string;
  html: string;
}

export async function listarPlantillasParaSelector(): Promise<PlantillaOpcion[]> {
  await requireUser();
  const admin = await createSupabaseAdmin();
  const { data } = await admin.from("templates").select("id, name, html").order("name");
  return (data ?? []) as PlantillaOpcion[];
}

export interface Campana {
  id: string;
  name: string;
  subject: string;
  pre_header: string | null;
  from_name: string;
  from_email: string;
  reply_to: string | null;
  html: string;
  segment_id: string | null;
  status: EstadoCampana;
  scheduled_for: string | null;
  created_by: string | null;
  approved_by: string | null;
  totals: { recipients?: number; enviados?: number; batches_total?: number; batches_done?: number; errores?: number };
}

export async function obtenerCampana(id: string): Promise<Campana | null> {
  await requireUser();
  const admin = await createSupabaseAdmin();
  const { data } = await admin
    .from("campaigns")
    .select("id, name, subject, pre_header, from_name, from_email, reply_to, html, segment_id, status, scheduled_for, created_by, approved_by, totals")
    .eq("id", id)
    .maybeSingle();
  if (!data) return null;
  return data as unknown as Campana;
}

export interface EstadoGuardarCampana {
  ok: boolean;
  error: string | null;
}

/** Crea (sin id) o edita (con id) una campaña — solo mientras está en 'borrador'. */
export async function guardarCampana(_prev: EstadoGuardarCampana, formData: FormData): Promise<EstadoGuardarCampana> {
  const yo = await requireUser();
  const id = String(formData.get("id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const segmentId = String(formData.get("segmentId") ?? "").trim();
  const subject = String(formData.get("subject") ?? "").trim();
  const preHeader = String(formData.get("preHeader") ?? "").trim();
  const fromName = String(formData.get("fromName") ?? "Sinergéticos").trim();
  const fromEmail = String(formData.get("fromEmail") ?? "").trim();
  const replyTo = String(formData.get("replyTo") ?? "").trim();
  const blocksRaw = String(formData.get("blocks") ?? "[]");
  const htmlCrudo = String(formData.get("htmlCrudo") ?? "").trim();

  if (!name) return { ok: false, error: "Falta el nombre de la campaña." };
  if (!segmentId) return { ok: false, error: "Elige un segmento." };
  if (!subject) return { ok: false, error: "Falta el asunto." };
  if (!fromEmail) return { ok: false, error: "Falta el correo remitente." };

  let blocks: Block[];
  try {
    blocks = JSON.parse(blocksRaw) as Block[];
  } catch {
    return { ok: false, error: "El contenido no se pudo leer — recarga la página." };
  }

  const html = htmlCrudo || ensamblarCorreo({ subject, preheader: preHeader, blocks });
  const textBody = htmlCrudo ? textoDesdeHtml(htmlCrudo) : renderTextoPlano(blocks);

  const admin = await createSupabaseAdmin();
  if (id) {
    const { data: actual } = await admin.from("campaigns").select("status").eq("id", id).maybeSingle();
    if (actual && actual.status !== "borrador") return { ok: false, error: "Solo se puede editar el contenido mientras está en borrador." };
    const { error } = await admin
      .from("campaigns")
      .update({ name, segment_id: segmentId, subject, pre_header: preHeader, from_name: fromName, from_email: fromEmail, reply_to: replyTo || null, html, text_body: textBody, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePath(`/campanas/${id}`);
    return { ok: true, error: null };
  }

  const { data, error } = await admin
    .from("campaigns")
    .insert({ name, segment_id: segmentId, subject, pre_header: preHeader, from_name: fromName, from_email: fromEmail, reply_to: replyTo || null, html, text_body: textBody, created_by: yo.id, status: "borrador" })
    .select("id")
    .single();
  if (error || !data) return { ok: false, error: error?.message ?? "No se pudo crear la campaña." };
  revalidatePath("/campanas");
  redirect(`/campanas/${data.id as string}`);
}

export interface EstadoPrueba {
  ok: boolean;
  error: string | null;
  enviados: number;
}

export async function enviarPruebaCampana(_prev: EstadoPrueba, formData: FormData): Promise<EstadoPrueba> {
  await requireUser();
  const id = String(formData.get("id") ?? "").trim();
  const destinatariosRaw = String(formData.get("destinatarios") ?? "");
  const destinatarios = destinatariosRaw.split(/[,;\s]+/).map((e) => e.trim().toLowerCase()).filter((e) => e.includes("@"));
  if (destinatarios.length === 0) return { ok: false, error: "Escribe al menos un correo interno válido.", enviados: 0 };

  const admin = await createSupabaseAdmin();
  const { data: campana } = await admin.from("campaigns").select("subject, html, text_body").eq("id", id).maybeSingle();
  if (!campana) return { ok: false, error: "Campaña no encontrada.", enviados: 0 };

  const correos = destinatarios.map((email) => ({
    to: email,
    subject: `[PRUEBA] ${campana.subject as string}`,
    html: renderVariables(campana.html as string, { first_name: "Prueba", email, unsubscribe_url: urlBaja(email) }),
    text: campana.text_body ? renderVariables(campana.text_body as string, { first_name: "Prueba", email, unsubscribe_url: urlBaja(email) }) : undefined,
  }));

  const resultado = await enviarLote(correos, `prueba-campana:${id}:${Date.now()}`);
  if (!resultado.ok) return { ok: false, error: resultado.error, enviados: 0 };
  return { ok: true, error: null, enviados: resultado.ids.length };
}

export interface EstadoAccionCampana {
  ok: boolean;
  error: string | null;
}

async function transicion(id: string, desde: EstadoCampana[], hasta: EstadoCampana, extra?: Record<string, unknown>): Promise<EstadoAccionCampana> {
  const admin = await createSupabaseAdmin();
  const { data: actual } = await admin.from("campaigns").select("status").eq("id", id).maybeSingle();
  if (!actual) return { ok: false, error: "Campaña no encontrada." };
  if (!desde.includes(actual.status as EstadoCampana)) {
    return { ok: false, error: `No se puede pasar de "${actual.status as string}" a "${hasta}".` };
  }
  const { error } = await admin.from("campaigns").update({ status: hasta, updated_at: new Date().toISOString(), ...extra }).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/campanas/${id}`);
  revalidatePath("/campanas");
  return { ok: true, error: null };
}

/** borrador → en_revision: el contenido queda congelado para que quien apruebe vea justo lo que se va a mandar. */
export async function solicitarRevision(id: string): Promise<EstadoAccionCampana> {
  await requireUser();
  return transicion(id, ["borrador"], "en_revision");
}

export async function regresarABorrador(id: string): Promise<EstadoAccionCampana> {
  await requireUser();
  return transicion(id, ["en_revision"], "borrador");
}

/**
 * en_revision → aprobada. 4 ojos real: quien aprueba no puede ser quien creó
 * la campaña — nunca se auto-aprueba nadie, ni por accidente.
 */
export async function aprobarCampana(id: string): Promise<EstadoAccionCampana> {
  const yo = await requireUser();
  const admin = await createSupabaseAdmin();
  const { data: campana } = await admin.from("campaigns").select("created_by, status").eq("id", id).maybeSingle();
  if (!campana) return { ok: false, error: "Campaña no encontrada." };
  if (campana.created_by === yo.id) return { ok: false, error: "Quien crea la campaña no puede aprobarla — pide que la revise alguien más." };
  return transicion(id, ["en_revision"], "aprobada", { approved_by: yo.id, approved_at: new Date().toISOString() });
}

/**
 * aprobada → programada o enviando. Congela destinatarios (si no lo estaban ya)
 * y, si es "ahora", dispara el primer lote de una vez — el cron se encarga del resto.
 */
export async function programarOEnviar(_prev: EstadoAccionCampana, formData: FormData): Promise<EstadoAccionCampana> {
  await requireUser();
  const id = String(formData.get("id") ?? "").trim();
  const cuando = String(formData.get("cuando") ?? "ahora"); // "ahora" | fecha ISO

  const admin = await createSupabaseAdmin();
  const { data: campana } = await admin.from("campaigns").select("status").eq("id", id).maybeSingle();
  if (!campana) return { ok: false, error: "Campaña no encontrada." };
  if (campana.status !== "aprobada") return { ok: false, error: "Solo se puede programar/mandar una campaña ya aprobada." };

  const congelado = await congelarDestinatarios(admin, id);
  if (!congelado.ok) return { ok: false, error: congelado.error };

  if (cuando === "ahora") {
    await admin.from("campaigns").update({ status: "enviando", started_at: new Date().toISOString(), scheduled_for: new Date().toISOString() }).eq("id", id);
    // Dispara el primer lote de una vez — no hace falta esperar al cron para que arranque.
    await procesarSiguienteLote(admin, id);
  } else {
    const fecha = new Date(cuando);
    if (Number.isNaN(fecha.getTime())) return { ok: false, error: "Fecha de programación inválida." };
    await admin.from("campaigns").update({ status: "programada", scheduled_for: fecha.toISOString() }).eq("id", id);
  }

  revalidatePath(`/campanas/${id}`);
  revalidatePath("/campanas");
  return { ok: true, error: null };
}

export async function pausarCampana(id: string): Promise<EstadoAccionCampana> {
  await requireUser();
  return transicion(id, ["enviando", "programada"], "pausada");
}

export async function reanudarCampana(id: string): Promise<EstadoAccionCampana> {
  await requireUser();
  return transicion(id, ["pausada"], "enviando");
}

export async function cancelarCampana(id: string): Promise<EstadoAccionCampana> {
  await requireUser();
  return transicion(id, ["borrador", "en_revision", "aprobada", "programada", "enviando", "pausada"], "cancelada");
}
