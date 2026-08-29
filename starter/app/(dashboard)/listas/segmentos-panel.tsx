"use client";

import { useActionState, useState } from "react";
import {
  previsualizarSegmento,
  guardarSegmento,
  type EstadoPrevia,
  type EstadoGuardar,
} from "./actions";
import { NIVEL_LABEL, EXCLUSION_BAJAS_ACTIVA, type NivelConsciencia } from "@/lib/axis-types";

const ESTADO_PREVIA: EstadoPrevia = { ok: false, error: null, total: null, muestra: [], filtros: null };
const ESTADO_GUARDAR: EstadoGuardar = { ok: false, error: null };

const ETAPAS = [
  { value: "lead", label: "Lead" },
  { value: "registrant", label: "Registrado" },
  { value: "attendee", label: "Asistió" },
  { value: "customer", label: "Compró" },
  { value: "member", label: "Miembro" },
] as const;

const MERCADOS = [
  { value: "usa", label: "USA" },
  { value: "mexico", label: "México" },
  { value: "latam", label: "Latam" },
] as const;

const NIVELES: { value: NivelConsciencia; label: string }[] = (
  Object.entries(NIVEL_LABEL) as [NivelConsciencia, string][]
).map(([value, label]) => ({ value, label }));

export function SegmentosPanel() {
  const [previa, previsualizarAction, calculando] = useActionState(previsualizarSegmento, ESTADO_PREVIA);
  const [guardado, guardarAction, guardando] = useActionState(guardarSegmento, ESTADO_GUARDAR);
  const [nombreSegmento, setNombreSegmento] = useState("");

  return (
    <div className="space-y-5">
      <form action={previsualizarAction} className="glass rise space-y-5 p-6">
        <div>
          <h2 className="font-display text-lg font-semibold">Filtros</h2>
          <p className="text-sm text-[var(--text-2)]">Se leen en vivo de Axis — nada se copia.</p>
        </div>

        <fieldset className="flex flex-wrap gap-2">
          <legend className="mb-2 w-full text-sm font-medium text-[var(--text-2)]">Etapa</legend>
          {ETAPAS.map((e) => (
            <label key={e.value} className="chip cursor-pointer border-[var(--border)] bg-[var(--veil)] has-[:checked]:border-[var(--accent)] has-[:checked]:bg-[var(--accent-soft)]">
              <input type="checkbox" name="etapas" value={e.value} className="sr-only" />
              {e.label}
            </label>
          ))}
        </fieldset>

        <fieldset className="flex flex-wrap gap-2">
          <legend className="mb-2 w-full text-sm font-medium text-[var(--text-2)]">Mercado</legend>
          {MERCADOS.map((m) => (
            <label key={m.value} className="chip cursor-pointer border-[var(--border)] bg-[var(--veil)] has-[:checked]:border-[var(--accent)] has-[:checked]:bg-[var(--accent-soft)]">
              <input type="checkbox" name="mercados" value={m.value} className="sr-only" />
              {m.label}
            </label>
          ))}
        </fieldset>

        <fieldset className="flex flex-wrap gap-2">
          <legend className="mb-2 w-full text-sm font-medium text-[var(--text-2)]">Nivel de consciencia</legend>
          {NIVELES.map((n) => (
            <label key={n.value} className="chip cursor-pointer border-[var(--border)] bg-[var(--veil)] has-[:checked]:border-[var(--accent)] has-[:checked]:bg-[var(--accent-soft)]">
              <input type="checkbox" name="nivelConsciencia" value={n.value} className="sr-only" />
              {n.label}
            </label>
          ))}
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-3">
          <label className="flex flex-col gap-1.5 text-sm font-medium text-[var(--text-2)]">
            Países (separados por coma)
            <input name="paises" className="input-glass" placeholder="MX, US" />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-[var(--text-2)]">
            Membresía
            <select name="membresia" defaultValue="" className="input-glass">
              <option value="">Cualquiera</option>
              <option value="activa">Activa</option>
              <option value="expirada">Expirada</option>
              <option value="revocada">Revocada</option>
              <option value="inactiva">Inactiva</option>
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-[var(--text-2)]">
            Activos en los últimos N días
            <input name="activosEnDias" type="number" min={1} className="input-glass" placeholder="540" />
          </label>
        </div>

        <button type="submit" disabled={calculando} className="btn-accent">
          {calculando ? "Calculando…" : "Vista previa"}
        </button>
      </form>

      {previa.error ? (
        <p className="flow-error rounded-xl border border-[var(--danger)] bg-[var(--danger-soft)] px-4 py-3 text-sm text-[var(--danger)]">
          {previa.error}
        </p>
      ) : null}

      {previa.ok ? (
        <section className="glass rise space-y-4 p-6">
          {!EXCLUSION_BAJAS_ACTIVA ? (
            <p className="rounded-xl border border-[var(--danger)] bg-[var(--danger-soft)] px-4 py-3 text-sm text-[var(--danger)]">
              ⚠️ La exclusión de bajas (mail_supresion) todavía no funciona — falta un permiso pendiente con Manuel/David.
              Esta vista previa puede incluir gente que ya se dio de baja. No mandes nada real todavía.
            </p>
          ) : null}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-semibold">
                <span className="flow-pop inline-block">{previa.total}</span> contactos
              </h2>
              <p className="text-sm text-[var(--text-2)]">Muestra de los primeros {previa.muestra.length}.</p>
            </div>
            <form action={guardarAction} className="flex items-center gap-2">
              <input type="hidden" name="filtros" value={JSON.stringify(previa.filtros)} />
              <input
                name="nombre"
                required
                value={nombreSegmento}
                onChange={(e) => setNombreSegmento(e.target.value)}
                className="input-glass !py-1.5 !text-sm"
                placeholder="Nombre del segmento"
              />
              <button type="submit" disabled={guardando} className="btn-ghost">
                {guardando ? "Guardando…" : "Guardar segmento"}
              </button>
            </form>
          </div>
          {guardado.error ? <p className="text-sm text-[var(--danger)]">{guardado.error}</p> : null}
          {guardado.ok ? <p className="text-sm text-[var(--success)]">Segmento guardado.</p> : null}

          <table className="table-glass">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Correo</th>
                <th>País</th>
                <th>Etapa</th>
                <th>Nivel de consciencia</th>
                <th>Puntaje</th>
              </tr>
            </thead>
            <tbody>
              {previa.muestra.map((c) => (
                <tr key={c.id}>
                  <td>{c.full_name || c.first_name || "—"}</td>
                  <td>{c.email}</td>
                  <td>{c.country || "—"}</td>
                  <td className="capitalize">{c.lifecycle_stage}</td>
                  <td>{NIVEL_LABEL[c.nivelConsciencia]}</td>
                  <td>{c.puntaje}</td>
                </tr>
              ))}
              {previa.muestra.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-[var(--text-3)]">
                    Sin contactos con estos filtros.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </section>
      ) : null}
    </div>
  );
}
