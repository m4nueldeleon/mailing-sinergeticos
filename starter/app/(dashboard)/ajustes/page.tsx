import { requireAdmin } from "@/lib/auth";
import { PageHeader } from "@/components/page-header";
import { PorConstruir } from "@/components/por-construir";
import { listarUsuarios } from "./actions";
import { UsuariosPanel } from "./usuarios-panel";

const PENDIENTE = [
  "Remitente y reply-to por defecto; verificación del dominio en Resend",
  "MAIL_ENABLED, MAIL_DAILY_CAP y ventana de calentamiento",
  "Estado de configuración: /api/health",
  "Bitácora de acciones sensibles (audit_log)",
] as const;

export default async function Page() {
  const yo = await requireAdmin();
  const usuarios = await listarUsuarios();

  return (
    <>
      <PageHeader title="Ajustes" subtitle="Usuarios, remitente, límites y salud de la configuración." />
      <div className="space-y-5">
        <UsuariosPanel usuarios={usuarios} miId={yo.id} />
        <PorConstruir items={PENDIENTE} />
      </div>
    </>
  );
}
