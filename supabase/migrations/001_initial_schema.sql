-- BearGold initial schema
-- Run this file in Supabase SQL Editor for the BearGold project.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  role text not null default 'ctv' check (role in ('admin', 'ctv')),
  credits integer not null default 0 check (credits >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.activity_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  target text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists activity_logs_actor_created_idx
  on public.activity_logs (actor_id, created_at desc);

create index if not exists activity_logs_created_idx
  on public.activity_logs (created_at desc);

-- Security-definer helper avoids recursive RLS checks on profiles.
create or replace function public.is_beargold_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role = 'admin'
  );
$$;

revoke all on function public.is_beargold_admin() from public;
grant execute on function public.is_beargold_admin() to authenticated;

alter table public.profiles enable row level security;
alter table public.activity_logs enable row level security;

drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin"
on public.profiles
for select
to authenticated
using (id = (select auth.uid()) or (select public.is_beargold_admin()));

drop policy if exists "activity_logs_select_own_or_admin" on public.activity_logs;
create policy "activity_logs_select_own_or_admin"
on public.activity_logs
for select
to authenticated
using (actor_id = (select auth.uid()) or (select public.is_beargold_admin()));

-- Clients may read permitted rows only. Writes are reserved for trusted server-side code.
revoke all on table public.profiles from anon, authenticated;
grant select on table public.profiles to authenticated;

revoke all on table public.activity_logs from anon, authenticated;
grant select on table public.activity_logs to authenticated;

-- Create a CTV profile automatically when a user signs up.
create or replace function public.handle_new_beargold_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    nullif(new.raw_user_meta_data ->> 'display_name', '')
  )
  on conflict (id) do update
    set email = excluded.email,
        updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_beargold on auth.users;
create trigger on_auth_user_created_beargold
after insert on auth.users
for each row execute procedure public.handle_new_beargold_user();
