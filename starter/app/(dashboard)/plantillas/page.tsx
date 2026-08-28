import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { listarPlantillas } from "./actions";

export default async function Page() {
  const plantillas = await listarPlantillas();

  return (
    <>
      <PageHeader
        title="Plantillas"
        subtitle="Editor por bloques, HTML crudo y envío de prueba."
        action={
          <Link href="/plantillas/nueva" className="btn-accent">
            + Nueva plantilla
          </Link>
        }
      />

      {plantillas.length === 0 ? (
        <section className="glass rise p-6 text-center text-[var(--text-2)]">Sin plantillas todavía — crea la primera.</section>
      ) : (
        <section className="glass rise p-2">
          <table className="table-glass">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Asunto</th>
                <th>Actualizada</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {plantillas.map((p) => (
                <tr key={p.id}>
                  <td>{p.name}</td>
                  <td className="text-[var(--text-2)]">{p.subject}</td>
                  <td className="text-[var(--text-3)]">{new Date(p.updated_at).toLocaleString("es-MX")}</td>
                  <td>
                    <Link href={`/plantillas/${p.id}`} className="btn-ghost !py-1 !text-xs">
                      Editar
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </>
  );
}
