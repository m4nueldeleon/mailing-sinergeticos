/** Tarjeta de vidrio con la lista de lo que falta en esta sección (según docs/06). */
export function PorConstruir({ items }: { items: readonly string[] }) {
  return (
    <section className="glass rise p-6">
      <div className="mb-3 flex items-center gap-2">
        <span className="chip">Por construir</span>
        <span className="text-sm text-[var(--text-3)]">Requisitos en docs/06-requisitos-funcionales.md</span>
      </div>
      <ul className="grid gap-2 sm:grid-cols-2">
        {items.map((t) => (
          <li key={t} className="flex items-start gap-2 rounded-xl border border-[var(--border)] bg-[var(--veil)] px-3 py-2 text-sm">
            <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-[var(--accent)]" />
            {t}
          </li>
        ))}
      </ul>
    </section>
  );
}
