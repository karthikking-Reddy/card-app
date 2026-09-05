-- REVIEW ONLY: do not run from the mobile app.
-- Purpose: move lifetime analytics and admin queue pagination to secure server-side RPCs.
-- Security assumptions: auth.uid() is present, profiles.id matches auth.users.id, and
-- digital_cards.user_id identifies card ownership. Keep RLS enabled on every table.

begin;

create or replace function public.get_owned_card_analytics_summary(
  p_card_id uuid default null,
  p_since timestamptz default null
)
returns table (
  card_views bigint,
  link_clicks bigint,
  whatsapp_clicks bigint,
  lead_submits bigint,
  total_events bigint
)
language sql
security definer
set search_path = public, pg_temp
as $$
  select
    count(*) filter (where e.event_type = 'card_view'),
    count(*) filter (where e.event_type like '%\_click' escape '\'),
    count(*) filter (where e.event_type ilike '%whatsapp%'),
    count(*) filter (where e.event_type = 'lead_submit'),
    count(*)
  from public.card_events e
  join public.digital_cards c on c.id = e.card_id
  where c.user_id = auth.uid()
    and (p_card_id is null or c.id = p_card_id)
    and (p_since is null or e.created_at >= p_since);
$$;

revoke all on function public.get_owned_card_analytics_summary(uuid, timestamptz) from public;
grant execute on function public.get_owned_card_analytics_summary(uuid, timestamptz) to authenticated;

-- Paginated replacement for get_pending_card_approvals(). The existing secure RPC remains
-- untouched until callers migrate. Authorization is enforced inside the function, not by UI.
create or replace function public.get_pending_card_approvals_page(
  p_limit integer default 25,
  p_offset integer default 0
)
returns setof public.digital_cards
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.is_yns_admin() then
    raise exception 'Administrator access required';
  end if;

  return query
  select c.*
  from public.digital_cards c
  where c.approval_status = 'pending'
  order by c.approval_requested_at asc nulls last, c.id asc
  limit least(greatest(coalesce(p_limit, 25), 1), 100)
  offset greatest(coalesce(p_offset, 0), 0);
end;
$$;

revoke all on function public.get_pending_card_approvals_page(integer, integer) from public;
grant execute on function public.get_pending_card_approvals_page(integer, integer) to authenticated;

commit;

-- Review checklist:
-- 1. Match the return shape to any joined profile fields used by the existing queue RPC.
-- 2. Prefer a dedicated return type/view if the current queue RPC returns more than cards.
-- 3. Verify is_yns_admin() is safely defined with a fixed search_path.
-- 4. Test as anonymous, normal user, admin, and super_admin before mobile migration.
