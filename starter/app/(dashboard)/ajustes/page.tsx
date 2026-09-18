import { requireAdmin } from "@/lib/auth";
import { PageHeader } from "@/components/page-header";
import { listarUsuarios } from "./actions";
import { UsuariosPanel } from "./usuarios-panel";
import { ConfiguracionPanel } from "./configuracion-panel";

export default async function Page() {
  const yo = await requireAdmin();
  const usuarios = await listarUsuarios();

  return (
    <>
      <PageHeader title="Ajustes" subtitle="Usuarios, remitente, límites y salud de la configuración." />
      <div className="space-y-5">
        <UsuariosPanel usuarios={usuarios} miId={yo.id} />
        <ConfiguracionPanel />
      </div>
    </>
  );
}
