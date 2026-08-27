# starter/ — app Next.js con el shell de Axis ya conectado

Punto de partida ejecutable para `mailing.sinergeticos.com`. Trae el look de Axis, la navegación
propuesta, y las piezas de infraestructura que no conviene reinventar. **Todo lo demás lo
construyes a tu medida.**

```bash
cp .env.example .env.local   # pide los valores en privado
npm install
npm run dev                  # http://localhost:3000
```

## Qué ya funciona
| Pieza | Archivo | Estado |
|-------|---------|--------|
| Shell visual (sidebar de vidrio, topbar móvil, tema claro/oscuro, fuentes) | `app/layout.tsx`, `app/(dashboard)/*` | ✅ listo |
| 6 secciones con su lista de "por construir" | `app/(dashboard)/**/page.tsx` | ✅ placeholders |
| Envío por lotes a Resend con idempotencia y backoff | `lib/resend.ts` | ✅ listo (apagado por `MAIL_ENABLED`) |
| Lectura de segmentos desde Axis (solo lectura, excluye `mail_supresion`) | `lib/axis.ts` | ✅ listo, requiere `AXIS_DATABASE_URL_RO` |
| Liga de baja HMAC + one-click (GET/POST `/baja`) | `app/baja/route.ts`, `lib/baja.ts` | ✅ listo |
| Webhook de Resend con firma Svix → supresión automática | `app/api/hooks/resend/route.ts`, `lib/svix.ts` | ✅ listo |
| Diagnóstico de configuración | `GET /api/health` | ✅ |
| Autenticación | `lib/auth.ts` | ⚠️ **stub** — sustituir por Supabase Auth |
| Base propia (campañas, listas, envíos) | `esquema/mailing-propuesto.sql` | ⚠️ aplicar y conectar (`lib/supresion.ts` ya la usa si hay `DATABASE_URL`) |

## Notas de Next 16
- No hay `middleware.ts`: se llama `proxy.ts` (export `proxy`). Excluir `/api/**` si manejas cuerpos grandes.
- `params` y `searchParams` llegan como **Promise** en páginas y route handlers.
- Antes de pelear con un error, lee `node_modules/next/dist/docs/` — Next 16 cambió varias cosas.
- Correr `npm run build` antes de `typecheck` (los tipos de rutas se generan en el build).
