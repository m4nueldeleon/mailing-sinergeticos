import { obtenerEstadoConfiguracion, obtenerDominiosResend, listarBitacora, type EntradaBitacora } from "./actions";

const ETIQUETA_CONFIG: Record<string, string> = {
  resend: "API key de Resend",
  from: "Remitente (MAIL_FROM)",
  webhook: "Secreto del webhook",
  axis: "Conexión a Axis (solo lectura)",
  db: "Base propia (DATABASE_URL)",
  unsubscribe: "Firma de bajas (UNSUBSCRIBE_SECRET)",
};

function Punto({ ok }: { ok: boolean }) {
  return <span className={`inline-block h-2 w-2 rounded-full ${ok ? "bg-emerald-500" : "bg-red-500"}`} />;
}

const ETIQUETA_ACCION: Record<string, string> = {
  "campaign.approve": "aprobó la campaña",
  "campaign.send_now": "mandó la campaña",
  "campaign.schedule": "programó la campaña",
  "campaign.pause": "pausó la campaña",
  "campaign.resume": "reanudó la campaña",
  "campaign.cancel": "canceló la campaña",
};

function FilaBitacora({ entrada }: { entrada: EntradaBitacora }) {
  const detalle = entrada.detail as { recipients?: number; scheduled_for?: string };
  return (
    <tr>
      <td className="text-[var(--text-3)]">{new Date(entrada.created_at).toLocaleString("es-MX")}</td>
      <td>{entrada.usuario_email ?? "—"}</td>
      <td>{ETIQUETA_ACCION[entrada.action] ?? entrada.action}</td>
      <td className="text-[var(--text-2)]">
        {detalle.recipients ? `${detalle.recipients} destinatarios` : ""}
        {detalle.scheduled_for ? ` · ${new Date(detalle.scheduled_for).toLocaleString("es-MX")}` : ""}
      </td>
    </tr>
  );
}

export async function ConfiguracionPanel() {
  const [config, resend, bitacora] = await Promise.all([obtenerEstadoConfiguracion(), obtenerDominiosResend(), listarBitacora()]);

  return (
    <div className="space-y-5">
      <section className="glass rise space-y-4 p-6">
        <h2 className="font-display text-lg font-semibold">Envío</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-sm text-[var(--text-3)]">Interruptor de envío</p>
            <p className={`font-display text-lg font-semibold ${config.mailEnabled ? "text-emerald-600" : "text-amber-600"}`}>
              {config.mailEnabled ? "Encendido — manda de verdad" : "Apagado"}
            </p>
            {!config.mailEnabled && (
              <p className="mt-1 text-xs text-[var(--text-3)]">
                Se cambia en Vercel → Environment Variables → <code>MAIL_ENABLED</code>, con un redeploy después.
              </p>
            )}
          </div>
          <div>
            <p className="text-sm text-[var(--text-3)]">Tope diario</p>
            <p className="font-display text-lg font-semibold">{config.dailyCap.toLocaleString("es-MX")} correos/día</p>
          </div>
          <div>
            <p className="text-sm text-[var(--text-3)]">Remitente por defecto</p>
            <p className="font-display text-lg font-semibold">{config.mailFrom || "— sin configurar —"}</p>
            {config.mailReplyTo && <p className="text-xs text-[var(--text-3)]">Responder a: {config.mailReplyTo}</p>}
          </div>
        </div>
      </section>

      <section className="glass rise space-y-3 p-6">
        <h2 className="font-display text-lg font-semibold">Estado de configuración</h2>
        <ul className="grid gap-2 sm:grid-cols-2">
          {Object.entries(config.configurado).map(([clave, ok]) => (
            <li key={clave} className="flex items-center gap-2 text-sm">
              <Punto ok={ok} />
              {ETIQUETA_CONFIG[clave] ?? clave}
            </li>
          ))}
        </ul>
      </section>

      <section className="glass rise space-y-3 p-6">
        <h2 className="font-display text-lg font-semibold">Dominios en Resend</h2>
        {!resend.ok ? (
          <p className="text-sm text-red-600">{resend.error}</p>
        ) : resend.dominios.length === 0 ? (
          <p className="text-sm text-[var(--text-2)]">Sin dominios registrados todavía.</p>
        ) : (
          <ul className="space-y-2">
            {resend.dominios.map((d) => (
              <li key={d.name} className="flex items-center gap-2 text-sm">
                <Punto ok={d.status === "verified"} />
                <span className="font-medium">{d.name}</span>
                <span className="text-[var(--text-3)]">— {d.status === "verified" ? "verificado" : d.status}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="glass rise space-y-3 p-6">
        <h2 className="font-display text-lg font-semibold">Bitácora de acciones sensibles</h2>
        {bitacora.length === 0 ? (
          <p className="text-sm text-[var(--text-2)]">Sin acciones registradas todavía — aprobar, mandar, pausar o cancelar una campaña queda aquí.</p>
        ) : (
          <table className="table-glass">
            <thead>
              <tr>
                <th>Cuándo</th>
                <th>Quién</th>
                <th>Qué hizo</th>
                <th>Detalle</th>
              </tr>
            </thead>
            <tbody>
              {bitacora.map((b) => (
                <FilaBitacora key={b.id} entrada={b} />
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
