"use server";

import { requireUser } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/server";

export interface ReporteCampana {
  id: string;
  name: string;
  status: string;
  enviados: number;
  entregados: number;
  aperturas: number;
  clics: number;
  rebotados: number;
  quejas: number;
  errores: number;
  tasaApertura: number; // %
  tasaClic: number; // %
  tasaRebote: number; // %
  tasaQueja: number; // %
  semaforo: "verde" | "rojo";
}

/** "Al menos llegó a X" — abierto y clic cuentan también como entregados; clic cuenta también como abierto. */
function contarPorMenos(porEstado: Record<string, number>, umbral: string[]): number {
  return umbral.reduce((suma, estado) => suma + (porEstado[estado] ?? 0), 0);
}

export async function listarReportes(): Promise<ReporteCampana[]> {
  await requireUser();
  const admin = await createSupabaseAdmin();

  const { data: campanas } = await admin
    .from("campaigns")
    .select("id, name, status")
    .in("status", ["enviando", "pausada", "enviada"])
    .order("updated_at", { ascending: false });
  if (!campanas || campanas.length === 0) return [];

  const ids = campanas.map((c) => c.id as string);
  const { data: sends } = await admin.from("campaign_sends").select("campaign_id, status").in("campaign_id", ids).limit(50000);

  const porCampana = new Map<string, Record<string, number>>();
  for (const s of sends ?? []) {
    const cid = s.campaign_id as string;
    const estado = s.status as string;
    const mapa = porCampana.get(cid) ?? {};
    mapa[estado] = (mapa[estado] ?? 0) + 1;
    porCampana.set(cid, mapa);
  }

  return campanas.map((c) => {
    const porEstado = porCampana.get(c.id as string) ?? {};
    const enviados = Object.values(porEstado).reduce((a, b) => a + b, 0);
    const entregados = contarPorMenos(porEstado, ["entregado", "abierto", "clic"]);
    const aperturas = contarPorMenos(porEstado, ["abierto", "clic"]);
    const clics = porEstado.clic ?? 0;
    const rebotados = porEstado.rebotado ?? 0;
    const quejas = porEstado.queja ?? 0;
    const errores = porEstado.error ?? 0;
    const tasaApertura = entregados > 0 ? (aperturas / entregados) * 100 : 0;
    const tasaClic = entregados > 0 ? (clics / entregados) * 100 : 0;
    const tasaRebote = enviados > 0 ? (rebotados / enviados) * 100 : 0;
    const tasaQueja = enviados > 0 ? (quejas / enviados) * 100 : 0;
    return {
      id: c.id as string,
      name: c.name as string,
      status: c.status as string,
      enviados,
      entregados,
      aperturas,
      clics,
      rebotados,
      quejas,
      errores,
      tasaApertura,
      tasaClic,
      tasaRebote,
      tasaQueja,
      // Semáforo M del doc de requisitos: quejas > 0.1% o rebotes > 2% = rojo.
      semaforo: tasaQueja > 0.1 || tasaRebote > 2 ? "rojo" : "verde",
    };
  });
}
