import { PageHeader } from "@/components/page-header";
import { listarReportes } from "./actions";

function fmt(n: number): string {
  return n.toLocaleString("es-MX");
}
function pct(n: number): string {
  return `${n.toFixed(1)}%`;
}

export default async function Page() {
  const reportes = await listarReportes();

  return (
    <>
      <PageHeader title="Reportes" subtitle="Lo que Resend nos cuenta por webhook, campaña por campaña." />

      {reportes.length === 0 ? (
        <section className="glass rise p-6 text-center text-[var(--text-2)]">
          Todavía no hay campañas enviadas con datos que mostrar.
        </section>
      ) : (
        <div className="space-y-4">
          {reportes.map((r) => (
            <section key={r.id} className="glass rise space-y-4 p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-display text-lg font-semibold">{r.name}</h2>
                <span className={`chip ${r.semaforo === "rojo" ? "bg-red-500/15 text-red-600" : "bg-emerald-500/15 text-emerald-600"}`}>
                  {r.semaforo === "rojo" ? "⚠ Rebotes/quejas altos" : "✓ Reputación sana"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-7">
                <div>
                  <p className="text-xs text-[var(--text-3)]">Enviados</p>
                  <p className="font-display text-xl font-semibold">{fmt(r.enviados)}</p>
                </div>
                <div>
                  <p className="text-xs text-[var(--text-3)]">Entregados</p>
                  <p className="font-display text-xl font-semibold">{fmt(r.entregados)}</p>
                </div>
                <div>
                  <p className="text-xs text-[var(--text-3)]">Aperturas</p>
                  <p className="font-display text-xl font-semibold">
                    {fmt(r.aperturas)} <span className="text-sm text-[var(--text-2)]">({pct(r.tasaApertura)})</span>
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[var(--text-3)]">Clics</p>
                  <p className="font-display text-xl font-semibold">
                    {fmt(r.clics)} <span className="text-sm text-[var(--text-2)]">({pct(r.tasaClic)})</span>
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[var(--text-3)]">Rebotes</p>
                  <p className={`font-display text-xl font-semibold ${r.tasaRebote > 2 ? "text-red-600" : ""}`}>
                    {fmt(r.rebotados)} <span className="text-sm text-[var(--text-2)]">({pct(r.tasaRebote)})</span>
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[var(--text-3)]">Quejas</p>
                  <p className={`font-display text-xl font-semibold ${r.tasaQueja > 0.1 ? "text-red-600" : ""}`}>
                    {fmt(r.quejas)} <span className="text-sm text-[var(--text-2)]">({pct(r.tasaQueja)})</span>
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[var(--text-3)]">Errores</p>
                  <p className="font-display text-xl font-semibold">{fmt(r.errores)}</p>
                </div>
              </div>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
