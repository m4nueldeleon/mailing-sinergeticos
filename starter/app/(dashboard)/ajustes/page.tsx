import { PageHeader } from "@/components/page-header";
import { PorConstruir } from "@/components/por-construir";

const ITEMS = [
  "Usuarios y roles (admin / editor) con Supabase Auth",
  "Remitente y reply-to por defecto; verificación del dominio en Resend",
  "MAIL_ENABLED, MAIL_DAILY_CAP y ventana de calentamiento",
  "Estado de configuración: /api/health",
  "Bitácora de acciones sensibles (audit_log)",
] as const;

export default function Page() {
  return (
    <>
      <PageHeader title="Ajustes" subtitle="Usuarios, remitente, límites y salud de la configuración." />
      <PorConstruir items={ITEMS} />
    </>
  );
}
