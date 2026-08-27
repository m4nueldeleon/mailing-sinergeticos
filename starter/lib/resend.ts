import { env } from "./env";

/**
 * Envío por lotes a Resend (/emails/batch): hasta 100 correos por llamada, con Idempotency-Key
 * por lote y reintento con backoff ante 429. Esta es la pieza central de una campaña.
 */
export interface CorreoLote {
  to: string;
  subject: string;
  html: string;
  text?: string;
  headers?: Record<string, string>;
  tags?: { name: string; value: string }[];
  /** ISO 8601 o "in 1 hour"; opcional */
  scheduled_at?: string;
}

export type ResultadoLote =
  | { ok: true; ids: string[] }
  | { ok: false; status: number; error: string };

const MAX_POR_LOTE = 100;

export async function enviarLote(correos: CorreoLote[], idempotencyKey: string): Promise<ResultadoLote> {
  if (!env.mailEnabled()) return { ok: false, status: 0, error: "MAIL_ENABLED no es true: envío apagado" };
  if (correos.length === 0) return { ok: true, ids: [] };
  if (correos.length > MAX_POR_LOTE) return { ok: false, status: 0, error: `Máximo ${MAX_POR_LOTE} por lote` };
  const apiKey = env.resendApiKey();
  const from = env.mailFrom();
  if (!apiKey || !from) return { ok: false, status: 0, error: "Falta RESEND_API_KEY o MAIL_FROM" };

  const cuerpo = correos.map((c) => ({
    from,
    to: [c.to],
    reply_to: env.mailReplyTo(),
    subject: c.subject,
    html: c.html,
    text: c.text,
    headers: c.headers,
    tags: c.tags,
    scheduled_at: c.scheduled_at,
  }));

  for (let intento = 1; intento <= 5; intento++) {
    const res = await fetch("https://api.resend.com/emails/batch", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": idempotencyKey,
      },
      body: JSON.stringify(cuerpo),
    });
    if (res.status === 429) {
      await new Promise((r) => setTimeout(r, 500 * 2 ** intento));
      continue;
    }
    const data = (await res.json().catch(() => ({}))) as { data?: { id: string }[]; message?: string };
    if (!res.ok) return { ok: false, status: res.status, error: data.message ?? `HTTP ${res.status}` };
    return { ok: true, ids: (data.data ?? []).map((d) => d.id) };
  }
  return { ok: false, status: 429, error: "Rate limit persistente tras 5 intentos" };
}

/** Parte una lista en trozos de 100 (el máximo del batch de Resend). */
export function trocear<T>(items: readonly T[], tamano = MAX_POR_LOTE): T[][] {
  return Array.from({ length: Math.ceil(items.length / tamano) }, (_, i) => items.slice(i * tamano, (i + 1) * tamano));
}
