import postgres from "postgres";
import { env } from "./env";

/**
 * Lectura de contactos desde AXIS (fuente de verdad) por una conexión de SOLO LECTURA.
 * Aquí NUNCA se escribe. El esquema está en esquema/axis-contactos.sql.
 */
let _sql: ReturnType<typeof postgres> | null = null;
function axisSql() {
  if (_sql) return _sql;
  const url = env.axisDatabaseUrlRo();
  if (!url) throw new Error("Falta AXIS_DATABASE_URL_RO");
  _sql = postgres(url, { max: 3, ssl: "require", prepare: false });
  return _sql;
}

export type Etapa = "lead" | "registrant" | "attendee" | "customer" | "member";
export type Mercado = "usa" | "mexico" | "latam";

export interface FiltrosSegmento {
  etapas?: Etapa[];
  paises?: string[];
  mercados?: Mercado[];
  /** solo contactos con membresía en este estado */
  membresia?: "activa" | "expirada" | "revocada" | "inactiva";
  /** descartar contactos sin actividad en más de N días (cuida la reputación) */
  activosEnDias?: number;
}

export interface ContactoAxis {
  id: string;
  email: string;
  first_name: string | null;
  full_name: string | null;
  country: string | null;
  lifecycle_stage: Etapa;
}

/**
 * Lista un segmento. Excluye SIEMPRE los correos en mail_supresion de Axis.
 * Cada filtro es un fragmento parametrizado: nada de concatenar strings.
 */
export async function listarSegmento(f: FiltrosSegmento, limite = 1000, offset = 0): Promise<ContactoAxis[]> {
  const sql = axisSql();
  const filas = await sql<ContactoAxis[]>`
    select c.id, c.email_normalized as email, c.first_name, c.full_name, c.country, c.lifecycle_stage
    from contacts c
    where c.email_normalized not in (select email from mail_supresion)
      ${f.etapas?.length ? sql`and c.lifecycle_stage = any(${f.etapas})` : sql``}
      ${f.paises?.length ? sql`and c.country = any(${f.paises})` : sql``}
      ${f.mercados?.length ? sql`and c.ghl_account = any(${f.mercados})` : sql``}
      ${f.membresia ? sql`and exists (select 1 from memberships m where m.contact_id = c.id and m.estado = ${f.membresia})` : sql``}
      ${f.activosEnDias ? sql`and c.last_activity_at >= now() - make_interval(days => ${f.activosEnDias})` : sql``}
    order by c.last_activity_at desc nulls last
    limit ${limite} offset ${offset}
  `;
  return filas;
}

export async function contarSegmento(f: FiltrosSegmento): Promise<number> {
  const sql = axisSql();
  const [fila] = await sql<{ n: number }[]>`
    select count(*)::int as n
    from contacts c
    where c.email_normalized not in (select email from mail_supresion)
      ${f.etapas?.length ? sql`and c.lifecycle_stage = any(${f.etapas})` : sql``}
      ${f.paises?.length ? sql`and c.country = any(${f.paises})` : sql``}
      ${f.mercados?.length ? sql`and c.ghl_account = any(${f.mercados})` : sql``}
      ${f.membresia ? sql`and exists (select 1 from memberships m where m.contact_id = c.id and m.estado = ${f.membresia})` : sql``}
      ${f.activosEnDias ? sql`and c.last_activity_at >= now() - make_interval(days => ${f.activosEnDias})` : sql``}
  `;
  return fila?.n ?? 0;
}
