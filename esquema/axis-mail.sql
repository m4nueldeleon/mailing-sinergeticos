-- Tablas de correo que YA existen en Axis (solo DDL).
-- mail_envios/mail_eventos = log de transaccionales; mail_flows/* = secuencias por evento;
-- mail_supresion = bajas globales (la app de mailing DEBE respetarla).

create table mail_envios (
  id bigint generated always as identity primary key,
  -- qué sistema pidió el envío: 'afiliados' | 'seed' | 'axis' | 'checkout'...
  -- es la etiqueta que después permite medir por origen en el panel
  sistema text not null,
  destinatario text not null,
  asunto text not null default '',
  -- id que devuelve Resend; los eventos del webhook se amarran por aquí
  provider_id text unique,
  -- enviando | enviado | entregado | rebotado | spam | error
  status text not null default 'enviando',
  error text,
  -- idempotencia: el mismo idem_key jamás manda dos correos
  idem_key text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create table mail_eventos (
  id bigint generated always as identity primary key,
  provider_id text not null,
  tipo text not null,
  payload jsonb,
  created_at timestamptz not null default now()
);

create table if not exists mail_flows (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  -- 'free_ticket' = registro presencial con boleto interno (el primero que migramos)
  trigger text not null default 'free_ticket',
  -- base: aplica a cualquier evento (las variables se resuelven por evento al enviar)
  is_base boolean not null default true,
  status text not null default 'borrador' check (status in ('borrador','activo','pausado')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists mail_steps (
  id uuid primary key default gen_random_uuid(),
  flow_id uuid not null references mail_flows(id) on delete cascade,
  position int not null,
  subject text not null,
  pre_header text,
  html text not null,
  -- 'registro' = offset desde la inscripción; 'evento' = offset desde event_at
  timing_base text not null default 'evento' check (timing_base in ('registro','evento')),
  offset_minutes int not null default 0,
  -- si al inscribirse la hora calculada ya pasó, el paso se salta (igual que GHL)
  skip_si_paso boolean not null default true,
  created_at timestamptz not null default now(),
  unique (flow_id, position)
);

create table if not exists mail_enrollments (
  id uuid primary key default gen_random_uuid(),
  flow_id uuid not null references mail_flows(id) on delete cascade,
  contact_id uuid,
  email text not null,
  event_tk_id text not null,
  event_name text,
  event_at timestamptz,
  timezone text,
  status text not null default 'activo' check (status in ('activo','cancelado','completado')),
  cancel_reason text,
  created_at timestamptz not null default now(),
  -- una inscripción por persona/evento/flujo: reintentos del hook no duplican
  unique (flow_id, email, event_tk_id)
);

create table if not exists mail_sends (
  id bigint generated always as identity primary key,
  enrollment_id uuid not null references mail_enrollments(id) on delete cascade,
  step_id uuid not null references mail_steps(id) on delete cascade,
  email text not null,
  scheduled_for timestamptz not null,
  status text not null default 'pendiente'
    check (status in ('pendiente','enviado','error','cancelado','saltado','suprimido')),
  envio_id bigint,           -- FK lógica a mail_envios (el registro del envío real)
  error text,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  unique (enrollment_id, step_id)
);

create table if not exists mail_supresion (
  email text primary key,
  motivo text not null default 'baja',
  created_at timestamptz not null default now()
);

