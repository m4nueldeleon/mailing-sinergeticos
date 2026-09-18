"use client";

import { useActionState, useState } from "react";
import {
  guardarCampana,
  enviarPruebaCampana,
  solicitarRevision,
  regresarABorrador,
  aprobarCampana,
  programarOEnviar,
  pausarCampana,
  reanudarCampana,
  cancelarCampana,
  type EstadoGuardarCampana,
  type EstadoPrueba,
  type EstadoAccionCampana,
  type Campana,
  type SegmentoOpcion,
  type PlantillaOpcion,
} from "./actions";

const ESTADO_GUARDAR: EstadoGuardarCampana = { ok: false, error: null };
const ESTADO_PRUEBA: EstadoPrueba = { ok: false, error: null, enviados: 0 };
const ESTADO_ACCION: EstadoAccionCampana = { ok: false, error: null };

function BotonAccion({
  accion,
  etiqueta,
  confirmar,
  variante = "accent",
}: {
  accion: () => Promise<EstadoAccionCampana>;
  etiqueta: string;
  confirmar?: string;
  variante?: "accent" | "ghost" | "danger";
}) {
  const [estado, disparar, cargando] = useActionState(async (_prev: EstadoAccionCampana) => accion(), ESTADO_ACCION);
  const clase = variante === "accent" ? "btn-accent" : variante === "danger" ? "btn-ghost !text-red-600" : "btn-ghost";
  return (
    <form
      action={() => {
        if (confirmar && !window.confirm(confirmar)) return;
        disparar();
      }}
    >
      <button type="submit" disabled={cargando} className={clase}>
        {cargando ? "Un momento…" : etiqueta}
      </button>
      {estado.error ? <p className="mt-2 text-sm text-red-600">{estado.error}</p> : null}
    </form>
  );
}

export function EditorCampana({
  campana,
  segmentos,
  plantillas,
  yoId,
}: {
  campana?: Campana;
  segmentos: SegmentoOpcion[];
  plantillas: PlantillaOpcion[];
  yoId: string;
}) {
  const [guardado, guardarAction, guardando] = useActionState(guardarCampana, ESTADO_GUARDAR);
  const [prueba, pruebaAction, probando] = useActionState(enviarPruebaCampana, ESTADO_PRUEBA);
  const [programado, programarAction, programando] = useActionState(programarOEnviar, ESTADO_ACCION);

  const [htmlCrudo, setHtmlCrudo] = useState(campana?.html ?? "");
  const [cuando, setCuando] = useState<"ahora" | "programado">("ahora");

  const estado = campana?.status ?? "borrador";
  const soloLectura = estado !== "borrador" && !!campana;
  const esCreador = campana ? campana.created_by === yoId : true;

  function cargarPlantilla(id: string) {
    const plantilla = plantillas.find((p) => p.id === id);
    if (plantilla) setHtmlCrudo(plantilla.html);
  }

  return (
    <div className="space-y-5">
      <form action={guardarAction} className="glass rise space-y-5 p-6">
        <input type="hidden" name="id" value={campana?.id ?? ""} />
        <input type="hidden" name="blocks" value="[]" />

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5 text-sm font-medium text-[var(--text-2)]">
            Nombre de la campaña
            <input name="name" defaultValue={campana?.name} disabled={soloLectura} required className="input-glass" placeholder="Boletín — septiembre" />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-[var(--text-2)]">
            Segmento
            <select name="segmentId" defaultValue={campana?.segment_id ?? ""} disabled={soloLectura} required className="input-glass">
              <option value="">Elige un segmento…</option>
              {segmentos.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5 text-sm font-medium text-[var(--text-2)]">
            Asunto
            <input name="subject" defaultValue={campana?.subject} disabled={soloLectura} required className="input-glass" placeholder="{{first_name|Hola}}, tenemos algo para ti" />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-[var(--text-2)]">
            Pre-header
            <input name="preHeader" defaultValue={campana?.pre_header ?? ""} disabled={soloLectura} className="input-glass" placeholder="El texto que se ve antes de abrir" />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <label className="flex flex-col gap-1.5 text-sm font-medium text-[var(--text-2)]">
            Nombre remitente
            <input name="fromName" defaultValue={campana?.from_name ?? "Sinergéticos"} disabled={soloLectura} className="input-glass" />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-[var(--text-2)]">
            Correo remitente
            <input name="fromEmail" type="email" defaultValue={campana?.from_email} disabled={soloLectura} required className="input-glass" placeholder="hola@boletin.sinergeticos.com" />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-[var(--text-2)]">
            Responder a
            <input name="replyTo" type="email" defaultValue={campana?.reply_to ?? ""} disabled={soloLectura} className="input-glass" placeholder="contacto@sinergeticos.com" />
          </label>
        </div>

        {!soloLectura && (
          <label className="flex flex-col gap-1.5 text-sm font-medium text-[var(--text-2)]">
            Partir de una plantilla (opcional)
            <select className="input-glass" onChange={(e) => cargarPlantilla(e.target.value)} defaultValue="">
              <option value="">— sin plantilla, escribo el HTML abajo —</option>
              {plantillas.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
        )}

        <label className="flex flex-col gap-1.5 text-sm font-medium text-[var(--text-2)]">
          HTML del correo
          <textarea
            name="htmlCrudo"
            value={htmlCrudo}
            onChange={(e) => setHtmlCrudo(e.target.value)}
            disabled={soloLectura}
            rows={10}
            className="input-glass w-full font-mono text-xs"
            placeholder="Elige una plantilla arriba, o pega tu HTML — usa {{first_name|Hola}} y {{unsubscribe_url}}"
          />
        </label>

        {guardado.error ? <p className="text-sm text-red-600">{guardado.error}</p> : null}

        {!soloLectura && (
          <button type="submit" disabled={guardando} className="btn-accent">
            {guardando ? "Guardando…" : campana ? "Guardar cambios" : "Crear campaña (borrador)"}
          </button>
        )}
      </form>

      {campana && (
        <section className="glass rise space-y-4 p-6">
          <h2 className="font-display text-lg font-semibold">Envío de prueba</h2>
          <form action={pruebaAction} className="flex flex-wrap items-end gap-3">
            <input type="hidden" name="id" value={campana.id} />
            <label className="flex min-w-64 flex-1 flex-col gap-1.5 text-sm font-medium text-[var(--text-2)]">
              Correos internos (separados por coma)
              <input name="destinatarios" className="input-glass" placeholder="tu@sinergeticos.com" />
            </label>
            <button type="submit" disabled={probando} className="btn-ghost">
              {probando ? "Enviando…" : "Mandar prueba"}
            </button>
          </form>
          {prueba.error ? <p className="text-sm text-red-600">{prueba.error}</p> : null}
          {prueba.ok && prueba.enviados > 0 ? <p className="text-sm text-emerald-600">Prueba enviada a {prueba.enviados} correo(s).</p> : null}
        </section>
      )}

      {campana && (
        <section className="glass rise space-y-4 p-6">
          <h2 className="font-display text-lg font-semibold">Flujo de aprobación y envío</h2>

          {estado === "borrador" && <BotonAccion accion={() => solicitarRevision(campana.id)} etiqueta="Solicitar revisión →" />}

          {estado === "en_revision" && (
            <div className="flex flex-wrap gap-3">
              {esCreador ? (
                <p className="text-sm text-[var(--text-2)]">
                  Esperando que alguien más la apruebe — quien la creó no puede aprobarla (regla de 4 ojos).
                </p>
              ) : (
                <BotonAccion accion={() => aprobarCampana(campana.id)} etiqueta="Aprobar campaña" />
              )}
              <BotonAccion accion={() => regresarABorrador(campana.id)} etiqueta="Regresar a borrador" variante="ghost" />
            </div>
          )}

          {estado === "aprobada" && (
            <form action={programarAction} className="space-y-3">
              <input type="hidden" name="id" value={campana.id} />
              <p className="text-sm text-emerald-600">Aprobada. Lista para programar o mandar.</p>
              <div className="flex flex-wrap items-end gap-3">
                <label className="flex items-center gap-2 text-sm">
                  <input type="radio" name="cuando" value="ahora" checked={cuando === "ahora"} onChange={() => setCuando("ahora")} />
                  Mandar ahora
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="radio" name="cuando" value="programado" checked={cuando === "programado"} onChange={() => setCuando("programado")} />
                  Programar para…
                </label>
                {cuando === "programado" && <input type="datetime-local" name="cuando" className="input-glass" />}
              </div>
              {programado.error ? <p className="text-sm text-red-600">{programado.error}</p> : null}
              <button type="submit" disabled={programando} className="btn-accent">
                {programando ? "Un momento…" : cuando === "ahora" ? "Mandar ahora" : "Programar"}
              </button>
            </form>
          )}

          {(estado === "programada" || estado === "enviando") && (
            <div className="space-y-3">
              <p className="text-sm text-[var(--text-2)]">
                {estado === "programada"
                  ? `Programada para ${campana.scheduled_for ? new Date(campana.scheduled_for).toLocaleString("es-MX") : "—"}.`
                  : `Enviando: ${campana.totals.enviados ?? 0} de ${campana.totals.recipients ?? "?"} destinatarios.`}
              </p>
              <BotonAccion accion={() => pausarCampana(campana.id)} etiqueta="Pausar" variante="ghost" />
            </div>
          )}

          {estado === "pausada" && (
            <div className="flex flex-wrap gap-3">
              <p className="w-full text-sm text-amber-600">
                Pausada — {campana.totals.enviados ?? 0} de {campana.totals.recipients ?? "?"} ya se mandaron.
              </p>
              <BotonAccion accion={() => reanudarCampana(campana.id)} etiqueta="Reanudar" />
            </div>
          )}

          {estado === "enviada" && (
            <p className="text-sm text-emerald-600">
              Enviada — {campana.totals.enviados ?? 0} de {campana.totals.recipients ?? "?"} destinatarios
              {campana.totals.errores ? `, ${campana.totals.errores} con error` : ""}.
            </p>
          )}

          {estado === "cancelada" && <p className="text-sm text-[var(--text-3)]">Esta campaña se canceló.</p>}

          {!["enviada", "cancelada"].includes(estado) && (
            <div className="border-t border-[var(--border)] pt-3">
              <BotonAccion
                accion={() => cancelarCampana(campana.id)}
                etiqueta="Cancelar campaña"
                confirmar="¿Cancelar esta campaña? No se puede deshacer."
                variante="danger"
              />
            </div>
          )}
        </section>
      )}
    </div>
  );
}
