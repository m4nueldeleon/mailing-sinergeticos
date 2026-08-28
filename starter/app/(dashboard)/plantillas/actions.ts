"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { ensamblarCorreo, renderTextoPlano, renderVariables, textoDesdeHtml, type Block } from "@/lib/plantillas";
import { enviarLote } from "@/lib/resend";
import { urlBaja } from "@/lib/baja";

/** templates tiene RLS sin policies (ver esquema): siempre service_role, detrás de requireUser(). */

export interface PlantillaFila {
  id: string;
  name: string;
  subject: string;
  updated_at: string;
}

export async function listarPlantillas(): Promise<PlantillaFila[]> {
  await requireUser();
  const admin = await createSupabaseAdmin();
  const { data } = await admin.from("templates").select("id, name, subject, updated_at").order("updated_at", { ascending: false });
  return (data ?? []) as PlantillaFila[];
}

export interface Plantilla {
  id: string;
  name: string;
  subject: string;
  pre_header: string | null;
  blocks: Block[];
}

export async function obtenerPlantilla(id: string): Promise<Plantilla | null> {
  await requireUser();
  const admin = await createSupabaseAdmin();
  const { data } = await admin.from("templates").select("id, name, subject, pre_header, blocks").eq("id", id).maybeSingle();
  if (!data) return null;
  return {
    id: data.id as string,
    name: data.name as string,
    subject: data.subject as string,
    pre_header: data.pre_header as string | null,
    blocks: Array.isArray(data.blocks) ? (data.blocks as Block[]) : [],
  };
}

export interface EstadoGuardarPlantilla {
  ok: boolean;
  error: string | null;
}

export async function guardarPlantilla(_prev: EstadoGuardarPlantilla, formData: FormData): Promise<EstadoGuardarPlantilla> {
  const yo = await requireUser();
  const id = String(formData.get("id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const subject = String(formData.get("subject") ?? "").trim();
  const preHeader = String(formData.get("preHeader") ?? "").trim();
  const blocksRaw = String(formData.get("blocks") ?? "[]");
  const htmlCrudo = String(formData.get("htmlCrudo") ?? "").trim();

  if (!name) return { ok: false, error: "Falta el nombre de la plantilla." };
  if (!subject) return { ok: false, error: "Falta el asunto." };

  let blocks: Block[];
  try {
    blocks = JSON.parse(blocksRaw) as Block[];
  } catch {
    return { ok: false, error: "Los bloques no se pudieron leer — recarga la página." };
  }

  const html = htmlCrudo || ensamblarCorreo({ subject, preheader: preHeader, blocks });
  const textBody = htmlCrudo ? textoDesdeHtml(htmlCrudo) : renderTextoPlano(blocks);

  const admin = await createSupabaseAdmin();
  let nuevoId = id;
  if (id) {
    const { error } = await admin
      .from("templates")
      .update({ name, subject, pre_header: preHeader, blocks, html, text_body: textBody, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) return { ok: false, error: error.message };
  } else {
    const { data, error } = await admin
      .from("templates")
      .insert({ name, subject, pre_header: preHeader, blocks, html, text_body: textBody, created_by: yo.id })
      .select("id")
      .single();
    if (error || !data) return { ok: false, error: error?.message ?? "No se pudo crear la plantilla." };
    nuevoId = data.id as string;
  }

  revalidatePath("/plantillas");
  if (!id) redirect(`/plantillas/${nuevoId}`);
  return { ok: true, error: null };
}

export interface EstadoPrueba {
  ok: boolean;
  error: string | null;
  enviados: number;
}

export async function enviarPrueba(_prev: EstadoPrueba, formData: FormData): Promise<EstadoPrueba> {
  await requireUser();
  const subject = String(formData.get("subject") ?? "").trim();
  const preHeader = String(formData.get("preHeader") ?? "").trim();
  const blocksRaw = String(formData.get("blocks") ?? "[]");
  const htmlCrudo = String(formData.get("htmlCrudo") ?? "").trim();
  const destinatariosRaw = String(formData.get("destinatarios") ?? "");

  const destinatarios = destinatariosRaw
    .split(/[,;\s]+/)
    .map((e) => e.trim().toLowerCase())
    .filter((e) => e.includes("@"));
  if (destinatarios.length === 0) return { ok: false, error: "Escribe al menos un correo interno válido.", enviados: 0 };
  if (!subject) return { ok: false, error: "Falta el asunto.", enviados: 0 };

  let blocks: Block[];
  try {
    blocks = JSON.parse(blocksRaw) as Block[];
  } catch {
    return { ok: false, error: "Los bloques no se pudieron leer — recarga la página.", enviados: 0 };
  }

  const htmlBase = htmlCrudo || ensamblarCorreo({ subject: `[PRUEBA] ${subject}`, preheader: preHeader, blocks });
  const textoBase = htmlCrudo ? textoDesdeHtml(htmlCrudo) : renderTextoPlano(blocks);

  const correos = destinatarios.map((email) => ({
    to: email,
    subject: `[PRUEBA] ${subject}`,
    html: renderVariables(htmlBase, { first_name: "Prueba", email, unsubscribe_url: urlBaja(email) }),
    text: textoBase,
  }));

  const resultado = await enviarLote(correos, `prueba:${Date.now()}`);
  if (!resultado.ok) return { ok: false, error: resultado.error, enviados: 0 };
  return { ok: true, error: null, enviados: resultado.ids.length };
}
