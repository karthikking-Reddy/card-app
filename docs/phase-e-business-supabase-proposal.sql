-- PHASE E REVIEW-ONLY ARCHITECTURE PROPOSAL
-- DO NOT EXECUTE without backend, RLS, migration and rollback review.
-- Provider tokens, OAuth secrets and webhook signing secrets belong in a
-- server-side vault. Mobile-readable tables store opaque references only.

begin;

create table if not exists public.business_integrations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null check (provider in ('meta', 'whatsapp_cloud')),
  status text not null default 'setup_required'
    check (status in ('setup_required','not_connected','connected','action_required','temporarily_unavailable')),
  credential_reference text,
  provider_business_reference text,
  masked_phone text,
  webhook_verified_at timestamptz,
  verified_at timestamptz,
  last_health_check_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, provider)
);

create table if not exists public.business_automations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 120),
  trigger_key text not null,
  conditions jsonb not null default '[]'::jsonb,
  action_key text not null,
  action_config jsonb not null default '{}'::jsonb,
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.business_automation_runs (
  id uuid primary key default gen_random_uuid(),
  automation_id uuid not null references public.business_automations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null check (status in ('queued','running','succeeded','failed','retrying')),
  safe_failure_code text,
  attempt_count integer not null default 0 check (attempt_count between 0 and 10),
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.business_webhook_endpoints (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint_url text not null check (endpoint_url ~ '^https://'),
  secret_reference text not null,
  event_keys text[] not null default '{}',
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.business_webhook_deliveries (
  id uuid primary key default gen_random_uuid(),
  endpoint_id uuid not null references public.business_webhook_endpoints(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  event_key text not null,
  status text not null check (status in ('queued','succeeded','failed','retrying')),
  response_code integer,
  attempt_count integer not null default 0 check (attempt_count between 0 and 10),
  next_attempt_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.notification_preferences (
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null,
  in_app_enabled boolean not null default true,
  push_enabled boolean not null default false,
  email_enabled boolean not null default false,
  whatsapp_enabled boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, category)
);

create table if not exists public.appointment_settings (
  user_id uuid not null references auth.users(id) on delete cascade,
  card_id uuid not null references public.digital_cards(id) on delete cascade,
  time_zone text not null,
  available_days jsonb not null default '[]'::jsonb,
  working_hours jsonb not null default '{}'::jsonb,
  duration_minutes integer not null check (duration_minutes between 5 and 480),
  break_minutes integer not null default 0 check (break_minutes between 0 and 240),
  daily_limit integer check (daily_limit between 1 and 200),
  meeting_type text check (meeting_type in ('online','physical','either')),
  advance_booking_days integer check (advance_booking_days between 0 and 365),
  cancellation_policy text,
  is_active boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, card_id)
);

create table if not exists public.meta_form_mappings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  integration_id uuid not null references public.business_integrations(id) on delete cascade,
  page_reference text not null,
  form_reference text not null,
  field_mapping jsonb not null default '{}'::jsonb,
  crm_stage text,
  assigned_user_id uuid references auth.users(id) on delete set null,
  is_active boolean not null default false,
  last_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.business_integration_audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  integration_id uuid references public.business_integrations(id) on delete set null,
  event_key text not null,
  safe_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.business_integrations enable row level security;
alter table public.business_automations enable row level security;
alter table public.business_automation_runs enable row level security;
alter table public.business_webhook_endpoints enable row level security;
alter table public.business_webhook_deliveries enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.appointment_settings enable row level security;
alter table public.meta_form_mappings enable row level security;
alter table public.business_integration_audit_logs enable row level security;

-- Policies must be reviewed alongside server worker access. Ordinary clients
-- should receive owner SELECT policies only where needed. Provider connection
-- writes, delivery logs, automation runs and audit logs should be server-owned.
-- Never grant clients access to credential_reference or secret_reference via
-- broad SELECT; expose redacted status through a dedicated RPC/view instead.

create or replace function public.get_my_business_connection_health()
returns table(provider text, status text, masked_phone text, webhook_verified_at timestamptz, last_health_check_at timestamptz)
language sql
security definer
set search_path = pg_catalog, public
as $$
  select bi.provider, bi.status, bi.masked_phone, bi.webhook_verified_at, bi.last_health_check_at
  from public.business_integrations bi
  where bi.user_id = auth.uid();
$$;

revoke all on function public.get_my_business_connection_health() from public;
grant execute on function public.get_my_business_connection_health() to authenticated;

-- A production migration must add explicit owner policies, server-role worker
-- policies, input-validation RPCs, indexes, retention limits and audit review.
-- No function may accept a user_id that substitutes for auth.uid().

rollback;
