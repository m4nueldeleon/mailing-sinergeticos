// Envía UN correo de prueba con Resend. Úsalo para confirmar que la key y el dominio funcionan.
//   RESEND_API_KEY=re_xxx MAIL_FROM="Sinergéticos <hola@boletin.sinergeticos.com>" \
//   node ejemplos/enviar-prueba.mjs tu-correo@ejemplo.com
// Sin dependencias: usa fetch nativo (Node 18+).

const apiKey = process.env.RESEND_API_KEY;
const from = process.env.MAIL_FROM;
const to = process.argv[2];

if (!apiKey || !from || !to) {
  console.error("Faltan RESEND_API_KEY, MAIL_FROM o el destinatario como argumento.");
  process.exit(1);
}

const res = await fetch("https://api.resend.com/emails", {
  method: "POST",
  headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
  body: JSON.stringify({
    from,
    to: [to],
    subject: "Prueba desde mailing.sinergeticos.com",
    html: "<p>Si lees esto, Resend está listo. 🚀</p>",
    text: "Si lees esto, Resend está listo.",
    tags: [{ name: "tipo", value: "prueba" }],
  }),
});

const data = await res.json();
if (!res.ok) {
  console.error("Resend respondió", res.status, data);
  process.exit(1);
}
console.log("Enviado. id =", data.id);
