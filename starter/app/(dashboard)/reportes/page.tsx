import { PageHeader } from "@/components/page-header";
import { PorConstruir } from "@/components/por-construir";

const ITEMS = [
  "Por campaña: enviados, entregados, rebotes, quejas, aperturas, clics, bajas",
  "Línea de tiempo de las primeras 48 h",
  "Semáforo global: quejas > 0.1 % o rebotes > 2 % = rojo",
  "Clics por liga; comparativo entre campañas",
  "Exportar CSV del reporte (queda en audit_log)",
] as const;

export default function Page() {
  return (
    <>
      <PageHeader title="Reportes" subtitle="Lo que Resend nos cuenta por webhook, campaña por campaña." />
      <PorConstruir items={ITEMS} />
    </>
  );
}
