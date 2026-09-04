import type { SupabaseClient } from "@supabase/supabase-js";
import { listarSegmento, type FiltrosSegmento } from "./axis";
import { renderVariables } from "./plantillas";
import { urlBaja, cabecerasBaja } from "./baja";
import { enviarLote, trocear, type CorreoLote } from "./resend";
import { agregarUTM } from "./utm";
import { env } from "./env";

/**
 * Motor de campañas: congela destinatarios y manda por lotes de 100.
 *
 * Nada aquí decide POR SU CUENTA a quién mandarle — eso ya lo resolvió
 * `listarSegmento` (excluye mail_supresion de Axis) y `congelarDestinatarios`
 * (excluye además la tabla `suppression` propia). Una vez congelado un
 * destinatario en `campaign_recipients`, cambiar el segmento después no le
 * afecta — así una campaña siempre manda a la lista que se aprobó, no a
 * "lo que el segmento diga en ese momento".
 */

const TAMANO_LOTE = 100;

interface DestinatarioCongelado {
  email: string;
  first_name: string | null;
  contact_id: string | null;
}

/** Trae TODO el segmento (listarSegmento pagina de 1000 en 1000 internamente). */
async function resolverSegmentoCompleto(filtros: FiltrosSegmento): Promise<DestinatarioCongelado[]> {
  const TOPE_PAGINA = 1000;
  const out: DestinatarioCongelado[] = [];
  let offset = 0;
  for (;;) {
    const pagina = await listarSegmento(filtros, TOPE_PAGINA, offset);
    for (const c of pagina) {
      if (c.email) out.push({ email: c.email.toLowerCase().trim(), first_name: c.first_name, contact_id: c.id });
    }
    if (pagina.length < TOPE_PAGINA) break;
    offset += TOPE_PAGINA;
  }
  return out;
}

export interface ResultadoCongelar {
  ok: boolean;
  error: string | null;
  total: number;
}

/**
 * Congela destinatarios en `campaign_recipients`: resuelve el segmento completo,
 * quita duplicados por email, excluye la supresión PROPIA (mail_supresion de Axis
 * ya se excluyó dentro del segmento), y reparte en lotes de 100 vía `batch_no`.
 * Es seguro llamarla dos veces — si ya hay destinatarios congelados, no hace nada.
 */
export async function congelarDestinatarios(admin: SupabaseClient, campaignId: string): Promise<ResultadoCongelar> {
  const { count: yaCongelados } = await admin
    .from("campaign_recipients")
    .select("email", { count: "exact", head: true })
    .eq("campaign_id", campaignId);
  if (yaCongelados && yaCongelados > 0) return { ok: true, error: null, total: yaCongelados };

  const { data: campana } = await admin.from("campaigns").select("segment_id").eq("id", campaignId).maybeSingle();
  if (!campana?.segment_id) return { ok: false, error: "La campaña no tiene segmento.", total: 0 };

  const { data: segmento } = await admin.from("segments").select("filters").eq("id", campana.segment_id as string).maybeSingle();
  if (!segmento) return { ok: false, error: "El segmento ya no existe.", total: 0 };

  let crudos: DestinatarioCongelado[];
  try {
    crudos = await resolverSegmentoCompleto(segmento.filters as FiltrosSegmento);
  } catch (e) {
    return { ok: false, error: `No se pudo leer Axis: ${(e as Error).message}`, total: 0 };
  }

  // Dedupe por email — un contacto no recibe la misma campaña dos veces aunque
  // el segmento lo devuelva repetido (pasa con OR de filtros mal armados).
  const porEmail = new Map<string, DestinatarioCongelado>();
  for (const c of crudos) if (!porEmail.has(c.email)) porEmail.set(c.email, c);

  const { data: suprimidos } = await admin.from("suppression").select("email");
  const setSuprimidos = new Set((suprimidos ?? []).map((s) => (s.email as string).toLowerCase()));

  const finales = [...porEmail.values()].filter((c) => !setSuprimidos.has(c.email));
  if (finales.length === 0) return { ok: false, error: "El segmento no tiene destinatarios después de excluir supresión.", total: 0 };

  const filas = finales.map((c, i) => ({
    campaign_id: campaignId,
    contact_id: c.contact_id,
    email: c.email,
    first_name: c.first_name,
    vars: {},
    batch_no: Math.floor(i / TAMANO_LOTE),
  }));

  // Insertar en trozos: un solo INSERT con miles de filas se puede topar con
  // límites de tamaño de payload en PostgREST.
  for (const trozo of trocear(filas, 500)) {
    const { error } = await admin.from("campaign_recipients").upsert(trozo, { onConflict: "campaign_id,email", ignoreDuplicates: true });
    if (error) return { ok: false, error: error.message, total: 0 };
  }

  const batchesTotal = Math.ceil(finales.length / TAMANO_LOTE);
  await admin
    .from("campaigns")
    .update({ totals: { recipients: finales.length, batches_total: batchesTotal, batches_done: 0, enviados: 0, errores: 0 } })
    .eq("id", campaignId);

  return { ok: true, error: null, total: finales.length };
}

export interface ResultadoLoteCampana {
  ok: boolean;
  error: string | null;
  /** true cuando ya no queda nada pendiente — la campaña pasa a 'enviada'. */
  terminada: boolean;
  enviadosEnEsteLote: number;
}

/** Cuántos correos de ESTA CAMPAÑA lleva enviados desde medianoche (hora del servidor). */
async function enviadosHoyGlobal(admin: SupabaseClient): Promise<number> {
  const medianoche = new Date();
  medianoche.setHours(0, 0, 0, 0);
  const { count } = await admin
    .from("campaign_sends")
    .select("id", { count: "exact", head: true })
    .eq("status", "enviado")
    .gte("sent_at", medianoche.toISOString());
  return count ?? 0;
}

/**
 * Procesa UN lote (hasta 100 destinatarios) de una campaña ya congelada.
 * Idempotente: cada destinatario solo se manda si no tiene ya una fila en
 * `campaign_sends` para esta campaña — un reintento nunca duplica un envío.
 * Se puede llamar repetidamente (desde un cron) hasta que devuelva `terminada`.
 */
export async function procesarSiguienteLote(admin: SupabaseClient, campaignId: string): Promise<ResultadoLoteCampana> {
  const cap = env.mailDailyCap();
  const hoy = await enviadosHoyGlobal(admin);
  if (hoy >= cap) return { ok: true, error: null, terminada: false, enviadosEnEsteLote: 0 };

  const { data: campana } = await admin
    .from("campaigns")
    .select("name, subject, html, text_body, from_email, reply_to, totals")
    .eq("id", campaignId)
    .maybeSingle();
  if (!campana) return { ok: false, error: "Campaña no encontrada.", terminada: false, enviadosEnEsteLote: 0 };

  const htmlEtiquetado = agregarUTM(campana.html as string, campaignId, campana.name as string);

  const { data: yaEnviados } = await admin.from("campaign_sends").select("email").eq("campaign_id", campaignId);
  const setEnviados = new Set((yaEnviados ?? []).map((r) => r.email as string));

  const margen = Math.min(TAMANO_LOTE, cap - hoy);
  const { data: pendientesRaw } = await admin
    .from("campaign_recipients")
    .select("email, first_name")
    .eq("campaign_id", campaignId)
    .order("email")
    .limit(2000); // suficiente para filtrar y sacar el siguiente margen; la tabla ya está acotada por campaña

  const pendientes = (pendientesRaw ?? []).filter((r) => !setEnviados.has(r.email as string)).slice(0, margen);

  if (pendientes.length === 0) {
    const totalEnviados = setEnviados.size;
    await admin
      .from("campaigns")
      .update({ status: "enviada", finished_at: new Date().toISOString(), totals: { ...(campana.totals as object), enviados: totalEnviados } })
      .eq("id", campaignId);
    return { ok: true, error: null, terminada: true, enviadosEnEsteLote: 0 };
  }

  const correos: (CorreoLote & { email: string })[] = pendientes.map((r) => {
    const email = r.email as string;
    const vars = { first_name: (r.first_name as string | null) ?? undefined, email, unsubscribe_url: urlBaja(email) };
    return {
      email,
      to: email,
      subject: renderVariables(campana.subject as string, vars),
      html: renderVariables(htmlEtiquetado, vars),
      text: campana.text_body ? renderVariables(campana.text_body as string, vars) : undefined,
      headers: cabecerasBaja(email, (campana.reply_to as string | null) ?? "baja@sinergeticos.com"),
      tags: [{ name: "campaign_id", value: campaignId }],
    };
  });

  const idemKey = `campaign:${campaignId}:offset:${setEnviados.size}`;
  const resultado = await enviarLote(correos, idemKey);

  const filasSends = correos.map((c, i) => ({
    campaign_id: campaignId,
    email: c.email,
    provider_id: resultado.ok ? (resultado.ids[i] ?? null) : null,
    idem_key: `${campaignId}:${c.email}`,
    status: resultado.ok ? "enviado" : "error",
    error: resultado.ok ? null : resultado.error,
    sent_at: resultado.ok ? new Date().toISOString() : null,
  }));
  await admin.from("campaign_sends").upsert(filasSends, { onConflict: "idem_key", ignoreDuplicates: true });

  if (!resultado.ok) return { ok: false, error: resultado.error, terminada: false, enviadosEnEsteLote: 0 };

  const totales = campana.totals as { batches_done?: number; enviados?: number } | null;
  await admin
    .from("campaigns")
    .update({
      totals: {
        ...(totales ?? {}),
        batches_done: (totales?.batches_done ?? 0) + 1,
        enviados: setEnviados.size + correos.length,
      },
    })
    .eq("id", campaignId);

  return { ok: true, error: null, terminada: false, enviadosEnEsteLote: correos.length };
}
