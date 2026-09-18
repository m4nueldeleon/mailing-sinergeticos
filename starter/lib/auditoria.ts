import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Bitácora de acciones sensibles (`audit_log`). No debe poder tumbar la
 * acción real si falla — por eso nunca se le hace `await` bloqueante desde
 * el flujo principal sin capturar el error.
 */
export async function registrarAuditoria(
  admin: SupabaseClient,
  userId: string,
  action: string,
  entity?: string,
  entityId?: string,
  detail?: Record<string, unknown>,
): Promise<void> {
  const { error } = await admin.from("audit_log").insert({ user_id: userId, action, entity, entity_id: entityId, detail: detail ?? {} });
  if (error) console.error("[auditoria] no se pudo registrar", { action, entity, entityId, error: error.message });
}
