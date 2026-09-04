import { NextResponse, type NextRequest } from "next/server";
import { firmaSvixValida } from "@/lib/svix";
import { env } from "@/lib/env";
import { agregarSupresion, registrarEvento } from "@/lib/supresion";
import { createSupabaseAdmin } from "@/lib/supabase/server";

export const runtime = "nodejs";

interface EventoResend {
  type: string;
  data: { email_id: string; to: string[]; bounce?: { type?: string }; tags?: { name: string; value: string }[] };
}

/** Evento de Resend → estado de campaign_sends. Solo los que nos importa reflejar en Reportes. */
const ESTADO_POR_EVENTO: Record<string, string> = {
  "email.delivered": "entregado",
  "email.delivery_delayed": "retrasado",
  "email.bounced": "rebotado",
  "email.complained": "queja",
  "email.opened": "abierto",
  "email.clicked": "clic",
};

/**
 * Orden de "qué tanto avanzó" un correo — para no dejar que un evento viejo
 * que llega tarde (p. ej. "entregado" después de "clic") pise el estado más
 * avanzado que ya teníamos. Rebote/queja siempre se aplican: son la señal
 * más importante, sin importar en qué orden lleguen.
 */
const RANGO: Record<string, number> = { pendiente: 0, enviado: 1, entregado: 2, abierto: 3, clic: 4 };
const SIEMPRE_APLICA = new Set(["rebotado", "queja", "error"]);

async function actualizarEstadoEnvio(admin: Awaited<ReturnType<typeof createSupabaseAdmin>>, providerId: string, estadoNuevo: string): Promise<void> {
  const { data: fila } = await admin.from("campaign_sends").select("id, status").eq("provider_id", providerId).maybeSingle();
  if (!fila) return; // no es un envío nuestro (o es de una prueba, que no se registra en campaign_sends)
  const rangoActual = RANGO[fila.status as string] ?? 0;
  const rangoNuevo = RANGO[estadoNuevo] ?? 0;
  if (!SIEMPRE_APLICA.has(estadoNuevo) && rangoNuevo <= rangoActual) return;
  await admin.from("campaign_sends").update({ status: estadoNuevo, updated_at: new Date().toISOString() }).eq("id", fila.id as number);
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

  const estadoNuevo = ESTADO_POR_EVENTO[evento.type];
  if (estadoNuevo) {
    const admin = await createSupabaseAdmin();
    await actualizarEstadoEnvio(admin, evento.data.email_id, estadoNuevo);
  }

  const destinatario = evento.data.to?.[0];
  if (destinatario && evento.type === "email.complained") {
    await agregarSupresion(destinatario, "queja");
  } else if (destinatario && evento.type === "email.bounced" && evento.data.bounce?.type !== "Transient") {
    await agregarSupresion(destinatario, "rebote_duro");
  }

  return NextResponse.json({ ok: true });
}
