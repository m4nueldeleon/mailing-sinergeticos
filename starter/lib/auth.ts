import { redirect } from "next/navigation";
import { createSupabaseServer, createSupabaseAdmin } from "./supabase/server";

/**
 * Auth real con Supabase (@supabase/ssr) + tabla `app_users` (esquema/mailing-propuesto.sql).
 * Primer usuario que inicia sesión (app_users vacía) se vuelve admin automático — equipo
 * interno chico, no hace falta flujo de invitación para arrancar. Cualquiera después necesita
 * una fila en app_users ya sea de ese arranque o dada de alta desde Ajustes → Usuarios.
 *
 * app_users tiene RLS activado sin policies a propósito (ver el esquema): se lee/escribe
 * siempre con service_role, nunca con la sesión del usuario.
 */
export type Rol = "admin" | "editor";
export interface Usuario {
  id: string;
  email: string;
  role: Rol;
}

function esRol(v: unknown): v is Rol {
  return v === "admin" || v === "editor";
}

/** Sesión SIN redirect (para el login: comprobar si ya hay uno activo). */
export async function getUsuario(): Promise<Usuario | null> {
  const supabase = await createSupabaseServer();
  const { data: authData, error } = await supabase.auth.getUser();
  if (error || !authData.user) return null;

  const admin = await createSupabaseAdmin();
  const { data: row } = await admin
    .from("app_users")
    .select("id, email, role")
    .eq("id", authData.user.id)
    .maybeSingle();

  if (row && esRol(row.role)) {
    return { id: authData.user.id, email: row.email as string, role: row.role };
  }

  // Sin fila en app_users: si la tabla está vacía, este es el primer login —
  // se vuelve admin automático. Si ya hay gente, no fue invitado: sin acceso.
  const { count } = await admin.from("app_users").select("id", { count: "exact", head: true });
  if (count === 0) {
    const email = authData.user.email ?? "";
    await admin.from("app_users").insert({ id: authData.user.id, email, role: "admin" });
    return { id: authData.user.id, email, role: "admin" };
  }
  return null;
}

/** Guard: sin sesión o sin acceso → /login. Toda página de (dashboard) lo llama. */
export async function requireUser(): Promise<Usuario> {
  const usuario = await getUsuario();
  if (!usuario) redirect("/login");
  return usuario;
}

/** Guard por rol: fuera de nivel → a Campañas (la página que todos pueden ver). */
export async function requireAdmin(): Promise<Usuario> {
  const usuario = await requireUser();
  if (usuario.role !== "admin") redirect("/");
  return usuario;
}
