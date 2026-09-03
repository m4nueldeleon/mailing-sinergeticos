import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { procesarSiguienteLote } from "@/lib/campanas";

/**
 * Motor de envío por lotes — Vercel Cron le pega cada minuto (ver vercel.json).
 * Cada corrida manda UN lote (hasta 100 correos) de la campaña activa más
 * antigua, y se detiene sola si ya no hay nada pendiente o si el tope diario
 * (MAIL_DAILY_CAP) ya se alcanzó. Así "pausar" es real: basta con que la
 * campaña deje de estar en 'enviando' para que el cron la salte.
 */
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function autorizado(req: NextRequest): boolean {
  const secreto = process.env.CRON_SECRET;
  if (!secreto) return true; // sin secreto configurado: no bloquea el arranque del proyecto
  return req.headers.get("authorization") === `Bearer ${secreto}`;
}

export async function GET(req: NextRequest) {
  if (!autorizado(req)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const admin = await createSupabaseAdmin();

  // Programadas cuya hora ya llegó pasan a 'enviando' antes de procesar nada.
  await admin
    .from("campaigns")
    .update({ status: "enviando", started_at: new Date().toISOString() })
    .eq("status", "programada")
    .lte("scheduled_for", new Date().toISOString());

  const { data: activa } = await admin
    .from("campaigns")
    .select("id")
    .eq("status", "enviando")
    .order("updated_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!activa) return NextResponse.json({ ok: true, hecho: "nada pendiente" });

  const resultado = await procesarSiguienteLote(admin, activa.id as string);
  return NextResponse.json({ campaignId: activa.id, ...resultado });
}
