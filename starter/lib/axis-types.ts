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
 * La exclusión de `mail_supresion` está DESACTIVADA a propósito: esa tabla hoy devuelve 0
 * filas para el rol lector (falta su RLS policy — pendiente urgente con Manuel/David), así
 * que el `not in` que había antes nunca excluía a nadie de verdad — mentía que sí. Se quita
 * hasta que la policy exista.
 */
export const EXCLUSION_BAJAS_ACTIVA = false;
