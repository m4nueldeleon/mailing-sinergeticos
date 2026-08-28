# 07 · Dominio y DNS

> **Estado 27-ago-2026**: `mailing.sinergeticos.com` ya apunta a Vercel y la app está publicada;
> `boletin.sinergeticos.com` ya está **verificado** en Resend (DKIM + MX puestos). Lo único que
> falta en DNS es el **DMARC** del dominio raíz (paso 3 de abajo).

## Dos dominios distintos, dos roles
| Dominio | Para qué | Quién lo administra |
|---------|----------|---------------------|
| `mailing.sinergeticos.com` | la **app** (Vercel) | Fer/equipo de la app |
| `boletin.sinergeticos.com` (verificado) | **remitente** de los masivos (Resend) | Manuel/equipo DNS |
| `envios.sinergeticos.com` | remitente **transaccional** de Axis — **no tocar** | equipo de Axis |

¿Por qué un subdominio de envío aparte? Los proveedores de correo puntúan reputación por
dominio/subdominio. Si un boletín masivo genera quejas, no debe arrastrar a los correos de boletos
y accesos que manda Axis.

## App: `mailing.sinergeticos.com`
En Vercel → Domains → agregar; en el DNS de `sinergeticos.com` un `CNAME mailing → cname.vercel-dns.com`
(o el valor que indique Vercel). Los DNS de `sinergeticos.com` viven en **GoDaddy**.

## Remitente: `boletin.sinergeticos.com` en Resend
1. Resend → Domains → Add domain → `boletin.sinergeticos.com`, región `us-east-1` (misma que el existente).
2. Resend entrega 3 registros; agregarlos en GoDaddy:
   - **DKIM**: `TXT resend._domainkey.boletin` → `p=MIG...`
   - **SPF** (para el return-path): `MX send.boletin → feedback-smtp.us-east-1.amazonses.com` (prio 10)
     y `TXT send.boletin → "v=spf1 include:amazonses.com ~all"`
   - (Opcional) **Tracking**: `CNAME` que Resend indique si se activa open/click tracking.
3. **DMARC** en el dominio raíz si aún no existe: `TXT _dmarc.sinergeticos.com →
   "v=DMARC1; p=none; rua=mailto:dmarc@sinergeticos.com"`. Empezar en `p=none`, subir a
   `quarantine` cuando todo alinee.
4. Esperar a que Resend marque **Verified** (minutos a horas por propagación).

## Buzones que deben existir
- `hola@boletin.sinergeticos.com` (o el `from` elegido): que **reciba** (alias hacia un buzón real),
  porque la gente responde.
- `baja@boletin.sinergeticos.com`: para el `mailto:` de `List-Unsubscribe`.
- `dmarc@sinergeticos.com`: reportes DMARC.

## Calentamiento del dominio nuevo
Día 1–2: ≤ 500/día · Día 3–4: ≤ 2,000 · Día 5–7: ≤ 5,000 · Semana 2: ≤ 10,000 · después libre,
siempre vigilando rebotes/quejas. Empezar por los contactos más activos.
