-- Run this in Supabase SQL Editor once.

create table if not exists public.billing_sessions (
  id bigint generated always as identity primary key,
  date date not null,
  time text not null,
  tutee text not null,
  sessions integer not null default 1 check (sessions > 0),
  status text not null check (status in ('paid', 'unpaid')),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists billing_sessions_date_time_idx
  on public.billing_sessions (date, time, sort_order);

alter table public.billing_sessions enable row level security;

-- For this tutoring dashboard (no login), allow read/write with anon key.
-- If you want stricter security, add Auth and tighten these policies.
drop policy if exists "billing read anon" on public.billing_sessions;
create policy "billing read anon"
on public.billing_sessions
for select
using (true);

drop policy if exists "billing insert anon" on public.billing_sessions;
create policy "billing insert anon"
on public.billing_sessions
for insert
with check (true);

drop policy if exists "billing update anon" on public.billing_sessions;
create policy "billing update anon"
on public.billing_sessions
for update
using (true)
with check (true);
