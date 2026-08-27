# 06 · Requisitos funcionales (v1)

Prioridad: **M** = imprescindible para lanzar · **S** = siguiente · **C** = después.

## Acceso y roles
- M · Login con correo/contraseña (Supabase Auth). Roles `admin` y `editor`.
- M · `editor` crea y programa campañas; `admin` además gestiona usuarios, supresión y SQL crudo.
- M · Bitácora: quién creó, aprobó y mandó cada campaña; quién exportó qué.

## Listas y segmentos
- M · Segmentos con filtros sobre Axis: etapa, país/región/ciudad, bucket de mercado, membresía
  (estado, vencimiento), compra (producto, fecha), embudo de origen, última actividad.
- M · Vista previa: cuántos contactos entran y una muestra de 20.
- M · Exclusiones automáticas siempre: `mail_supresion` (Axis + propia), correos inválidos,
  destinatarios de la misma campaña ya enviada.
- S · Segmentos guardados y reutilizables; combinar segmentos (unión/intersección/exclusión).
- S · Importar CSV puntual (p. ej. lista de un evento externo) etiquetado como fuente `csv`.
- C · SQL crudo para admins con solo lectura.

## Plantillas y contenido
- M · Plantilla base con marca (`ejemplos/plantilla-base.html`): cabecera, cuerpo, botón,
  pie con dirección física y liga de baja **obligatoria**.
- M · Editor sencillo por bloques (título, texto, botón, imagen, separador) + modo HTML crudo.
- M · Variables: `{{first_name}}`, `{{email}}`, `{{unsubscribe_url}}`; con valor por defecto
  (`{{first_name|Hola}}`).
- M · Envío de prueba a uno o varios correos internos antes de programar.
- S · Biblioteca de plantillas guardadas; duplicar campaña.

## Campañas
- M · Crear → elegir segmento → contenido → prueba → **aprobar** (4 ojos: quien manda ≠ quien
  aprueba, configurable) → programar o mandar ahora.
- M · Congelar destinatarios al programar (`campaign_recipients`) con dedupe por `email_normalized`.
- M · Envío en lotes de 100 vía Resend, con cola, reintentos con backoff, respeto al
  `MAIL_DAILY_CAP` y a la ventana de calentamiento del dominio.
- M · Pausar/cancelar una campaña en curso.
- M · Cabeceras `List-Unsubscribe` + `List-Unsubscribe-Post`, `reply_to`, `tags` con `campaign_id`.
- S · Programación por zona horaria del contacto; A/B de asunto.

## Bajas, rebotes y quejas (supresión)
- M · Liga de baja con token HMAC (`/baja?e=&t=`), página de confirmación en 1 clic, sin login.
- M · One-click unsubscribe (POST RFC 8058).
- M · Webhook: rebote duro y queja → supresión inmediata; rebote suave × 3 → supresión.
- M · La supresión se sincroniza a Axis (`mail_supresion`) y se lee de Axis antes de cada envío.
- S · Motivos de baja y página "prefiero recibir menos".

## Reportes
- M · Por campaña: enviados, entregados, rebotados, quejas, aperturas, clics, bajas; línea de
  tiempo de las primeras 48 h.
- M · Global: tasa de rebote y de quejas por dominio de envío (semáforo: rojo si quejas > 0.1 %
  o rebotes > 2 %).
- S · Clics por liga; comparativo entre campañas; exportar CSV del reporte.

## Cumplimiento
- M · Pie con nombre legal, dirección física y liga de baja (CAN-SPAM para USA; LFPDPPP y aviso
  de privacidad para México).
- M · No mandar a quien nunca dio su correo a Sinergéticos (todo contacto de Axis viene de un
  registro, compra o membresía: documentar la fuente en el pie si se pregunta "¿por qué recibo esto?").
- M · Retención de eventos de correo: 24 meses.

## No funcionales
- Idempotencia total en envío (una campaña no puede salir dos veces por un doble clic o un reintento).
- Todo apagado por defecto (`MAIL_ENABLED=false`) en previews/ramas.
- Logs estructurados por `campaign_id` y `contact_id`.
- Pruebas: unitarias en segmentación/render de variables/firmas HMAC y Svix; E2E del flujo
  "crear → aprobar → mandar prueba".
