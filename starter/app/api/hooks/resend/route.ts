import { NextResponse, type NextRequest } from "next/server";
import { firmaSvixValida } from "@/lib/svix";
import { env } from "@/lib/env";
import { agregarSupresion, registrarEvento } from "@/lib/supresion";

export const runtime = "nodejs";

interface EventoResend {
  type: string;
  data: { email_id: string; to: string[]; bounce?: { type?: string } };
}

/** Webhook de Resend: entregado/rebotado/queja/abierto/clic. Firma Svix sobre el body crudo. */
export async function POST(req: NextRequest) {
  const secret = env.resendWebhookSecret();
  if (!secret) return NextResponse.json({ error: "Sin RESEND_WEBHOOK_SECRET" }, { status: 503 });

  const raw = await req.text();
  const ok = firmaSvixValida(
    secret,
    req.headers.get("svix-id") ?? "",
    req.headers.get("svix-timestamp") ?? "",
    req.headers.get("svix-signature") ?? "",
    raw,
  );
  if (!ok) return NextResponse.json({ error: "Firma inválida" }, { status: 401 });

  let evento: EventoResend;
  try {
    evento = JSON.parse(raw) as EventoResend;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  await registrarEvento(evento.data.email_id, evento.type, evento);

  const destinatario = evento.data.to?.[0];
  if (destinatario && evento.type === "email.complained") {
    await agregarSupresion(destinatario, "queja");
  } else if (destinatario && evento.type === "email.bounced" && evento.data.bounce?.type !== "Transient") {
    await agregarSupresion(destinatario, "rebote_duro");
  }
  // Pendiente: actualizar campaign_sends.status con ESTADO_POR_EVENTO (ver ejemplos/webhook-resend.ts).

  return NextResponse.json({ ok: true });
}
