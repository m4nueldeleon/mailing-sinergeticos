/**
 * Tipos y constantes de Axis SIN el cliente de Postgres — seguro de importar
 * desde componentes de cliente (lib/axis.ts trae `postgres`, que rompe el bundle del navegador).
 */
export type Etapa = "lead" | "registrant" | "attendee" | "customer" | "member";
export type Mercado = "usa" | "mexico" | "latam";
export type NivelConsciencia = "inconsciente" | "problema" | "solucion" | "producto" | "cliente";

export const NIVEL_LABEL: Record<NivelConsciencia, string> = {
  inconsciente: "1. Inconsciente",
  problema: "2. Consciente del problema",
  solucion: "3. Consciente de la solución",
  producto: "4. Consciente del producto (carrito abandonado)",
  cliente: "5. Más consciente / cliente",
};

/**
 * Verificado 2-sep-2026: la policy de `mail_supresion` para el rol lector ya existe
 * (idéntica a `contacts`/`memberships`, RLS sin restricción) — el 0 que devolvía antes
 * era la tabla vacía de verdad, no un bloqueo de permisos. Exclusión reactivada.
 */
export const EXCLUSION_BAJAS_ACTIVA = true;
