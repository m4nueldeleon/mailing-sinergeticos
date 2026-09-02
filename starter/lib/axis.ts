import postgres from "postgres";
import { env } from "./env";
import { EXCLUSION_BAJAS_ACTIVA } from "./axis-types";
import type { Etapa, Mercado, NivelConsciencia } from "./axis-types";

export type { Etapa, Mercado, NivelConsciencia } from "./axis-types";
export { NIVEL_LABEL, EXCLUSION_BAJAS_ACTIVA } from "./axis-types";

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

export interface FiltrosSegmento {
  etapas?: Etapa[];
  paises?: string[];
  mercados?: Mercado[];
  /** solo contactos con membresía en este estado — lee contacts.membresia directo (ver nota abajo) */
  membresia?: "activa" | "expirada" | "revocada" | "inactiva";
  /** descartar contactos sin actividad en más de N días (cuida la reputación) */
  activosEnDias?: number;
  nivelConsciencia?: NivelConsciencia[];
}

export interface ContactoAxis {
  id: string;
  email: string;
  first_name: string | null;
  full_name: string | null;
  country: string | null;
  lifecycle_stage: Etapa;
  nivelConsciencia: NivelConsciencia;
  puntaje: number;
}

/**
 * Nivel de consciencia (Eugene Schwartz, adaptado a los campos reales de `contacts`):
 * 1. Inconsciente — nunca se registró a nada.
 * 2. Consciente del problema — se registró, nunca asistió ni compró.
 * 3. Consciente de la solución — asistió a 1+ evento, no compró.
 * 4. Consciente del producto — llegó a pagar y NO completó (carrito abandonado) — el más caliente.
 * 5. Más consciente / cliente — ya compró o su membresía está activa.
 *
 * Puntaje 0-100, transparente (no es un modelo entrenado, es una regla explicable):
 * recencia (hasta 40) + nivel (hasta 30) + bono carrito abandonado (25) + eventos asistidos (hasta 15, tope).
 */
const NIVEL_SQL = `
  case
    when c.purchase_count > 0 or c.membresia = 'activa' then 'cliente'
    when c.checkout_count > 0 and c.purchase_count = 0 then 'producto'
    when c.events_attended > 0 then 'solucion'
    when c.registration_count > 0 then 'problema'
    else 'inconsciente'
  end
`;

const PUNTAJE_SQL = `
  greatest(0, least(100,
    (case
      when c.last_activity_at >= now() - interval '30 days' then 40
      when c.last_activity_at >= now() - interval '90 days' then 25
      when c.last_activity_at >= now() - interval '365 days' then 10
      else 0
     end)
    + (case ${NIVEL_SQL}
        when 'cliente' then 30 when 'producto' then 25 when 'solucion' then 15
        when 'problema' then 8 else 0
       end)
    + (case when c.checkout_count > 0 and c.purchase_count = 0 then 25 else 0 end)
    + least(15, coalesce(c.events_attended, 0) * 5)
  ))
`;

/**
 * Lista un segmento. Cada filtro es un fragmento parametrizado: nada de concatenar strings.
 */
export async function listarSegmento(f: FiltrosSegmento, limite = 1000, offset = 0): Promise<ContactoAxis[]> {
  const sql = axisSql();
  const filas = await sql<ContactoAxis[]>`
    select c.id, c.email_normalized as email, c.first_name, c.full_name, c.country, c.lifecycle_stage,
           (${sql.unsafe(NIVEL_SQL)}) as "nivelConsciencia",
           (${sql.unsafe(PUNTAJE_SQL)})::int as puntaje
    from contacts c
    where true
      ${f.etapas?.length ? sql`and c.lifecycle_stage = any(${f.etapas})` : sql``}
      ${f.paises?.length ? sql`and c.country = any(${f.paises})` : sql``}
      ${f.mercados?.length ? sql`and c.ghl_account = any(${f.mercados})` : sql``}
      ${f.membresia ? sql`and c.membresia = ${f.membresia}` : sql``}
      ${f.activosEnDias ? sql`and c.last_activity_at >= now() - make_interval(days => ${f.activosEnDias})` : sql``}
      ${f.nivelConsciencia?.length ? sql`and (${sql.unsafe(NIVEL_SQL)}) = any(${f.nivelConsciencia})` : sql``}
      ${EXCLUSION_BAJAS_ACTIVA ? sql`and c.email_normalized not in (select email from mail_supresion)` : sql``}
    order by puntaje desc, c.last_activity_at desc nulls last
    limit ${limite} offset ${offset}
  `;
  return filas;
}

export async function contarSegmento(f: FiltrosSegmento): Promise<number> {
  const sql = axisSql();
  const [fila] = await sql<{ n: number }[]>`
    select count(*)::int as n
    from contacts c
    where true
      ${f.etapas?.length ? sql`and c.lifecycle_stage = any(${f.etapas})` : sql``}
      ${f.paises?.length ? sql`and c.country = any(${f.paises})` : sql``}
      ${f.mercados?.length ? sql`and c.ghl_account = any(${f.mercados})` : sql``}
      ${f.membresia ? sql`and c.membresia = ${f.membresia}` : sql``}
      ${f.activosEnDias ? sql`and c.last_activity_at >= now() - make_interval(days => ${f.activosEnDias})` : sql``}
      ${f.nivelConsciencia?.length ? sql`and (${sql.unsafe(NIVEL_SQL)}) = any(${f.nivelConsciencia})` : sql``}
      ${EXCLUSION_BAJAS_ACTIVA ? sql`and c.email_normalized not in (select email from mail_supresion)` : sql``}
  `;
  return fila?.n ?? 0;
}
