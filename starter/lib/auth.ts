/**
 * STUB de autenticación. Sustituir por Supabase Auth (@supabase/ssr) + tabla app_users.
 * Mientras tanto devuelve un usuario de demostración para poder ver el shell.
 * Cuando lo implementes: redirige a /login si no hay sesión y lee el rol de app_users.
 */
export type Rol = "admin" | "editor";
export interface Usuario {
  id: string;
  email: string;
  role: Rol;
}

export async function requireUser(): Promise<Usuario> {
  return { id: "demo", email: "demo@sinergeticos.com", role: "admin" };
}
