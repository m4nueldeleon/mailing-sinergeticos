// Verificación de la firma Svix de los webhooks de Resend (misma técnica que usa Axis).
// Ruta sugerida: app/api/hooks/resend/route.ts (Next.js, runtime nodejs).
// OJO: firmar sobre el BODY CRUDO. Si parseas y re-serializas, la firma deja de coincidir.

import { createHmac, timingSafeEqual } from "node:crypto";

const TOLERANCIA_SEG = 5 * 60;

export function firmaSvixValida(
  secret: string, // "whsec_..." tal cual lo da Resend
  svixId: string,
  svixTimestamp: string,
  svixSignature: string, // "v1,base64 v1,base64 ..."
  rawBody: string,
): boolean {
  const ts = Number(svixTimestamp);
  if (!Number.isFinite(ts) || Math.abs(Date.now() / 1000 - ts) > TOLERANCIA_SEG) return false;

  const key = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
  const esperada = createHmac("sha256", key).update(`${svixId}.${svixTimestamp}.${rawBody}`).digest();

  return svixSignature.split(" ").some((parte) => {
    const [version, firma] = parte.split(",");
    if (version !== "v1" || !firma) return false;
    const recibida = Buffer.from(firma, "base64");
    return recibida.length === esperada.length && timingSafeEqual(recibida, esperada);
  });
}

// Evento de Resend → estado del envío en tu tabla `campaign_sends`.
export const ESTADO_POR_EVENTO: Record<string, string> = {
  "email.sent": "enviado",
  "email.delivered": "entregado",
  "email.delivery_delayed": "retrasado",
  "email.bounced": "rebotado",
  "email.complained": "queja",
  "email.opened": "abierto",
  "email.clicked": "clic",
};

// Ejemplo de handler Next.js:
//
// export const runtime = "nodejs";
// export async function POST(req: Request) {
//   const secret = process.env.RESEND_WEBHOOK_SECRET;
//   if (!secret) return new Response("Sin secreto", { status: 503 });
//   const raw = await req.text();
//   const ok = firmaSvixValida(
//     secret,
//     req.headers.get("svix-id") ?? "",
//     req.headers.get("svix-timestamp") ?? "",
//     req.headers.get("svix-signature") ?? "",
//     raw,
//   );
//   if (!ok) return new Response("Firma inválida", { status: 401 });
//   const evento = JSON.parse(raw) as { type: string; data: { email_id: string; to: string[]; bounce?: { type?: string } } };
//   // 1) guardar en mail_eventos (provider_id = evento.data.email_id, tipo = evento.type, payload = evento)
//   // 2) actualizar campaign_sends.status con ESTADO_POR_EVENTO[evento.type]
//   // 3) si bounced (duro) o complained → insertar en supresion + sincronizar a Axis
//   return Response.json({ ok: true });
// }
