-- REVIEW ONLY. Do not execute without staging, backup, RLS review and coordinated deployment.
begin;

alter table public.connections
  add column if not exists tags text[] not null default '{}',
  add column if not exists assigned_user_id uuid references public.profiles(id) on delete set null,
  add column if not exists lost_reason text,
  add column if not exists converted_at timestamptz,
  add column if not exists won_value numeric(14,2) check (won_value is null or won_value >= 0),
  add column if not exists normalized_phone text,
  add column if not exists normalized_email text;

alter table public.connections enable row level security;

create index if not exists connections_owner_created_idx
  on public.connections (owner_user_id, created_at desc, id desc);
create index if not exists connections_owner_stage_created_idx
  on public.connections (owner_user_id, stage, created_at desc, id desc);
create index if not exists connections_owner_priority_created_idx
  on public.connections (owner_user_id, priority, created_at desc, id desc);
create index if not exists connections_owner_followup_idx
  on public.connections (owner_user_id, next_follow_up_at)
  where next_follow_up_at is not null;
create index if not exists connections_owner_email_idx
  on public.connections (owner_user_id, normalized_email)
  where normalized_email is not null;
create index if not exists connections_owner_phone_idx
  on public.connections (owner_user_id, normalized_phone)
  where normalized_phone is not null;
create index if not exists followup_tasks_user_status_due_idx
  on public.followup_tasks (user_id, status, due_at, id);

create or replace function public.find_connection_duplicates(
  p_phone text default null,
  p_email text default null
)
returns table (id uuid, name text, phone text, email text, company text, stage text)
language sql
security invoker
set search_path = public, pg_temp
as $$
  select c.id, c.name, c.phone, c.email, c.company, c.stage
  from public.connections c
  where c.owner_user_id = auth.uid()
    and (
      (nullif(lower(trim(p_email)), '') is not null and c.normalized_email = lower(trim(p_email)))
      or
      (nullif(regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g'), '') is not null
       and c.normalized_phone = regexp_replace(p_phone, '[^0-9]', '', 'g'))
    )
  order by c.created_at desc
  limit 10;
$$;

revoke all on function public.find_connection_duplicates(text, text) from public, anon;
grant execute on function public.find_connection_duplicates(text, text) to authenticated;

create or replace function public.get_crm_pipeline_summary()
returns jsonb
language sql
security invoker
set search_path = public, pg_temp
as $$
  select jsonb_build_object(
    'total_leads', count(*),
    'estimated_pipeline', coalesce(sum(c.estimated_value) filter (
      where not exists (
        select 1 from public.lead_stages s
        where s.user_id = auth.uid() and s.stage_key = c.stage and (s.is_won or s.is_lost)
      )
    ), 0),
    'won_revenue', coalesce(sum(c.won_value) filter (
      where exists (
        select 1 from public.lead_stages s
        where s.user_id = auth.uid() and s.stage_key = c.stage and s.is_won
      )
    ), 0)
  )
  from public.connections c
  where c.owner_user_id = auth.uid();
$$;

revoke all on function public.get_crm_pipeline_summary() from public, anon;
grant execute on function public.get_crm_pipeline_summary() to authenticated;

-- Before execution, add reviewed triggers to populate normalized_phone/normalized_email,
-- validate assignment belongs to the caller's workspace, and decide whether stage changes
-- should atomically set converted_at/lost_reason. Review all existing RLS and table grants;
-- do not replace or weaken them.
commit;
