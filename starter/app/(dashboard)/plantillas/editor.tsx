"use client";

import { useActionState, useMemo, useState } from "react";
import { guardarPlantilla, enviarPrueba, type EstadoGuardarPlantilla, type EstadoPrueba, type Plantilla } from "./actions";
import { ensamblarCorreo, renderVariables, nuevoBloque, type Block } from "@/lib/plantillas";

const ESTADO_GUARDAR: EstadoGuardarPlantilla = { ok: false, error: null };
const ESTADO_PRUEBA: EstadoPrueba = { ok: false, error: null, enviados: 0 };

const TIPOS_BLOQUE: { value: Block["type"]; label: string }[] = [
  { value: "titulo", label: "Título" },
  { value: "texto", label: "Texto" },
  { value: "boton", label: "Botón" },
  { value: "imagen", label: "Imagen" },
  { value: "separador", label: "Separador" },
];

function moverBloque(blocks: Block[], index: number, hacia: -1 | 1): Block[] {
  const destino = index + hacia;
  if (destino < 0 || destino >= blocks.length) return blocks;
  const copia = [...blocks];
  [copia[index], copia[destino]] = [copia[destino]!, copia[index]!];
  return copia;
}

function CampoBloque({ block, onChange }: { block: Block; onChange: (b: Block) => void }) {
  switch (block.type) {
    case "titulo":
    case "texto":
      return (
        <textarea
          value={block.texto}
          onChange={(e) => onChange({ ...block, texto: e.target.value })}
          rows={block.type === "titulo" ? 1 : 3}
          className="input-glass w-full"
          placeholder={block.type === "titulo" ? "{{first_name|Hola}}, tenemos algo para ti" : "Escribe el párrafo…"}
        />
      );
    case "boton":
      return (
        <div className="grid gap-2 sm:grid-cols-2">
          <input value={block.texto} onChange={(e) => onChange({ ...block, texto: e.target.value })} className="input-glass" placeholder="Texto del botón" />
          <input value={block.url} onChange={(e) => onChange({ ...block, url: e.target.value })} className="input-glass" placeholder="https://…" />
        </div>
      );
    case "imagen":
      return (
        <div className="grid gap-2 sm:grid-cols-2">
          <input value={block.src} onChange={(e) => onChange({ ...block, src: e.target.value })} className="input-glass" placeholder="URL de la imagen" />
          <input value={block.alt} onChange={(e) => onChange({ ...block, alt: e.target.value })} className="input-glass" placeholder="Texto alternativo" />
        </div>
      );
    case "separador":
      return <p className="text-sm text-[var(--text-3)]">Línea divisoria — sin contenido que editar.</p>;
  }
}

export function EditorPlantilla({ plantilla }: { plantilla?: Plantilla }) {
  const [name, setName] = useState(plantilla?.name ?? "");
  const [subject, setSubject] = useState(plantilla?.subject ?? "");
  const [preHeader, setPreHeader] = useState(plantilla?.pre_header ?? "");
  const [blocks, setBlocks] = useState<Block[]>(plantilla?.blocks?.length ? plantilla.blocks : [nuevoBloque("titulo")]);
  const [modoHtml, setModoHtml] = useState(false);
  const [htmlCrudo, setHtmlCrudo] = useState("");
  const [destinatarios, setDestinatarios] = useState("");

  const [estadoGuardar, guardarAction, guardando] = useActionState(guardarPlantilla, ESTADO_GUARDAR);
  const [estadoPrueba, pruebaAction, enviando] = useActionState(enviarPrueba, ESTADO_PRUEBA);

  const previewHtml = useMemo(() => {
    const base = modoHtml ? htmlCrudo : ensamblarCorreo({ subject, preheader: preHeader, blocks });
    return renderVariables(base, { first_name: "Ana", email: "ana@ejemplo.com", unsubscribe_url: "#" });
  }, [modoHtml, htmlCrudo, subject, preHeader, blocks]);

  function actualizarBloque(id: string, nuevo: Block) {
    setBlocks((prev) => prev.map((b) => (b.id === id ? nuevo : b)));
  }
  function eliminarBloque(id: string) {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
  }
  function agregarBloque(tipo: Block["type"]) {
    setBlocks((prev) => [...prev, nuevoBloque(tipo)]);
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_420px]">
      <div className="space-y-5">
        <section className="glass rise space-y-4 p-6">
          <input type="hidden" name="blocks" value={JSON.stringify(blocks)} form="form-plantilla" />
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5 text-sm font-medium text-[var(--text-2)]">
              Nombre de la plantilla
              <input value={name} onChange={(e) => setName(e.target.value)} className="input-glass" placeholder="Boletín de agosto" />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium text-[var(--text-2)]">
              Asunto
              <input value={subject} onChange={(e) => setSubject(e.target.value)} className="input-glass" placeholder="Tu clase de esta semana" />
            </label>
          </div>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-[var(--text-2)]">
            Preheader (el texto que se ve junto al asunto en la bandeja)
            <input value={preHeader} onChange={(e) => setPreHeader(e.target.value)} className="input-glass" placeholder="No te lo pierdas…" />
          </label>
          <p className="text-xs text-[var(--text-3)]">
            Variables disponibles: <code>{"{{first_name|Hola}}"}</code>, <code>{"{{email}}"}</code>, <code>{"{{unsubscribe_url}}"}</code> — se
            resuelven por cada destinatario al mandar.
          </p>
        </section>

        <section className="glass rise space-y-4 p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-lg font-semibold">Contenido</h2>
            <label className="flex items-center gap-2 text-sm text-[var(--text-2)]">
              <input type="checkbox" checked={modoHtml} onChange={(e) => setModoHtml(e.target.checked)} />
              HTML crudo
            </label>
          </div>

          {modoHtml ? (
            <>
              <textarea
                name="htmlCrudo"
                form="form-plantilla"
                value={htmlCrudo}
                onChange={(e) => setHtmlCrudo(e.target.value)}
                rows={16}
                className="input-glass w-full font-mono text-xs"
                placeholder="<html>…</html>"
              />
              <p className="text-xs text-[var(--text-3)]">En este modo los bloques de abajo se ignoran al guardar.</p>
            </>
          ) : (
            <div className="space-y-3">
              {blocks.map((b, i) => (
                <div key={b.id} className="rounded-xl border border-[var(--border)] bg-[var(--veil)] p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="chip">{TIPOS_BLOQUE.find((t) => t.value === b.type)?.label}</span>
                    <div className="flex gap-1">
                      <button type="button" onClick={() => setBlocks((p) => moverBloque(p, i, -1))} className="btn-ghost !px-2 !py-1 !text-xs" disabled={i === 0}>
                        ↑
                      </button>
                      <button type="button" onClick={() => setBlocks((p) => moverBloque(p, i, 1))} className="btn-ghost !px-2 !py-1 !text-xs" disabled={i === blocks.length - 1}>
                        ↓
                      </button>
                      <button type="button" onClick={() => eliminarBloque(b.id)} className="btn-ghost !px-2 !py-1 !text-xs text-[var(--danger)]">
                        Quitar
                      </button>
                    </div>
                  </div>
                  <CampoBloque block={b} onChange={(nuevo) => actualizarBloque(b.id, nuevo)} />
                </div>
              ))}
              <div className="flex flex-wrap gap-2 pt-1">
                {TIPOS_BLOQUE.map((t) => (
                  <button key={t.value} type="button" onClick={() => agregarBloque(t.value)} className="btn-ghost !text-sm">
                    + {t.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>

        <form id="form-plantilla" action={guardarAction} className="glass rise flex flex-wrap items-center gap-3 p-6">
          <input type="hidden" name="id" value={plantilla?.id ?? ""} />
          <input type="hidden" name="name" value={name} />
          <input type="hidden" name="subject" value={subject} />
          <input type="hidden" name="preHeader" value={preHeader} />
          <button type="submit" disabled={guardando} className="btn-accent">
            {guardando ? "Guardando…" : "Guardar plantilla"}
          </button>
          {estadoGuardar.error ? <span className="text-sm text-[var(--danger)]">{estadoGuardar.error}</span> : null}
          {estadoGuardar.ok ? <span className="text-sm text-[var(--success)]">Guardado.</span> : null}
        </form>

        <form action={pruebaAction} className="glass rise space-y-3 p-6">
          <input type="hidden" name="subject" value={subject} />
          <input type="hidden" name="preHeader" value={preHeader} />
          <input type="hidden" name="blocks" value={JSON.stringify(blocks)} />
          <input type="hidden" name="htmlCrudo" value={modoHtml ? htmlCrudo : ""} />
          <h2 className="font-display text-lg font-semibold">Enviar prueba</h2>
          <p className="text-sm text-[var(--text-2)]">A uno o varios correos internos, antes de programar la campaña real.</p>
          <div className="flex flex-wrap items-center gap-3">
            <input
              name="destinatarios"
              value={destinatarios}
              onChange={(e) => setDestinatarios(e.target.value)}
              className="input-glass flex-1 min-w-[240px]"
              placeholder="tu@sinergeticos.com, otra@sinergeticos.com"
            />
            <button type="submit" disabled={enviando} className="btn-ghost">
              {enviando ? "Enviando…" : "Enviar prueba"}
            </button>
          </div>
          {estadoPrueba.error ? <p className="text-sm text-[var(--danger)]">{estadoPrueba.error}</p> : null}
          {estadoPrueba.ok ? <p className="text-sm text-[var(--success)]">Enviado a {estadoPrueba.enviados} correo(s).</p> : null}
        </form>
      </div>

      <section className="glass-strong rise sticky top-3 h-fit p-3">
        <p className="mb-2 px-2 text-xs font-medium uppercase tracking-wide text-[var(--text-3)]">Vista previa</p>
        <iframe title="Vista previa del correo" srcDoc={previewHtml} className="h-[70vh] w-full rounded-xl border border-[var(--border)] bg-white" />
      </section>
    </div>
  );
}
