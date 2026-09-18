"use client";

import { useActionState } from "react";
import { suprimirCandidato, type CandidatoInactivo, type EstadoSuprimir } from "./actions";

const ESTADO_INICIAL: EstadoSuprimir = { ok: false, error: null };

function Fila({ candidato }: { candidato: CandidatoInactivo }) {
  const [estado, accion, enviando] = useActionState(suprimirCandidato, ESTADO_INICIAL);

  return (
    <tr className="border-b border-[var(--border)] last:border-0">
      <td className="py-2 pr-4 text-sm">{candidato.email}</td>
      <td className="py-2 pr-4 text-sm tabular-nums text-[var(--text-2)]">{candidato.enviados}</td>
      <td className="py-2 pr-4 text-sm text-[var(--text-2)]">
        {candidato.ultimoEnvio ? new Date(candidato.ultimoEnvio).toLocaleDateString("es-MX") : "—"}
      </td>
      <td className="py-2 text-right">
        {estado.ok ? (
          <span className="chip">Suprimido</span>
        ) : (
          <form action={accion}>
            <input type="hidden" name="email" value={candidato.email} />
            <button
              type="submit"
              disabled={enviando}
              className="chip cursor-pointer border-red-500/30 bg-red-500/10 text-red-600 disabled:opacity-60"
            >
              {enviando ? "…" : "Suprimir"}
            </button>
          </form>
        )}
        {estado.error && <p className="mt-1 text-xs text-red-600">{estado.error}</p>}
      </td>
    </tr>
  );
}

export function PanelCandidatos({ candidatos }: { candidatos: CandidatoInactivo[] }) {
  if (candidatos.length === 0) {
    return (
      <section className="glass rise p-6 text-center text-[var(--text-2)]">
        Nadie califica todavía (3 correos o más sin ninguna apertura) — hace falta que corran
        campañas reales para tener esta señal.
      </section>
    );
  }

  return (
    <section className="glass rise p-6">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div>
          <h2 className="font-display text-lg font-semibold">Candidatos a suprimir</h2>
          <p className="text-sm text-[var(--text-2)]">
            3 correos o más, cero aperturas. Sacarlos de las próximas campañas protege la
            reputación del dominio.
          </p>
        </div>
        <span className="chip">{candidatos.length}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-[var(--border)] text-xs uppercase tracking-wide text-[var(--text-3)]">
              <th className="py-2 pr-4 font-medium">Correo</th>
              <th className="py-2 pr-4 font-medium">Enviados</th>
              <th className="py-2 pr-4 font-medium">Último envío</th>
              <th className="py-2 text-right font-medium">Acción</th>
            </tr>
          </thead>
          <tbody>
            {candidatos.map((c) => (
              <Fila key={c.email} candidato={c} />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
