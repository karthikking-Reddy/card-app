-- PHASE F REVIEW-ONLY PROPOSAL. DO NOT EXECUTE WITHOUT SECURITY, BACKUP,
-- ROLLBACK, RETENTION AND BACKEND-WORKER REVIEW.
-- No service-role credential or auth.admin operation belongs in the mobile app.

begin;

create table if not exists public.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  language text not null default 'en' check (language in ('en','te','hi')),
  time_zone text,
  date_format text,
  currency text,
  reduce_motion boolean not null default false,
  larger_text boolean not null default false,
  data_saving boolean not null default false,
  default_card_id uuid references public.digital_cards(id) on delete set null,
  default_share_channel text,
  updated_at timestamptz not null default now()
);

create table if not exists public.account_export_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'requested' check (status in ('requested','processing','ready','failed','expired')),
  safe_failure_code text,
  artifact_reference text,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.account_deletion_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  reason text check (reason is null or char_length(reason) <= 1000),
  status text not null default 'requested' check (status in ('requested','grace_period','processing','cancelled','completed','failed')),
  requested_at timestamptz not null default now(),
  scheduled_for timestamptz,
  completed_at timestamptz,
  unique (user_id)
);

create table if not exists public.account_security_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_key text not null,
  device_category text,
  approximate_region text,
  safe_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null,
  subject text not null check (char_length(trim(subject)) between 3 and 160),
  description text not null check (char_length(trim(description)) between 10 and 5000),
  related_card_id uuid references public.digital_cards(id) on delete set null,
  attachment_reference text,
  diagnostics_consent boolean not null default false,
  status text not null default 'open' check (status in ('open','in_progress','resolved','closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Commercial workspaces are deliberately separate from profiles.role/admin_id.
create table if not exists public.business_workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 2 and 160),
  owner_user_id uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.business_workspace_members (
  workspace_id uuid not null references public.business_workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  workspace_role text not null check (workspace_role in ('owner','manager','salesperson','designer','viewer')),
  status text not null default 'active' check (status in ('invited','active','suspended','revoked')),
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

create table if not exists public.plan_entitlements (
  plan_key text not null,
  feature_key text not null,
  enabled boolean not null default false,
  limit_value bigint,
  primary key (plan_key, feature_key)
);

alter table public.user_preferences enable row level security;
alter table public.account_export_jobs enable row level security;
alter table public.account_deletion_requests enable row level security;
alter table public.account_security_events enable row level security;
alter table public.support_tickets enable row level security;
alter table public.business_workspaces enable row level security;
alter table public.business_workspace_members enable row level security;
alter table public.plan_entitlements enable row level security;

create or replace function public.update_my_profile_name(p_full_name text)
returns public.profiles
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_user_id uuid := auth.uid();
  v_name text := trim(p_full_name);
  v_result public.profiles;
begin
  if v_user_id is null then raise exception 'authentication required'; end if;
  if v_name is null or char_length(v_name) < 2 or char_length(v_name) > 120 then
    raise exception 'invalid full name';
  end if;
  update public.profiles set full_name = v_name, updated_at = now()
  where id = v_user_id returning * into v_result;
  if v_result.id is null then raise exception 'profile not found'; end if;
  return v_result;
end;
$$;

create or replace function public.request_my_account_deletion(p_reason text default null)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_user_id uuid := auth.uid();
  v_id uuid;
  v_reason text := nullif(trim(p_reason), '');
begin
  if v_user_id is null then raise exception 'authentication required'; end if;
  if v_reason is not null and char_length(v_reason) > 1000 then raise exception 'reason too long'; end if;
  -- Production implementation must additionally verify recent authentication.
  insert into public.account_deletion_requests(user_id, reason, status)
  values (v_user_id, v_reason, 'requested')
  on conflict (user_id) do update
    set reason = excluded.reason, status = 'requested', requested_at = now(), completed_at = null
  returning id into v_id;
  return v_id;
end;
$$;

revoke all on function public.update_my_profile_name(text) from public;
revoke all on function public.request_my_account_deletion(text) from public;
grant execute on function public.update_my_profile_name(text) to authenticated;
grant execute on function public.request_my_account_deletion(text) to authenticated;

-- Before deployment add explicit owner policies, column grants, worker-only
-- state transitions, indexes, retention jobs, last-owner protections and
-- redacted status views. Export artifacts and diagnostics must not be readable
-- through broad table grants.

rollback;
