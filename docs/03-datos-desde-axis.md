# 03 · Datos desde Axis (contrato)

**Regla:** Axis es la fuente de verdad de contactos. La app de mailing **lee** de Axis y
**escribe solo en su propia base**, salvo la supresión (ver abajo).

## Cómo se conecta
Opción recomendada: **rol de Postgres de solo lectura** en la base de Axis (Supabase), entregado
como `AXIS_DATABASE_URL_RO`. Ventajas: sin API nueva que mantener en Axis, SQL directo para
segmentar, imposible modificar datos por accidente. Alternativa si el equipo de Axis lo prefiere:
que Axis exponga `GET /api/internal/contacts/export` con Bearer propio (mismo patrón que
`/api/internal/mail`).

El DDL completo está en `esquema/axis-contactos.sql`. Lo esencial:

## `contacts` (una fila por persona, ya deduplicada)
| Columna | Uso en mailing |
|---------|----------------|
| `id` uuid | identificador estable; guárdalo en tus envíos para cruzar métricas |
| `email_normalized` | **el correo al que se manda** (único, minúsculas) |
| `emails text[]` | correos alternos; no mandar a todos, solo al normalizado |
| `first_name`, `full_name` | personalización (`Hola {{first_name}}`) |
| `country`, `region`, `city` | segmentar por geografía |
| `lifecycle_stage` | `lead` · `registrant` · `attendee` · `customer` · `member` |
| `first_utm_*`, `first_funnel_slug`, `first_source_system` | origen (por qué embudo llegó) |
| `ghl_account` | `usa` · `mexico` · `latam` — bucket de mercado |
| `touchpoint_count`, `registration_count`, `purchase_count`, `ltv_cents` | engagement y valor |
| `last_activity_at` | descartar inactivos (ej. > 18 meses) para cuidar reputación |

## `memberships`
Estado de membresía por contacto: `estado` (`activa`/`expirada`/`revocada`/`inactiva`),
`tipo_membresia`, `vencimiento`, `pais_bucket` (`mx`/`usa-can`/`latam`), `cohorte`.
Segmentos típicos: "miembros activos", "vencen en 30 días", "expirados hace < 90 días".

## `purchases`
Compras con `product_name`, `amount_cents`, `currency`, `purchased_at`, `status`.
Segmento típico: "compró X pero no Y".

## `touchpoints` (particionada por mes)
Historial: `type` ∈ `registration`, `attendance`, `checkout_started`, `purchase`, ...
con `event_slug`, `funnel_slug`, `occurred_at`. Segmento típico: "se registró al webinar Z y
no asistió". Es la tabla grande: filtra siempre por rango de `occurred_at`.

## `mail_supresion` — OBLIGATORIO
Antes de cada envío, excluir todo `email` presente en `mail_supresion` de Axis. Además la app
mantiene su propia tabla de supresión (bajas, rebotes duros, quejas) y la **sincroniza a Axis**
(vía endpoint acordado con su equipo o escritura directa si se autoriza). Una baja en cualquiera
de los dos sistemas vale en ambos.

## Segmentación: dos caminos
1. **Segmentos guardados** con filtros de UI (etapa, país, membresía, actividad, embudo).
2. **SQL crudo** (solo admins) contra la conexión de solo lectura, para casos raros.
Cada campaña congela su lista de destinatarios al momento de programarla (`campaign_recipients`),
para que el reporte sea reproducible aunque Axis cambie después.

## Lo que NO se hace
- No se copian los contactos a la base de mailing "por si acaso". Se lee de Axis cada vez.
- No se editan contactos desde mailing (ni nombre, ni etapa, ni correo).
- No se exporta la base completa a CSV desde la UI sin rol admin y sin quedar en bitácora.
