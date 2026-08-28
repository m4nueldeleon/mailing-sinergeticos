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
