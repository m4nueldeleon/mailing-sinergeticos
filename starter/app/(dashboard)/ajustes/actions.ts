"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import type { Rol } from "@/lib/auth";

/**
 * app_users tiene RLS activado sin policies (a propósito, ver esquema/mailing-propuesto.sql):
 * nadie entra con la anon key. Todo acceso pasa por aquí, con service_role, detrás del guard
 * de requireAdmin() — mismo patrón que compras_stripe_eventos en vsl-platform.
 */

export interface UsuarioApp {
  id: string;
  email: string;
  role: Rol;
  created_at: string;
}

export async function listarUsuarios(): Promise<UsuarioApp[]> {
  await requireAdmin();
  const admin = await createSupabaseAdmin();
  const { data } = await admin.from("app_users").select("id, email, role, created_at").order("created_at", { ascending: true });
  return (data ?? []) as UsuarioApp[];
}

export interface EstadoAjustes {
  ok: boolean;
  error: string | null;
}

export async function invitarUsuario(_prev: EstadoAjustes, formData: FormData): Promise<EstadoAjustes> {
  await requireAdmin();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const role = String(formData.get("role") ?? "editor");
  if (!email) return { ok: false, error: "Falta el correo." };
  if (role !== "admin" && role !== "editor") return { ok: false, error: "Rol inválido." };

  const admin = await createSupabaseAdmin();
  const { data, error } = await admin.auth.admin.inviteUserByEmail(email);
  if (error) return { ok: false, error: `No se pudo invitar: ${error.message}` };
  if (!data.user) return { ok: false, error: "Supabase no devolvió el usuario invitado." };

  const { error: insertError } = await admin.from("app_users").insert({ id: data.user.id, email, role });
  if (insertError) return { ok: false, error: `Usuario invitado pero no se pudo dar de alta: ${insertError.message}` };

  revalidatePath("/ajustes");
  return { ok: true, error: null };
}

export async function cambiarRol(_prev: EstadoAjustes, formData: FormData): Promise<EstadoAjustes> {
  const yo = await requireAdmin();
  const userId = String(formData.get("userId") ?? "");
  const role = String(formData.get("role") ?? "");
  if (!userId || (role !== "admin" && role !== "editor")) return { ok: false, error: "Datos inválidos." };
  if (userId === yo.id && role !== "admin") return { ok: false, error: "No puedes quitarte tu propio rol de admin." };

  const admin = await createSupabaseAdmin();
  const { error } = await admin.from("app_users").update({ role }).eq("id", userId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/ajustes");
  return { ok: true, error: null };
}
