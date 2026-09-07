# Bitácora — mailing.sinergeticos.com

Log vivo de qué se hizo, cuándo y por qué. Una entrada por hito.

## 2026-08-27 · Investigación + kit de arranque + starter
- **Hallazgo**: Axis ya está ligado a Resend (`src/lib/mail.ts`, webhook Svix, tablas `mail_*`,
  `mail_supresion`). Dominio `envios.sinergeticos.com` verificado en Resend desde el 3-ago. Plan
  gratis (cap 90/día en Axis) → para masivo hay que subir de plan y usar subdominio propio.
- **Decisiones**: contactos se leen de Axis (solo lectura); la app manda masivos directo a Resend;
  Axis sigue siendo el único transaccional; supresión compartida; estilo visual copiado de Axis.
- **Se creó**: `docs/01-07`, `estilo-axis/` (capa visual original de Axis), `esquema/` (DDL de Axis
  + esquema propuesto), `ejemplos/` (prueba, lote, webhook, plantilla) y `starter/` (Next 16 con el
  shell de Axis, `lib/resend.ts`, `lib/axis.ts`, `/baja`, webhook, `/api/health`).
- **Verificado**: `next build` verde (12 rutas); capturas claro/oscuro/móvil en `docs/capturas/`;
  escaneo de secretos limpio antes de cada push.
- **Pendiente para quien construya**: Supabase Auth (stub en `lib/auth.ts`), aplicar
  `esquema/mailing-propuesto.sql`, pedir rol de solo lectura en Axis, key de Resend propia,
  subdominio de marketing verificado, subir de plan en Resend.

## 2026-08-27 (noche) · Publicación + acceso a Axis
- **Fase 1-2 de Fer** integradas en `main` (login real con Supabase, Listas/segmentos, Plantillas).
- **LIVE: https://mailing.sinergeticos.com** — proyecto Vercel `mailing-sinergeticos` en el team de
  Sinergéticos (root `starter/`, repo conectado: cada push a `main` despliega). Dominio verificado
  (el CNAME en GoDaddy ya existía). Variables cargadas: Supabase, Resend (key dedicada), secreto
  del webhook, `UNSUBSCRIBE_SECRET`, `MAIL_ENABLED=false`, `MAIL_FROM hola@boletin.sinergeticos.com`.
- **Resend**: `boletin.sinergeticos.com` verificado (marketing, separado de `envios.` de Axis);
  webhook registrado hacia `/api/hooks/resend` con los 7 eventos.
- **Axis**: PR #6 `feat/mailing-ro-rls` en `synergy-axis` — migración `0135_mailing_ro.sql`
  (rol `mailing_ro` de solo lectura + 3 policies SELECT en `contacts`, `memberships`,
  `mail_supresion`). La aplica el equipo de Axis; después entregan `AXIS_DATABASE_URL_RO`.
- **Pendientes**: `AXIS_DATABASE_URL_RO` (tras el PR), `DATABASE_URL` (password de la base
  propia; o migrar `lib/supresion.ts` a supabase-js), DMARC en `_dmarc.sinergeticos.com`,
  subir plan de Resend antes del primer envío real.

## 2026-09-07 · Marca indigo + segmentación por embudo/compra/región
- **Marca**: azul rey (#1e3a8a) → indigo profundo (#12193e/#0b1030) en `globals.css` y
  `public/brand/mark.svg`. Mismo ícono (destello dorado), solo cambia el tono de azul.
- **`AXIS_DATABASE_URL_RO` ya está en `.env.local` y SÍ funciona**: probado en vivo
  (`contacts`: 892,025 filas reales, rol `colaborador_axis_reader`). `mail_supresion` y
  `purchases` también tienen policy de SELECT y responden con datos reales (33,372 compras).
- **Hallazgo — bloqueante para segmentar por embudo específico**: `touchpoints` tiene RLS
  activado (`alter table touchpoints enable row level security`) pero **cero policies**
  definidas (`select * from pg_policies where tablename='touchpoints'` → vacío). Por eso
  siempre devuelve 0 filas para cualquier rol, aunque `contacts.registration_count` prueba
  que sí hay 356,101 personas con registros reales adentro. **Pendiente de David**: agregar
  una policy SELECT en `touchpoints` para el rol lector, mismo patrón que ya se aplicó a
  `mail_supresion`/`purchases` en `feat/mailing-ro-rls`.
- **Se construyó, sin depender de lo anterior** (usa columnas/tablas que SÍ tienen policy
  hoy): en `lib/axis.ts` — `FiltrosSegmento.regiones`, `.ciudades` (`contacts.region`/`.city`),
  `.embudosOrigen` (`contacts.first_funnel_slug`, first-touch — valores reales verificados:
  `club-sinergetico`, `webinar-mx-mdl`, `revolucion`, `bootcamp-2026`, ciudades de gira del
  Seed, etc.) y `.compraProducto` (ILIKE parcial contra `purchases.product_name`, que no es
  un catálogo cerrado). UI nueva en `listas/segmentos-panel.tsx`. Probado en vivo: segmento
  "llegó por `webinar-mx-mdl`, en México, activo en 540 días, no ha comprado Legendaria" →
  5,634 contactos reales. `next build` y `tsc --noEmit` verdes.
- **Pendiente real, no técnico**: sin la policy de `touchpoints`, todavía no se puede filtrar
  "ya se registró/asistió a ESTE webinar específico" (solo el embudo de *primer* contacto) ni
  medir apertura/clic reales (ver pendiente de Resend, sección anterior).
