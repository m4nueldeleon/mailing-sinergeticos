import { PageHeader } from "@/components/page-header";
import { PorConstruir } from "@/components/por-construir";

const ITEMS = [
  "Constructor de filtros: etapa, país, mercado, membresía, compra, embudo, última actividad",
  "Vista previa: conteo (lib/axis.ts → contarSegmento) y muestra de 20",
  "Guardar segmento reutilizable (tabla segments)",
  "Exclusión automática de mail_supresion (Axis) + suppression (propia)",
  "Importar CSV puntual etiquetado como fuente csv",
  "SQL crudo solo para admin (conexión de solo lectura)",
] as const;

export default function Page() {
  return (
    <>
      <PageHeader title="Listas y segmentos" subtitle="Filtros sobre los contactos de Axis. Nada se copia: se lee cada vez." />
      <PorConstruir items={ITEMS} />
    </>
  );
}
