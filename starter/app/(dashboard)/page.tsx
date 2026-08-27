import { PageHeader } from "@/components/page-header";
import { PorConstruir } from "@/components/por-construir";

const ITEMS = [
  "Lista de campañas con estado (borrador → en revisión → aprobada → programada → enviando → enviada)",
  "Crear campaña: segmento → contenido → prueba → aprobación (4 ojos) → programar",
  "Congelar destinatarios al programar (campaign_recipients), dedupe por email",
  "Envío en lotes de 100 con lib/resend.ts, cola y reintentos",
  "Pausar / cancelar campaña en curso",
  "Envío de prueba a correos internos",
] as const;

export default function Page() {
  return (
    <>
      <PageHeader title="Campañas" subtitle="Crea, aprueba y manda correos masivos a segmentos de Axis." />
      <PorConstruir items={ITEMS} />
    </>
  );
}
