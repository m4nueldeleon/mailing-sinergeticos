import { PageHeader } from "@/components/page-header";
import { EditorPlantilla } from "../editor";

export default function Page() {
  return (
    <>
      <PageHeader title="Nueva plantilla" subtitle="Arma el correo por bloques o pega HTML crudo." />
      <EditorPlantilla />
    </>
  );
}
