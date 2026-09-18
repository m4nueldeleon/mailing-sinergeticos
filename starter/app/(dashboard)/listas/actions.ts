"use server";

import { requireUser } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { contarSegmento, listarSegmento, type ContactoAxis, type FiltrosSegmento } from "@/lib/axis";

function listaComas(raw: string): string[] | undefined {
  const valores = raw.split(",").map((v) => v.trim()).filter(Boolean);
  return valores.length > 0 ? valores : undefined;
}

function leerFiltros(formData: FormData): FiltrosSegmento {
  const etapas = formData.getAll("etapas").map(String) as FiltrosSegmento["etapas"];
  const mercados = formData.getAll("mercados").map(String) as FiltrosSegmento["mercados"];
  const nivelConsciencia = formData.getAll("nivelConsciencia").map(String) as FiltrosSegmento["nivelConsciencia"];
  const paisesRaw = String(formData.get("paises") ?? "").trim();
  const regionesRaw = String(formData.get("regiones") ?? "").trim();
  const ciudadesRaw = String(formData.get("ciudades") ?? "").trim();
  const embudosRaw = String(formData.get("embudosOrigen") ?? "").trim();
  const tocoEmbudoRaw = String(formData.get("tocoEmbudo") ?? "").trim();
  const membresia = String(formData.get("membresia") ?? "") as FiltrosSegmento["membresia"];
  const activosRaw = String(formData.get("activosEnDias") ?? "").trim();
  const compraProducto = String(formData.get("compraProducto") ?? "").trim();
  const compraProductoExcluir = String(formData.get("compraProductoExcluir") ?? "").trim();

  return {
    etapas: etapas && etapas.length > 0 ? etapas : undefined,
    mercados: mercados && mercados.length > 0 ? mercados : undefined,
    nivelConsciencia: nivelConsciencia && nivelConsciencia.length > 0 ? nivelConsciencia : undefined,
    paises: paisesRaw ? listaComas(paisesRaw) : undefined,
    regiones: regionesRaw ? listaComas(regionesRaw) : undefined,
    ciudades: ciudadesRaw ? listaComas(ciudadesRaw) : undefined,
    embudosOrigen: embudosRaw ? listaComas(embudosRaw) : undefined,
    tocoEmbudo: tocoEmbudoRaw ? listaComas(tocoEmbudoRaw) : undefined,
    membresia: membresia || undefined,
    activosEnDias: activosRaw ? Number(activosRaw) : undefined,
    compraProducto: compraProducto || undefined,
    compraProductoExcluir: compraProductoExcluir || undefined,
  };
}

export interface EstadoPrevia {
  ok: boolean;
  error: string | null;
  total: number | null;
  muestra: ContactoAxis[];
  filtros: FiltrosSegmento | null;
}

const ESTADO_VACIO: EstadoPrevia = { ok: false, error: null, total: null, muestra: [], filtros: null };

export async function previsualizarSegmento(_prev: EstadoPrevia, formData: FormData): Promise<EstadoPrevia> {
  await requireUser();
  const filtros = leerFiltros(formData);

  try {
    const [total, muestra] = await Promise.all([contarSegmento(filtros), listarSegmento(filtros, 20)]);
    return { ok: true, error: null, total, muestra, filtros };
  } catch (e) {
    return { ...ESTADO_VACIO, error: (e as Error).message };
  }
}

export interface EstadoGuardar {
  ok: boolean;
  error: string | null;
}

export async function guardarSegmento(_prev: EstadoGuardar, formData: FormData): Promise<EstadoGuardar> {
  const yo = await requireUser();
  const nombre = String(formData.get("nombre") ?? "").trim();
  const filtrosRaw = String(formData.get("filtros") ?? "");
  if (!nombre) return { ok: false, error: "Falta el nombre del segmento." };

  let filtros: FiltrosSegmento;
  try {
    filtros = JSON.parse(filtrosRaw) as FiltrosSegmento;
  } catch {
    return { ok: false, error: "Filtros inválidos — vuelve a hacer la vista previa antes de guardar." };
  }

  const admin = await createSupabaseAdmin();
  const { error } = await admin.from("segments").insert({ name: nombre, filters: filtros, created_by: yo.id });
  if (error) return { ok: false, error: error.message };
  return { ok: true, error: null };
}
