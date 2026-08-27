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
