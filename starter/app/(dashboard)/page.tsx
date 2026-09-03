import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { listarCampanas, type EstadoCampana } from "./campanas/actions";

const ESTADO_LABEL: Record<EstadoCampana, string> = {
  borrador: "Borrador",
  en_revision: "En revisión",
  aprobada: "Aprobada",
  programada: "Programada",
  enviando: "Enviando",
  pausada: "Pausada",
  enviada: "Enviada",
  cancelada: "Cancelada",
};

const ESTADO_COLOR: Record<EstadoCampana, string> = {
  borrador: "bg-[var(--veil)] text-[var(--text-2)]",
  en_revision: "bg-amber-500/15 text-amber-600",
  aprobada: "bg-sky-500/15 text-sky-600",
  programada: "bg-sky-500/15 text-sky-600",
  enviando: "bg-[var(--accent-soft)] text-[var(--accent)]",
  pausada: "bg-amber-500/15 text-amber-600",
  enviada: "bg-emerald-500/15 text-emerald-600",
  cancelada: "bg-red-500/15 text-red-600",
};

export default async function Page() {
  const campanas = await listarCampanas();

  return (
    <>
      <PageHeader
        title="Campañas"
        subtitle="Crea, aprueba y manda correos masivos a segmentos de Axis."
        action={
          <Link href="/campanas/nueva" className="btn-accent">
            + Nueva campaña
          </Link>
        }
      />

      {campanas.length === 0 ? (
        <section className="glass rise p-6 text-center text-[var(--text-2)]">Sin campañas todavía — crea la primera.</section>
      ) : (
        <section className="glass rise p-2">
          <table className="table-glass">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Estado</th>
                <th>Destinatarios</th>
                <th>Enviados</th>
                <th>Actualizada</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {campanas.map((c) => (
                <tr key={c.id}>
                  <td>{c.name}</td>
                  <td>
                    <span className={`chip ${ESTADO_COLOR[c.status]}`}>{ESTADO_LABEL[c.status]}</span>
                  </td>
                  <td className="text-[var(--text-2)]">{c.totals.recipients ?? "—"}</td>
                  <td className="text-[var(--text-2)]">
                    {c.totals.enviados ?? 0}
                    {c.totals.recipients ? ` / ${c.totals.recipients}` : ""}
                  </td>
                  <td className="text-[var(--text-3)]">{new Date(c.updated_at).toLocaleString("es-MX")}</td>
                  <td>
                    <Link href={`/campanas/${c.id}`} className="btn-ghost !py-1 !text-xs">
                      Abrir
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
