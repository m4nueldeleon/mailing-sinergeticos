import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { obtenerPlantilla } from "../actions";
import { EditorPlantilla } from "../editor";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const plantilla = await obtenerPlantilla(id);
  if (!plantilla) notFound();

  return (
    <>
      <PageHeader title={plantilla.name} subtitle="Arma el correo por bloques o pega HTML crudo." />
      <EditorPlantilla plantilla={plantilla} />
    </>
  );
}
