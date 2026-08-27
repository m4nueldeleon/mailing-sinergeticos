-- Esquema de contactos de Axis (solo DDL, extraído de sus migraciones).
-- Es la FUENTE DE VERDAD de contactos. La app de mailing lo LEE, no lo modifica.

-- ── contacts ─────────────────────────────
create table contacts (
  id               uuid primary key default gen_random_uuid(),
  email_normalized text not null unique,
  emails           text[] not null default '{}',
  phone_e164       text,
  full_name        text,
  first_name       text,
  country          text,
  region           text,
  city             text,
  lifecycle_stage  text not null default 'lead'
    check (lifecycle_stage in ('lead','registrant','attendee','customer','member')),
  -- Atribución first-touch (inmutable una vez seteada)
  first_utm_source   text,
  first_utm_medium   text,
  first_utm_campaign text,
  first_utm_content  text,
  first_utm_term     text,
  first_utm_id       text,
  first_funnel_slug  text,
  first_source_system text,
  first_seen_at      timestamptz,
  -- Atribución last-touch
  last_utm_source   text,
  last_utm_campaign text,
  -- GHL (referencia; import masivo es fase 2)
  ghl_contact_id   text,
  ghl_account      text check (ghl_account is null or ghl_account in ('usa','mexico','latam')),
  ghl_lead_id      uuid,
  -- Contadores denormalizados (mantenidos por el motor de ingesta)
  touchpoint_count   int not null default 0,
  registration_count int not null default 0,
  purchase_count     int not null default 0,
  ltv_cents          bigint not null default 0,
  last_activity_at   timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- ── contact_identities ─────────────────────────────
create table contact_identities (
  id            bigint generated always as identity primary key,
  contact_id    uuid not null references contacts(id) on delete cascade,
  source_system text not null,
  source_table  text not null,
  source_id     text not null,
  created_at    timestamptz not null default now(),
  unique (source_system, source_table, source_id)
);

-- ── memberships ─────────────────────────────
create table if not exists memberships (
  id bigint generated always as identity primary key,
  contact_id uuid not null references contacts(id) on delete cascade,
  source_system text not null,
  source_table text not null,
  cohorte text,
  evento_origen text,
  tipo_membresia text,
  meses int,
  inicio timestamptz,
  vencimiento date,
  estado text not null check (estado in ('activa', 'expirada', 'revocada', 'inactiva')),
  es_renovacion boolean not null default false,
  pais_bucket text check (pais_bucket in ('mx', 'usa-can', 'latam')),
  refreshed_at timestamptz not null default now(),
  unique (contact_id, source_system, source_table)
);

-- ── purchases ─────────────────────────────
create table purchases (
  id                   uuid primary key default gen_random_uuid(),
  contact_id           uuid not null references contacts(id) on delete cascade,
  source_system        text not null default 'custom-stripe',
  source_session_id    text not null unique,
  status               text not null,
  amount_cents         bigint not null,
  charged_amount_cents bigint,
  currency             text not null,
  product_name         text,
  payment_link_id      text,
  organization_id      text,
  discount_code        text,
  discount_cents       bigint,
  utm_source           text,
  utm_medium           text,
  utm_campaign         text,
  purchased_at         timestamptz not null,
  metadata             jsonb not null default '{}',
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

-- ── touchpoints ─────────────────────────────
create table touchpoints (
  id            uuid not null default gen_random_uuid(),
  contact_id    uuid not null,
  occurred_at   timestamptz not null,
  type          text not null check (type in
    ('registration','attendance','checkout_started','purchase','session_summary',
     'note','call','status_change','opportunity_event')),
  source_system text not null,
  source_table  text,
  source_id     text,
  funnel_slug   text,
  event_slug    text,
  utm_source   text,
  utm_medium   text,
  utm_campaign text,
  utm_content  text,
  utm_term     text,
  utm_id       text,
  amount_cents bigint,
  currency     text,
  title        text,
  payload      jsonb not null default '{}',
  created_at   timestamptz not null default now(),
  primary key (id, occurred_at)
) partition by range (occurred_at);

create unique index touchpoints_dedupe_idx
  on touchpoints (source_system, source_table, source_id, type, occurred_at)
  where source_id is not null;
create index touchpoints_contact_idx on touchpoints (contact_id, occurred_at desc);
create index touchpoints_type_idx    on touchpoints (type, occurred_at desc);
create index touchpoints_funnel_idx  on touchpoints (funnel_slug, occurred_at desc);

alter table touchpoints enable row level security;

-- Particiones mensuales 2023-01 .. 2027-12 + default para fechas fuera de rango
do $$
declare
  d date := date '2023-01-01';
begin
  while d < date '2028-01-01' loop
    execute format(
      'create table touchpoints_%s partition of touchpoints for values from (%L) to (%L)',
      to_char(d, 'YYYY_MM'), d, d + interval '1 month'
    );
    d := d + interval '1 month';
  end loop;
end $$;

create table touchpoints_default partition of touchpoints default;

-- Helper para que el cron de mantenimiento cree la partición del mes siguiente
create or replace function ensure_touchpoint_partition(p_month date)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  part_name text := 'touchpoints_' || to_char(date_trunc('month', p_month), 'YYYY_MM');
  from_d date := date_trunc('month', p_month);
begin
  if not exists (select 1 from pg_class where relname = part_name) then
    execute format(
      'create table %I partition of touchpoints for values from (%L) to (%L)',
      part_name, from_d, from_d + interval '1 month'
    );
  end if;
end $$;
revoke execute on function ensure_touchpoint_partition(date) from public, anon, authenticated;

-- Columna añadida después:
alter table contacts add column if not exists boleto_url text;
