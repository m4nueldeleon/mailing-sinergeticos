import { PageHeader } from "@/components/page-header";
import { requireUser } from "@/lib/auth";
import { EditorCampana } from "../editor";
import { listarSegmentosParaSelector, listarPlantillasParaSelector } from "../actions";

export default async function Page() {
  const yo = await requireUser();
  const [segmentos, plantillas] = await Promise.all([listarSegmentosParaSelector(), listarPlantillasParaSelector()]);

  return (
    <>
      <PageHeader title="Nueva campaña" subtitle="Elige el segmento y el contenido — el resto se hace desde aquí mismo." />
      <EditorCampana segmentos={segmentos} plantillas={plantillas} yoId={yo.id} />
    </>
  );
}
