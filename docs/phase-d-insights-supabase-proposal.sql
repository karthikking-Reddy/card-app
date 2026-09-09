-- REVIEW ONLY. Do not execute without staging, backups, privacy review and load testing.
begin;

create index if not exists card_events_card_created_idx
  on public.card_events (card_id, created_at desc);
create index if not exists card_events_card_type_created_idx
  on public.card_events (card_id, event_type, created_at desc);
create index if not exists connections_owner_card_created_idx
  on public.connections (owner_user_id, card_id, created_at desc);

create or replace function public.get_owned_insights_summary(
  p_start timestamptz,
  p_end timestamptz,
  p_card_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_result jsonb;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if p_start is null or p_end is null or p_start >= p_end then raise exception 'Invalid date range'; end if;
  if p_end > now() + interval '5 minutes' or p_end - p_start > interval '370 days' then raise exception 'Date range outside allowed bounds'; end if;
  if p_card_id is not null and not exists (
    select 1 from public.digital_cards dc where dc.id = p_card_id and dc.user_id = v_user_id
  ) then raise exception 'Card unavailable'; end if;

  with owned_cards as (
    select id from public.digital_cards where user_id = v_user_id and (p_card_id is null or id = p_card_id)
  ), period_events as (
    select ce.* from public.card_events ce join owned_cards oc on oc.id = ce.card_id
    where ce.created_at >= p_start and ce.created_at < p_end
  ), period_leads as (
    select c.* from public.connections c
    where c.owner_user_id = v_user_id and (p_card_id is null or c.card_id = p_card_id)
      and c.created_at >= p_start and c.created_at < p_end
  )
  select jsonb_build_object(
    'card_views', count(*) filter (where event_type = 'card_view'),
    'unique_visitors', count(distinct visitor_token) filter (where event_type = 'card_view' and visitor_token is not null),
    'views_without_token', count(*) filter (where event_type = 'card_view' and visitor_token is null),
    'contact_actions', count(*) filter (where event_type = any(array['whatsapp_click','phone_click','email_click','website_click','location_click','save_contact_click','contact_save'])),
    'contact_saves', count(*) filter (where event_type = any(array['save_contact_click','contact_save'])),
    'enquiries', count(*) filter (where event_type = any(array['lead_submit','enquiry_submit'])),
    'crm_leads', (select count(*) from period_leads)
  ) into v_result from period_events;
  return coalesce(v_result, '{}'::jsonb);
end;
$$;

revoke all on function public.get_owned_insights_summary(timestamptz, timestamptz, uuid) from public, anon;
grant execute on function public.get_owned_insights_summary(timestamptz, timestamptz, uuid) to authenticated;

create or replace function public.get_owned_insights_timeseries(
  p_start timestamptz,
  p_end timestamptz,
  p_card_id uuid default null,
  p_bucket text default 'day'
)
returns table(bucket timestamptz, card_views bigint, contact_actions bigint, enquiries bigint)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare v_user_id uuid := auth.uid();
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if p_start is null or p_end is null or p_start >= p_end or p_end - p_start > interval '370 days' then raise exception 'Invalid date range'; end if;
  if p_bucket not in ('day','week','month') then raise exception 'Invalid bucket'; end if;
  if p_card_id is not null and not exists (select 1 from public.digital_cards where id = p_card_id and user_id = v_user_id) then raise exception 'Card unavailable'; end if;
  return query
    select date_trunc(p_bucket, ce.created_at),
      count(*) filter (where ce.event_type = 'card_view'),
      count(*) filter (where ce.event_type = any(array['whatsapp_click','phone_click','email_click','website_click','location_click','save_contact_click','contact_save'])),
      count(*) filter (where ce.event_type = any(array['lead_submit','enquiry_submit']))
    from public.card_events ce
    join public.digital_cards dc on dc.id = ce.card_id and dc.user_id = v_user_id
    where ce.created_at >= p_start and ce.created_at < p_end and (p_card_id is null or ce.card_id = p_card_id)
    group by 1 order by 1;
end;
$$;

revoke all on function public.get_owned_insights_timeseries(timestamptz, timestamptz, uuid, text) from public, anon;
grant execute on function public.get_owned_insights_timeseries(timestamptz, timestamptz, uuid, text) to authenticated;

-- Proposed campaign foundation; review public insert abuse/rate limits before adoption.
create table if not exists public.card_qr_campaigns (
  id uuid primary key default gen_random_uuid(),
  card_id uuid not null references public.digital_cards(id) on delete cascade,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  label text not null check (char_length(btrim(label)) between 1 and 100),
  campaign_token uuid not null default gen_random_uuid() unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.card_qr_campaigns enable row level security;
revoke all on table public.card_qr_campaigns from anon, authenticated;
grant select, insert, update, delete on table public.card_qr_campaigns to authenticated;
-- Add reviewed owner-only policies before executing this proposal. Public scan recording should
-- use a narrowly scoped, rate-limited RPC that validates campaign/card visibility and never
-- accepts owner IDs, raw IP addresses or service-role credentials from the client.

-- Additional coordinated work: link enquiry events to the created connection ID; add explicit
-- traffic/campaign/device-category fields with consent and retention rules; add service_id and
-- portfolio_item_id attribution; add won_value only after business rules are approved; provide
-- owner-authorized export/delete RPCs. Every future SECURITY DEFINER function must repeat the
-- fixed search_path, auth.uid ownership checks, bounded inputs and explicit revoke/grant pattern.
rollback;
