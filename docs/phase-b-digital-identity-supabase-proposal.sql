-- REVIEW-ONLY Phase B proposal. Do not execute without backup, staging validation,
-- storage-policy review, and coordinated mobile/public-web deployment.

begin;

alter table public.digital_cards
  add column if not exists company_logo_url text,
  add column if not exists business_hours jsonb,
  add column if not exists appointment_url text;

comment on column public.digital_cards.business_hours is
  'Optional weekly schedule. Validate the agreed JSON shape in application and database code before use.';

create table if not exists public.card_testimonials (
  id uuid primary key default gen_random_uuid(),
  card_id uuid not null references public.digital_cards(id) on delete cascade,
  author_name text not null check (char_length(btrim(author_name)) between 1 and 120),
  author_role text,
  quote text not null check (char_length(btrim(quote)) between 1 and 1000),
  avatar_url text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists card_testimonials_card_sort_idx
  on public.card_testimonials (card_id, sort_order, created_at);

alter table public.card_testimonials enable row level security;

revoke all on table public.card_testimonials from anon, authenticated;
grant select on table public.card_testimonials to anon, authenticated;
grant insert, update, delete on table public.card_testimonials to authenticated;

drop policy if exists "owners manage card testimonials" on public.card_testimonials;
create policy "owners manage card testimonials"
on public.card_testimonials
for all
to authenticated
using (
  exists (
    select 1 from public.digital_cards dc
    where dc.id = card_testimonials.card_id
      and dc.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.digital_cards dc
    where dc.id = card_testimonials.card_id
      and dc.user_id = auth.uid()
  )
);

drop policy if exists "visitors read approved public testimonials" on public.card_testimonials;
create policy "visitors read approved public testimonials"
on public.card_testimonials
for select
to anon, authenticated
using (
  is_active = true
  and exists (
    select 1 from public.digital_cards dc
    where dc.id = card_testimonials.card_id
      and dc.is_public = true
      and dc.is_active = true
      and dc.approval_status = 'approved'
  )
);

-- Before commit, manually verify that the existing update timestamp convention,
-- URL validation, JSON validation and storage policies match production standards.
commit;
