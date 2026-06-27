create table if not exists public.trip_app_stores (
  user_id uuid primary key references auth.users(id) on delete cascade,
  trip_store jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.trip_app_stores enable row level security;

grant select, insert, update, delete on public.trip_app_stores to authenticated;

drop policy if exists "Users can read own trip app store" on public.trip_app_stores;
create policy "Users can read own trip app store"
on public.trip_app_stores
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert own trip app store" on public.trip_app_stores;
create policy "Users can insert own trip app store"
on public.trip_app_stores
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update own trip app store" on public.trip_app_stores;
create policy "Users can update own trip app store"
on public.trip_app_stores
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own trip app store" on public.trip_app_stores;
create policy "Users can delete own trip app store"
on public.trip_app_stores
for delete
to authenticated
using (auth.uid() = user_id);
