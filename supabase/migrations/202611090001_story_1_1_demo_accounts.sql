create extension if not exists pgcrypto;

create schema if not exists app_private;
revoke all on schema app_private from public, anon, authenticated;
grant usage on schema app_private to authenticated;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  first_name text not null default 'Compte',
  last_name text not null default 'à compléter',
  role text not null default 'member',
  active boolean not null default true,
  disabled_at timestamptz,
  created_at timestamptz not null default now()
);

-- Ensure all required Story 1.1 columns exist even if public.profiles was created earlier.
alter table public.profiles add column if not exists first_name text;
alter table public.profiles add column if not exists last_name text;
alter table public.profiles add column if not exists role text;
alter table public.profiles add column if not exists active boolean;
alter table public.profiles add column if not exists disabled_at timestamptz;
alter table public.profiles add column if not exists created_at timestamptz;

update public.profiles
set
  first_name = coalesce(nullif(btrim(left(btrim(first_name), 100)), ''), 'Compte'),
  last_name = coalesce(nullif(btrim(left(btrim(last_name), 100)), ''), 'à compléter'),
  role = case when role in ('admin', 'owner', 'member') then role else 'member' end,
  active = coalesce(active, true),
  created_at = coalesce(created_at, now());

alter table public.profiles
  alter column first_name set default 'Compte',
  alter column first_name set not null,
  alter column last_name set default 'à compléter',
  alter column last_name set not null,
  alter column role set default 'member',
  alter column role set not null,
  alter column active set default true,
  alter column active set not null,
  alter column created_at set default now(),
  alter column created_at set not null;

alter table public.profiles drop constraint if exists profiles_first_name_check;
alter table public.profiles add constraint profiles_first_name_check
  check (first_name = btrim(first_name) and length(first_name) > 0 and length(first_name) <= 100);

alter table public.profiles drop constraint if exists profiles_last_name_check;
alter table public.profiles add constraint profiles_last_name_check
  check (last_name = btrim(last_name) and length(last_name) > 0 and length(last_name) <= 100);

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('admin', 'owner', 'member'));

alter table public.profiles enable row level security;
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;

create or replace function app_private.has_active_auth_session()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from auth.sessions s
    join public.profiles p on p.id = s.user_id
    where s.user_id = (select auth.uid())
      and s.id::text = nullif(
        (coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb ->> 'session_id'),
        ''
      )
      and p.active
      and (p.disabled_at is null or s.created_at > p.disabled_at)
      and (s.not_after is null or s.not_after > now())
  );
$$;
revoke all on function app_private.has_active_auth_session() from public, anon;
grant execute on function app_private.has_active_auth_session() to authenticated;

drop policy if exists "profiles_read_self" on public.profiles;
create policy "profiles_read_self" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) and app_private.has_active_auth_session());

-- Existing Auth users (including the first administrator) also need a profile row.
insert into public.profiles (id, first_name, last_name)
select
  id,
  coalesce(nullif(btrim(left(btrim(raw_user_meta_data ->> 'first_name'), 100)), ''), 'Compte'),
  coalesce(nullif(btrim(left(btrim(raw_user_meta_data ->> 'last_name'), 100)), ''), 'à compléter')
from auth.users
on conflict (id) do nothing;

create or replace function public.handle_new_auth_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, first_name, last_name)
  values (
    new.id,
    coalesce(nullif(btrim(left(btrim(new.raw_user_meta_data ->> 'first_name'), 100)), ''), 'Compte'),
    coalesce(nullif(btrim(left(btrim(new.raw_user_meta_data ->> 'last_name'), 100)), ''), 'à compléter')
  )
  on conflict (id) do update
    set first_name = excluded.first_name,
        last_name = excluded.last_name;
  return new;
end;
$$;
revoke all on function public.handle_new_auth_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
after insert on auth.users
for each row execute function public.handle_new_auth_user();

