import { PageHeader } from "@/components/page-header";
import { PorConstruir } from "@/components/por-construir";
import { PanelCandidatos } from "./panel-candidatos";
import { obtenerCandidatosInactivos } from "./actions";

const ITEMS = [
  "Sincronización a mail_supresion de Axis (columna synced_to_axis_at) — pendiente de acordar con su equipo",
  "Importar la supresión actual de Axis al arrancar",
  "Buscar un correo y ver su historial",
] as const;

export default async function Page() {
  const candidatos = await obtenerCandidatosInactivos();

  return (
    <>
      <PageHeader title="Supresión" subtitle="Bajas, rebotes y quejas. Se respeta en esta app y en Axis." />
      <div className="space-y-6">
        <PanelCandidatos candidatos={candidatos} />
        <PorConstruir items={ITEMS} />
      </div>
    </>
  );
}
