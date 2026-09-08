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
  regiones?: string[];
  ciudades?: string[];
  mercados?: Mercado[];
  /** solo contactos con membresía en este estado — lee contacts.membresia directo (ver nota abajo) */
  membresia?: "activa" | "expirada" | "revocada" | "inactiva";
  /** descartar contactos sin actividad en más de N días (cuida la reputación) */
  activosEnDias?: number;
  nivelConsciencia?: NivelConsciencia[];
  /** `contacts.first_funnel_slug` — embudo por el que llegó la primera vez (first-touch) */
  embudosOrigen?: string[];
  /** `touchpoints.funnel_slug` — tocó este embudo EN CUALQUIER MOMENTO, no solo al llegar.
   *  Distinto de `embudosOrigen`: alguien pudo llegar por otro embudo y después entrar a este
   *  (ej. abandonó el carrito de Legendaria sin haber llegado originalmente por ahí). */
  tocoEmbudo?: string[];
  /** coincidencia parcial contra `purchases.product_name` (los nombres reales no son un catálogo cerrado) */
  compraProducto?: string;
  /** descarta a quien YA compró un producto que coincida (ej. no repetirle a quien ya compró Legendaria) */
  compraProductoExcluir?: string;
}

export interface ContactoAxis {
  id: string;
  email: string;
  first_name: string | null;
  full_name: string | null;
  country: string | null;
  region: string | null;
  lifecycle_stage: Etapa;
  nivelConsciencia: NivelConsciencia;
  puntaje: number;
  firstFunnelSlug: string | null;
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
    select c.id, c.email_normalized as email, c.first_name, c.full_name, c.country, c.region, c.lifecycle_stage,
           c.first_funnel_slug as "firstFunnelSlug",
           (${sql.unsafe(NIVEL_SQL)}) as "nivelConsciencia",
           (${sql.unsafe(PUNTAJE_SQL)})::int as puntaje
    from contacts c
    where true
      ${f.etapas?.length ? sql`and c.lifecycle_stage = any(${f.etapas})` : sql``}
      ${f.paises?.length ? sql`and c.country = any(${f.paises})` : sql``}
      ${f.regiones?.length ? sql`and c.region = any(${f.regiones})` : sql``}
      ${f.ciudades?.length ? sql`and c.city = any(${f.ciudades})` : sql``}
      ${f.mercados?.length ? sql`and c.ghl_account = any(${f.mercados})` : sql``}
      ${f.membresia ? sql`and c.membresia = ${f.membresia}` : sql``}
      ${f.activosEnDias ? sql`and c.last_activity_at >= now() - make_interval(days => ${f.activosEnDias})` : sql``}
      ${f.nivelConsciencia?.length ? sql`and (${sql.unsafe(NIVEL_SQL)}) = any(${f.nivelConsciencia})` : sql``}
      ${f.embudosOrigen?.length ? sql`and c.first_funnel_slug = any(${f.embudosOrigen})` : sql``}
      ${f.tocoEmbudo?.length ? sql`and exists (select 1 from touchpoints tp where tp.contact_id = c.id and tp.funnel_slug = any(${f.tocoEmbudo}))` : sql``}
      ${f.compraProducto ? sql`and exists (select 1 from purchases p where p.contact_id = c.id and p.product_name ilike ${"%" + f.compraProducto + "%"})` : sql``}
      ${f.compraProductoExcluir ? sql`and not exists (select 1 from purchases p where p.contact_id = c.id and p.product_name ilike ${"%" + f.compraProductoExcluir + "%"})` : sql``}
      ${EXCLUSION_BAJAS_ACTIVA ? sql`and c.email_normalized not in (select email from mail_supresion)` : sql``}
    order by puntaje desc, c.last_activity_at desc nulls last
    limit ${limite} offset ${offset}
  `;
  return filas;
}

export interface AperturaConContacto {
  contactId: string;
  /** `sent_at` de ese envío — solo cuenta un touchpoint si pasó DESPUÉS. */
  despuesDe: string;
}

/**
 * De quienes abrieron un correo, cuántos tuvieron después un touchpoint de
 * EMBUDO (`funnel_slug` no nulo) — la señal de que el correo no solo se vio,
 * sino que trajo tráfico de vuelta. `touchpoints` está particionada por mes:
 * siempre se filtra por `occurred_at` (nota del contrato en docs/03).
 */
export async function contarEntradasAFunnelTrasApertura(aperturas: AperturaConContacto[]): Promise<number> {
  if (aperturas.length === 0) return 0;
  const sql = axisSql();
  const ids = aperturas.map((a) => a.contactId);
  const minFecha = aperturas.reduce((min, a) => (a.despuesDe < min ? a.despuesDe : min), aperturas[0].despuesDe);
  const filas = await sql<{ contact_id: string; primer_touchpoint: string }[]>`
    select contact_id, min(occurred_at) as primer_touchpoint
    from touchpoints
    where contact_id = any(${ids})
      and funnel_slug is not null
      and occurred_at >= ${minFecha}
    group by contact_id
  `;
  const primerTouchpoint = new Map(filas.map((f) => [f.contact_id, f.primer_touchpoint]));
  let n = 0;
  for (const a of aperturas) {
    const tp = primerTouchpoint.get(a.contactId);
    if (tp && tp > a.despuesDe) n += 1;
  }
  return n;
}

export async function contarSegmento(f: FiltrosSegmento): Promise<number> {
  const sql = axisSql();
  const [fila] = await sql<{ n: number }[]>`
    select count(*)::int as n
    from contacts c
    where true
      ${f.etapas?.length ? sql`and c.lifecycle_stage = any(${f.etapas})` : sql``}
      ${f.paises?.length ? sql`and c.country = any(${f.paises})` : sql``}
      ${f.regiones?.length ? sql`and c.region = any(${f.regiones})` : sql``}
      ${f.ciudades?.length ? sql`and c.city = any(${f.ciudades})` : sql``}
      ${f.mercados?.length ? sql`and c.ghl_account = any(${f.mercados})` : sql``}
      ${f.membresia ? sql`and c.membresia = ${f.membresia}` : sql``}
      ${f.activosEnDias ? sql`and c.last_activity_at >= now() - make_interval(days => ${f.activosEnDias})` : sql``}
      ${f.nivelConsciencia?.length ? sql`and (${sql.unsafe(NIVEL_SQL)}) = any(${f.nivelConsciencia})` : sql``}
      ${f.embudosOrigen?.length ? sql`and c.first_funnel_slug = any(${f.embudosOrigen})` : sql``}
      ${f.tocoEmbudo?.length ? sql`and exists (select 1 from touchpoints tp where tp.contact_id = c.id and tp.funnel_slug = any(${f.tocoEmbudo}))` : sql``}
      ${f.compraProducto ? sql`and exists (select 1 from purchases p where p.contact_id = c.id and p.product_name ilike ${"%" + f.compraProducto + "%"})` : sql``}
      ${f.compraProductoExcluir ? sql`and not exists (select 1 from purchases p where p.contact_id = c.id and p.product_name ilike ${"%" + f.compraProductoExcluir + "%"})` : sql``}
      ${EXCLUSION_BAJAS_ACTIVA ? sql`and c.email_normalized not in (select email from mail_supresion)` : sql``}
  `;
  return fila?.n ?? 0;
}
