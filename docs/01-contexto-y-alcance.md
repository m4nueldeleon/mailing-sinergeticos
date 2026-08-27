# 01 · Contexto y alcance

## Qué es
Una app interna de **mailing masivo** para las bases de datos de Sinergéticos, en
`mailing.sinergeticos.com`. Sustituye el envío manual/disperso por un solo lugar donde se
eligen contactos, se arma un correo con la marca y se manda, con métricas reales de entrega.

## Para quién
Equipo de marketing y dirección de Sinergéticos (pocos usuarios, con roles). No es una
herramienta para clientes finales.

## Qué correos manda
- **Boletines y anuncios** a listas/segmentos (clases, eventos, lanzamientos, avisos).
- **Campañas por segmento**: por ciudad/país, por etapa (`lead`, `registrant`, `attendee`,
  `customer`, `member`), por membresía activa/vencida, por compra, por embudo de origen.
- **NO manda transaccionales** (confirmaciones, boletos, accesos): eso lo hace Axis y no se toca.

## Tamaño
Decenas de miles de contactos y campañas que pueden salir a toda la base. La cifra exacta se da
en privado; el diseño debe asumir **lotes grandes** (batch de 100 por llamada a Resend,
colas, reintentos, límite diario configurable).

## Fuentes de contactos
Una sola: **Axis** (`contacts` + tablas relacionadas). Axis ya consolida GHL, Kajabi, Skool,
checkout propio, Stripe, Typeform y hojas de asistencia; la app de mailing **no** integra
esas fuentes por su cuenta. Detalle en `03-datos-desde-axis.md`.

## Fuera de alcance (v1)
- Automatizaciones por evento (secuencias): ya existen en Axis (`mail_flows`).
- Editor drag-and-drop tipo Mailchimp: basta un editor de bloques simple + HTML crudo.
- Envío de WhatsApp/SMS.
- Deduplicación/merge de contactos (lo hace Axis).

## Criterios de éxito
1. Una campaña a 20,000 contactos sale completa, sin duplicados, en menos de 1 hora.
2. Tasa de rebote < 2 % y de quejas < 0.1 % (umbrales de Gmail/Yahoo para remitentes masivos).
3. Toda baja se aplica al instante y queda visible en Axis.
4. Cualquier persona del equipo, sin ayuda técnica, manda una campaña en < 10 minutos.
