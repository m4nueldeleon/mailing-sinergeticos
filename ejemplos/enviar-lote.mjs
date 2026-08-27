// Envía un LOTE (hasta 100) con /emails/batch, con clave de idempotencia y respeto al rate limit.
// Es la pieza central de una campaña: la app parte la lista en trozos de 100 y llama esto por trozo.
//   RESEND_API_KEY=re_xxx MAIL_FROM="..." node ejemplos/enviar-lote.mjs correo1@x.com correo2@y.com
// En producción: los destinatarios salen de `campaign_recipients`, ya filtrados por supresión.

import { createHmac } from "node:crypto";

const apiKey = process.env.RESEND_API_KEY;
const from = process.env.MAIL_FROM;
const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://mailing.sinergeticos.com";
const unsubSecret = process.env.UNSUBSCRIBE_SECRET ?? "cambia-esto";
const destinatarios = process.argv.slice(2);
const campaignId = "demo-001"; // en la app: el uuid de la campaña

if (!apiKey || !from || destinatarios.length === 0) {
  console.error("Faltan RESEND_API_KEY, MAIL_FROM o destinatarios.");
  process.exit(1);
}
if (destinatarios.length > 100) {
  console.error("Máximo 100 por lote. Parte la lista.");
  process.exit(1);
}

// Liga de baja firmada: nadie puede dar de baja a otro sin el token.
function tokenBaja(email) {
  return createHmac("sha256", unsubSecret).update(email.toLowerCase().trim()).digest("hex").slice(0, 32);
}
function unsubscribeUrl(email) {
  return `${appUrl}/baja?e=${encodeURIComponent(email)}&t=${tokenBaja(email)}`;
}

const lote = destinatarios.map((email) => {
  const baja = unsubscribeUrl(email);
  return {
    from,
    to: [email],
    reply_to: process.env.MAIL_REPLY_TO,
    subject: "Boletín de prueba — Sinergéticos",
    html: `<p>Hola 👋</p><p>Este es un ejemplo de lote.</p><p><a href="${baja}">Darme de baja</a></p>`,
    text: `Hola. Este es un ejemplo de lote. Darme de baja: ${baja}`,
    headers: {
      "List-Unsubscribe": `<${baja}>, <mailto:baja@boletin.sinergeticos.com>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
    tags: [{ name: "campaign_id", value: campaignId }],
  };
});

// Idempotency-Key por lote: si la app reintenta el mismo trozo, Resend no lo duplica.
const idempotencyKey = `${campaignId}:lote:${destinatarios[0]}:${destinatarios.length}`;

async function enviarConReintento(intento = 1) {
  const res = await fetch("https://api.resend.com/emails/batch", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify(lote),
  });
  if (res.status === 429 && intento <= 5) {
    const espera = 500 * 2 ** intento; // backoff exponencial
    console.warn(`429: esperando ${espera} ms (intento ${intento})`);
    await new Promise((r) => setTimeout(r, espera));
    return enviarConReintento(intento + 1);
  }
  return res;
}

const res = await enviarConReintento();
const data = await res.json();
if (!res.ok) {
  console.error("Resend respondió", res.status, data);
  process.exit(1);
}
// data.data = [{ id }, ...] en el mismo orden que el lote. GUARDA cada id como provider_id.
data.data.forEach((r, i) => console.log(destinatarios[i], "→", r.id));
