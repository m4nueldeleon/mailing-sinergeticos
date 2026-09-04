"use server";

import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";

export interface EstadoPassword {
  error: string | null;
}

const MIN_LARGO = 10;

export async function guardarPasswordNueva(_prev: EstadoPassword, formData: FormData): Promise<EstadoPassword> {
  const password = String(formData.get("password") ?? "");
  const confirmar = String(formData.get("confirmar") ?? "");

  if (password.length < MIN_LARGO) return { error: `La contraseña debe tener al menos ${MIN_LARGO} caracteres.` };
  if (password !== confirmar) return { error: "Las contraseñas no coinciden." };

  const supabase = await createSupabaseServer();
  const { data, error: userError } = await supabase.auth.getUser();
  if (userError || !data.user) return { error: "Tu sesión expiró. Abre de nuevo el enlace de tu correo." };

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: "No se pudo guardar la contraseña. Intenta de nuevo." };

  redirect("/");
}
