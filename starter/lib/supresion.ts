import postgres from "postgres";
import { env } from "./env";

/**
 * Supresión PROPIA de la app (tabla `suppression` de esquema/mailing-propuesto.sql).
 * Sin DATABASE_URL solo deja constancia en consola: así el starter arranca sin base.
 * Pendiente (docs/03): sincronizar cada alta a mail_supresion de Axis.
 */
export type MotivoSupresion = "baja" | "rebote_duro" | "rebote_suave_x3" | "queja" | "manual" | "axis";

let _sql: ReturnType<typeof postgres> | null = null;
function db() {
  const url = env.databaseUrl();
  if (!url) return null;
  return (_sql ??= postgres(url, { max: 3, ssl: "require", prepare: false }));
}

export async function agregarSupresion(email: string, motivo: MotivoSupresion, campaignId?: string): Promise<void> {
  const e = email.toLowerCase().trim();
  const sql = db();
  if (!sql) {
    console.warn(`[supresion] sin DATABASE_URL: ${e} (${motivo}) NO se guardó`);
    return;
  }
  await sql`
    insert into suppression (email, reason, campaign_id)
    values (${e}, ${motivo}, ${campaignId ?? null})
    on conflict (email) do nothing
  `;
}

export async function registrarEvento(providerId: string, tipo: string, payload: unknown): Promise<void> {
  const sql = db();
  if (!sql) {
    console.warn(`[evento] sin DATABASE_URL: ${tipo} ${providerId}`);
    return;
  }
  await sql`insert into mail_events (provider_id, type, payload) values (${providerId}, ${tipo}, ${sql.json(payload as never)})`;
}
