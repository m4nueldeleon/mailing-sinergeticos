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

export interface CandidatoInactivo {
  email: string;
  enviados: number;
  ultimoEnvio: string | null;
}

const ENVIADO_O_MAS: readonly string[] = ["enviado", "entregado", "retrasado", "abierto", "clic"];
const ABIERTO_O_MAS: readonly string[] = ["abierto", "clic"];

/**
 * Contactos con `minEnvios` correos o más y CERO aperturas — candidatos a
 * sacar de futuras campañas antes de que sigan dañando la reputación del
 * dominio. Se agrega en JS (mismo patrón que reportes/actions.ts) en vez de
 * SQL con GROUP BY/HAVING porque todo esto vive en la base propia vía
 * Supabase, no en una conexión directa. Ya excluye a quien ya está suprimido.
 */
export async function listarCandidatosInactivos(minEnvios = 3): Promise<CandidatoInactivo[]> {
  const admin = await createSupabaseAdmin();
  const { data: sends } = await admin.from("campaign_sends").select("email, status, sent_at").limit(50000);

  const porEmail = new Map<string, { enviados: number; aperturas: number; ultimoEnvio: string | null }>();
  for (const s of sends ?? []) {
    const status = s.status as string;
    if (!ENVIADO_O_MAS.includes(status)) continue;
    const email = (s.email as string).toLowerCase();
    const actual = porEmail.get(email) ?? { enviados: 0, aperturas: 0, ultimoEnvio: null };
    actual.enviados += 1;
    if (ABIERTO_O_MAS.includes(status)) actual.aperturas += 1;
    const sentAt = s.sent_at as string | null;
    if (sentAt && (!actual.ultimoEnvio || sentAt > actual.ultimoEnvio)) actual.ultimoEnvio = sentAt;
    porEmail.set(email, actual);
  }

  const { data: suprimidos } = await admin.from("suppression").select("email");
  const yaSuprimidos = new Set((suprimidos ?? []).map((s) => (s.email as string).toLowerCase()));

  return [...porEmail.entries()]
    .filter(([email, v]) => v.enviados >= minEnvios && v.aperturas === 0 && !yaSuprimidos.has(email))
    .map(([email, v]) => ({ email, enviados: v.enviados, ultimoEnvio: v.ultimoEnvio }))
    .sort((a, b) => b.enviados - a.enviados);
}
