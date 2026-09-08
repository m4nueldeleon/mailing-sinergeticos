"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { agregarSupresion, listarCandidatosInactivos, type CandidatoInactivo } from "@/lib/supresion";
import { registrarAuditoria } from "@/lib/auditoria";

export type { CandidatoInactivo };

export async function obtenerCandidatosInactivos(): Promise<CandidatoInactivo[]> {
  await requireAdmin();
  return listarCandidatosInactivos(3);
}

export interface EstadoSuprimir {
  ok: boolean;
  error: string | null;
}

/** Suprime un candidato por inactividad — motivo 'manual', igual que cualquier alta a mano. */
export async function suprimirCandidato(_prev: EstadoSuprimir, formData: FormData): Promise<EstadoSuprimir> {
  const yo = await requireAdmin();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email) return { ok: false, error: "Falta el correo." };

  await agregarSupresion(email, "manual");
  const admin = await createSupabaseAdmin();
  await registrarAuditoria(admin, yo.id, "suppression.add_inactivo", "suppression", email);
  revalidatePath("/supresion");
  return { ok: true, error: null };
}
