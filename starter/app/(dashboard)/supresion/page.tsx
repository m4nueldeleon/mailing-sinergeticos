import { PageHeader } from "@/components/page-header";
import { PorConstruir } from "@/components/por-construir";

const ITEMS = [
  "Lista con motivo y fecha (tabla suppression)",
  "Alta manual por admin (motivo manual)",
  "Sincronización a mail_supresion de Axis (columna synced_to_axis_at)",
  "Importar la supresión actual de Axis al arrancar",
  "Buscar un correo y ver su historial",
] as const;

export default function Page() {
  return (
    <>
      <PageHeader title="Supresión" subtitle="Bajas, rebotes y quejas. Se respeta en esta app y en Axis." />
      <PorConstruir items={ITEMS} />
    </>
  );
}
