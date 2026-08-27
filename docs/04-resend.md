# 04 · Resend: cómo usarlo para masivo

## Estado de la cuenta (27-ago-2026)
- Dominio `envios.sinergeticos.com` **verificado** (us-east-1). Lo usa Axis para transaccional.
- Plan actual: **gratis** (100 correos/día, 3,000/mes) según el propio código de Axis. **Para
  masivo hay que subir de plan** (Pro ≈ 50K/mes; Scale ≈ 100K/mes; más volumen: contactar a
  Resend). Confirmar precios vigentes en resend.com/pricing.

## Qué pedir / crear en el panel de Resend
1. **API key nueva** para esta app (permiso *Sending access*, restringida al dominio de marketing).
2. **Dominio de marketing** aparte, p. ej. `boletin.sinergeticos.com` (ver `07-dominio-y-dns.md`).
3. **Webhook** apuntando a `https://mailing.sinergeticos.com/api/hooks/resend` con los eventos
   `email.sent`, `email.delivered`, `email.delivery_delayed`, `email.bounced`, `email.complained`,
   `email.opened`, `email.clicked`. Guardar el `whsec_...` como `RESEND_WEBHOOK_SECRET`.
4. Activar **click/open tracking** en el dominio de marketing si se quieren aperturas/clics.

## Dos formas de mandar masivo con Resend
| | Broadcasts + Audiences (nativo de Resend) | API `/emails/batch` (la app controla todo) |
|---|---|---|
| Listas | viven en Resend (Audiences) | viven en la app (leídas de Axis) |
| Baja | automática con `{{{RESEND_UNSUBSCRIBE_URL}}}` | la app genera liga HMAC + cabeceras `List-Unsubscribe` |
| Segmentación | limitada | total (SQL sobre Axis) |
| Métricas | panel de Resend | tu base, vía webhook |
| Recomendación | prototipo rápido | **producción** (encaja con "la data se liga a Axis") |

## API `/emails/batch` — lo que importa
- Hasta **100 correos por llamada**. Rate limit por defecto ≈ 2 req/s (se puede pedir más).
  → 20,000 correos = 200 llamadas ≈ 2 min si se respeta el ritmo.
- Cada correo del lote acepta: `from`, `to`, `subject`, `html`, `text`, `reply_to`, `headers`,
  `tags` (p. ej. `campaign_id`), `scheduled_at` (programar hasta días después).
- Usa cabecera `Idempotency-Key` por lote (o `tags` + tu propia clave) para que un reintento no
  duplique envíos.
- Respuesta: un `id` por correo. **Guárdalo** (`provider_id`): es la llave con la que el webhook
  te dirá entregado/rebotado/abierto.
- Errores 429 → esperar y reintentar con backoff; 4xx de validación → marcar el destinatario y
  seguir con el resto del lote.

## Cabeceras obligatorias para masivo (Gmail/Yahoo desde 2024)
```
List-Unsubscribe: <https://mailing.sinergeticos.com/baja?e=...&t=...>, <mailto:baja@boletin.sinergeticos.com>
List-Unsubscribe-Post: List-Unsubscribe=One-Click
```
Más SPF + DKIM + DMARC alineados y tasa de spam < 0.3 %. Sin esto Gmail manda a spam o rechaza.

## Webhook
Firma Svix (misma que usa Axis). Verificar con el **body crudo**, no con el JSON re-serializado.
Ejemplo listo en `ejemplos/webhook-resend.ts`. Ante `email.bounced` (duro) o `email.complained`
→ agregar a supresión **inmediatamente**.

## Buenas prácticas de entregabilidad
- Calentar el dominio nuevo: 500 → 2,000 → 5,000 → 10,000 por día la primera semana.
- Mandar primero a los más activos (`last_activity_at` reciente) y dejar inactivos al final o fuera.
- Un `from` humano y estable; `reply_to` real y atendido.
- Texto plano siempre junto al HTML. Peso < 100 KB. Imágenes con `alt`.
