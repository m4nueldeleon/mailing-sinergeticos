"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin, requireUser } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { env } from "@/lib/env";
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

export interface EstadoConfiguracion {
  mailEnabled: boolean;
  dailyCap: number;
  mailFrom: string;
  mailReplyTo: string;
  configurado: {
    resend: boolean;
    from: boolean;
    webhook: boolean;
    axis: boolean;
    db: boolean;
    unsubscribe: boolean;
  };
}

export async function obtenerEstadoConfiguracion(): Promise<EstadoConfiguracion> {
  await requireUser();
  return {
    mailEnabled: env.mailEnabled(),
    dailyCap: env.mailDailyCap(),
    mailFrom: env.mailFrom(),
    mailReplyTo: env.mailReplyTo() ?? "",
    configurado: {
      resend: Boolean(env.resendApiKey()),
      from: Boolean(env.mailFrom()),
      webhook: Boolean(env.resendWebhookSecret()),
      axis: Boolean(env.axisDatabaseUrlRo()),
      db: Boolean(env.databaseUrl()),
      unsubscribe: Boolean(env.unsubscribeSecret()),
    },
  };
}

export interface DominioResend {
  name: string;
  status: string;
}

/** Verificación de dominios en Resend — sin esto, un dominio sin verificar entrega peor o nada. */
export async function obtenerDominiosResend(): Promise<{ ok: boolean; error: string | null; dominios: DominioResend[] }> {
  await requireUser();
  const apiKey = env.resendApiKey();
  if (!apiKey) return { ok: false, error: "Falta RESEND_API_KEY", dominios: [] };

  const res = await fetch("https://api.resend.com/domains", { headers: { Authorization: `Bearer ${apiKey}` } });
  if (!res.ok) return { ok: false, error: `Resend respondió ${res.status}`, dominios: [] };
  const data = (await res.json()) as { data?: { name: string; status: string }[] };
  return { ok: true, error: null, dominios: (data.data ?? []).map((d) => ({ name: d.name, status: d.status })) };
}

export interface EntradaBitacora {
  id: number;
  action: string;
  entity: string | null;
  entity_id: string | null;
  detail: Record<string, unknown>;
  created_at: string;
  usuario_email: string | null;
}

export async function listarBitacora(): Promise<EntradaBitacora[]> {
  await requireAdmin();
  const admin = await createSupabaseAdmin();
  const { data } = await admin
    .from("audit_log")
    .select("id, action, entity, entity_id, detail, created_at, user_id")
    .order("created_at", { ascending: false })
    .limit(50);
  const filas = (data ?? []) as { id: number; action: string; entity: string | null; entity_id: string | null; detail: Record<string, unknown>; created_at: string; user_id: string | null }[];

  const userIds = [...new Set(filas.map((f) => f.user_id).filter(Boolean))] as string[];
  const { data: usuarios } = userIds.length > 0 ? await admin.from("app_users").select("id, email").in("id", userIds) : { data: [] };
  const emailPorId = new Map((usuarios ?? []).map((u) => [u.id as string, u.email as string]));

  return filas.map((f) => ({
    id: f.id,
    action: f.action,
    entity: f.entity,
    entity_id: f.entity_id,
    detail: f.detail,
    created_at: f.created_at,
    usuario_email: f.user_id ? (emailPorId.get(f.user_id) ?? null) : null,
  }));
}
