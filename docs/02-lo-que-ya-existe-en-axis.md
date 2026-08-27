# 02 · Lo que ya existe en Axis (hallazgos, 27-ago-2026)

Se revisó el código de Axis para no rehacer nada. Resumen:

## Axis YA está ligado a Resend
- `src/lib/mail.ts`: envío por `POST https://api.resend.com/emails`.
- Remitente actual: `Sinergéticos <cuentas@envios.sinergeticos.com>`.
- **Axis es el ÚNICO que manda correos** desde las apps del ecosistema: afiliados, embudos SEED
  y checkout no hablan con Resend, llaman a `POST /api/internal/mail` (Bearer `AXIS_MAIL_SECRET`).
- Arranca **inerte**: sin `MAIL_ENABLED=true` no se manda nada.
- **Tope diario de 90** (`MAIL_DAILY_CAP`), porque la cuenta de Resend está en plan gratis
  (100/día). Eso confirma que Axis está pensado para transaccional, no para masivo.
- Idempotencia por `idem_key` (nunca manda dos veces el mismo correo).
- Todo envío queda en `mail_envios`; cada evento del proveedor en `mail_eventos`.

## Webhook de Resend ya implementado
- `src/app/api/hooks/resend/route.ts` recibe `email.delivered`, `email.bounced`,
  `email.complained` (y abre/clic) y actualiza `mail_envios.status`.
- Verifica la firma **Svix** (`svix-id`, `svix-timestamp`, `svix-signature`) con
  `RESEND_WEBHOOK_SECRET`. El ejemplo `ejemplos/webhook-resend.ts` replica esa verificación.

## Secuencias por evento (mail_flows)
- Tablas `mail_flows`, `mail_steps`, `mail_enrollments`, `mail_sends`: secuencias de correos
  disparadas por registro a un evento (p. ej. boleto gratis), con offsets en minutos.
- `mail_supresion (email, motivo)`: **lista global de bajas**. Liga de baja en
  `GET /api/mail/baja?e=<email>&t=<hmac>` — con token HMAC para que nadie dé de baja a otros.

## Cuenta de Resend (verificado por API)
- Dominio **`envios.sinergeticos.com` — verified**, región `us-east-1`, desde 2026-08-03.
- Varias API keys ya creadas. Para la app de mailing se crea **una nueva**, con nombre propio,
  para poder revocarla sin tocar Axis.

## Conclusión de arquitectura
| Correo | Quién lo manda | Por dónde |
|--------|----------------|-----------|
| Transaccional (boletos, accesos, confirmaciones, secuencias por evento) | **Axis** | `envios.sinergeticos.com` |
| Masivo (boletines, campañas a listas) | **App de mailing** (esta) | Subdominio de marketing propio, Resend directo |

La app de mailing **no** pasa por `/api/internal/mail` de Axis (cap de 90/día y diseñado para
un correo a la vez). Manda directo a Resend con su propia key y su propio `from`.
