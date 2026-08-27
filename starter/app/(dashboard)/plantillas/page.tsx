import { PageHeader } from "@/components/page-header";
import { PorConstruir } from "@/components/por-construir";

const ITEMS = [
  "Plantilla base (ejemplos/plantilla-base.html) con variables {{first_name}}, {{unsubscribe_url}}",
  "Editor por bloques: título, texto, botón, imagen, separador + modo HTML",
  "Vista previa claro/oscuro y en móvil",
  "Biblioteca de plantillas guardadas; duplicar",
  "Validación: no se puede guardar sin liga de baja ni sin versión texto",
] as const;

export default function Page() {
  return (
    <>
      <PageHeader title="Plantillas" subtitle="Correos con la marca. Pie con liga de baja obligatoria." />
      <PorConstruir items={ITEMS} />
    </>
  );
}
