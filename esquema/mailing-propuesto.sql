-- Esquema PROPUESTO para la base propia de la app de mailing (Postgres/Supabase).
-- Es una sugerencia de arranque, no un contrato: ajústalo a tu medida.
-- Principio: los contactos NO se copian aquí; se referencian por contact_id (uuid de Axis)
-- y se congela el email al momento de programar la campaña.

create extension if not exists pgcrypto;

-- Usuarios de la app (además de auth.users de Supabase)
create table app_users (
  id uuid primary key,                       -- = auth.users.id
  email text not null unique,
  role text not null default 'editor' check (role in ('admin','editor')),
  created_at timestamptz not null default now()
);

-- Segmentos guardados: filtros sobre Axis, serializados como JSON
create table segments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  filters jsonb not null default '{}',       -- {lifecycle_stage:[...], country:[...], membership:{estado:...}, last_activity_days:540, ...}
  raw_sql text,                              -- solo admins; se ejecuta contra AXIS_DATABASE_URL_RO
  created_by uuid references app_users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Plantillas
create table templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  subject text not null default '',
  pre_header text,
  blocks jsonb,                              -- editor por bloques
  html text not null,                        -- render final (o HTML crudo)
  text_body text,
  created_by uuid references app_users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Campañas
create table campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  subject text not null,
  pre_header text,
  from_name text not null,
  from_email text not null,
  reply_to text,
  html text not null,
  text_body text,
  segment_id uuid references segments(id),
  status text not null default 'borrador'
    check (status in ('borrador','en_revision','aprobada','programada','enviando','pausada','enviada','cancelada')),
  scheduled_for timestamptz,
  started_at timestamptz,
  finished_at timestamptz,
  created_by uuid references app_users(id),
  approved_by uuid references app_users(id), -- 4 ojos: distinto de created_by
  approved_at timestamptz,
  totals jsonb not null default '{}',        -- cache: {recipients, sent, delivered, bounced, complained, opened, clicked, unsubscribed}
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Destinatarios congelados al programar (dedupe por email; ya filtrados por supresión)
create table campaign_recipients (
  campaign_id uuid not null references campaigns(id) on delete cascade,
  contact_id uuid,                           -- uuid de contacts en Axis (null si vino de CSV)
  email text not null,
  first_name text,
  vars jsonb not null default '{}',          -- variables extra para la plantilla
  batch_no int,                              -- trozo de 100 al que pertenece
  primary key (campaign_id, email)
);

-- Envíos reales (una fila por correo mandado a Resend)
create table campaign_sends (
  id bigint generated always as identity primary key,
  campaign_id uuid not null references campaigns(id) on delete cascade,
  contact_id uuid,
  email text not null,
  provider_id text unique,                   -- id que devuelve Resend: llave del webhook
  idem_key text unique,                      -- campaign_id:email — jamás se manda dos veces
  status text not null default 'pendiente'
    check (status in ('pendiente','enviado','entregado','retrasado','rebotado','queja','abierto','clic','error','suprimido')),
  error text,
  sent_at timestamptz,
  updated_at timestamptz,
  created_at timestamptz not null default now(),
  unique (campaign_id, email)
);
create index campaign_sends_campaign_idx on campaign_sends (campaign_id, status);

-- Eventos crudos del webhook de Resend (auditoría; nunca se borran antes de 24 meses)
create table mail_events (
  id bigint generated always as identity primary key,
  provider_id text not null,
  type text not null,                        -- email.delivered, email.bounced, ...
  payload jsonb not null,
  created_at timestamptz not null default now()
);
create index mail_events_provider_idx on mail_events (provider_id, created_at desc);

-- Supresión propia (se sincroniza con mail_supresion de Axis en ambos sentidos)
create table suppression (
  email text primary key,
  reason text not null check (reason in ('baja','rebote_duro','rebote_suave_x3','queja','manual','axis')),
  campaign_id uuid,                          -- de qué campaña vino la baja/queja
  synced_to_axis_at timestamptz,             -- null = pendiente de mandar a Axis
  created_at timestamptz not null default now()
);

-- Bitácora de acciones sensibles
create table audit_log (
  id bigint generated always as identity primary key,
  user_id uuid references app_users(id),
  action text not null,                      -- campaign.approve, campaign.send, export.csv, suppression.add, ...
  entity text,
  entity_id text,
  detail jsonb,
  created_at timestamptz not null default now()
);

-- RLS: activar en todas y permitir solo a usuarios autenticados de app_users; service role para el worker.
alter table app_users enable row level security;
alter table segments enable row level security;
alter table templates enable row level security;
alter table campaigns enable row level security;
alter table campaign_recipients enable row level security;
alter table campaign_sends enable row level security;
alter table mail_events enable row level security;
alter table suppression enable row level security;
alter table audit_log enable row level security;
