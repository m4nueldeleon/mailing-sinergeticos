import { PageHeader } from "@/components/page-header";
import { SegmentosPanel } from "./segmentos-panel";

export default function Page() {
  return (
    <>
      <PageHeader title="Listas y segmentos" subtitle="Filtros sobre los contactos de Axis. Nada se copia: se lee cada vez." />
      <SegmentosPanel />
    </>
  );
}
