import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { requireUser } from "@/lib/auth";
import { obtenerCampana, listarSegmentosParaSelector, listarPlantillasParaSelector } from "../actions";
import { EditorCampana } from "../editor";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const yo = await requireUser();
  const [campana, segmentos, plantillas] = await Promise.all([
    obtenerCampana(id),
    listarSegmentosParaSelector(),
    listarPlantillasParaSelector(),
  ]);
  if (!campana) notFound();

  return (
    <>
      <PageHeader title={campana.name} subtitle="Segmento → contenido → prueba → aprobación → envío." />
      <EditorCampana campana={campana} segmentos={segmentos} plantillas={plantillas} yoId={yo.id} />
    </>
  );
}
