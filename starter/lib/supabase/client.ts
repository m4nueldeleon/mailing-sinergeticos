"use client";

import { createBrowserClient } from "@supabase/ssr";

/** Cliente Supabase para componentes de navegador — necesario para instalar
 * la sesión que viaja en el # de la URL de los enlaces de invitación/recuperación
 * (@supabase/ssr en modo servidor no la ve; solo existe una vez hidratado el navegador). */
export function createSupabaseBrowser() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error("Faltan variables de entorno: NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }
  return createBrowserClient(url, anonKey);
}
