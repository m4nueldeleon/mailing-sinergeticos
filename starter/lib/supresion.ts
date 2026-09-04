import { createSupabaseAdmin } from "./supabase/server";

/**
 * Supresión PROPIA de la app y bitácora de eventos de correo (`suppression`,
 * `mail_events` de esquema/mailing-propuesto.sql).
 *
 * Antes esto vivía detrás de DATABASE_URL (conexión directa) y se quedaba
 * en silencio sin ella — pero todo lo que hace aquí (insertar 2 filas) ya lo
 * puede hacer perfectamente el cliente de Supabase con service_role, que sí
 * está configurado desde el día uno. Un webhook no debería depender de una
 * variable de entorno extra que nadie más usa.
 */
export type MotivoSupresion = "baja" | "rebote_duro" | "rebote_suave_x3" | "queja" | "manual" | "axis";

export async function agregarSupresion(email: string, motivo: MotivoSupresion, campaignId?: string): Promise<void> {
  const e = email.toLowerCase().trim();
  const admin = await createSupabaseAdmin();
  const { error } = await admin.from("suppression").upsert(
    { email: e, reason: motivo, campaign_id: campaignId ?? null },
    { onConflict: "email", ignoreDuplicates: true },
  );
  if (error) console.error("[supresion] no se pudo guardar", { email: e, motivo, error: error.message });
}

export async function registrarEvento(providerId: string, tipo: string, payload: unknown): Promise<void> {
  const admin = await createSupabaseAdmin();
  const { error } = await admin.from("mail_events").insert({ provider_id: providerId, type: tipo, payload });
  if (error) console.error("[evento] no se pudo guardar", { providerId, tipo, error: error.message });
}
