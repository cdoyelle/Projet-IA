create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  status text not null default 'active' check (status in ('active', 'closed')),
  start_date date not null default current_date,
  due_date date,
  owner_id uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);

create table if not exists public.project_members (
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (project_id, user_id)
);

alter table public.projects enable row level security;
alter table public.project_members enable row level security;

revoke all on public.projects from anon, authenticated;
revoke all on public.project_members from anon, authenticated;
grant select on public.projects to authenticated;
grant select on public.project_members to authenticated;

create or replace function app_private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.role = 'admin'
      and app_private.has_active_auth_session()
  );
$$;
revoke all on function app_private.is_admin() from public, anon;
grant execute on function app_private.is_admin() to authenticated;

create or replace function app_private.can_access_project(p_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select app_private.has_active_auth_session()
    and (
      app_private.is_admin()
      or exists (
        select 1
        from public.projects pr
        where pr.id = p_project_id
          and pr.owner_id = (select auth.uid())
      )
      or exists (
        select 1
        from public.project_members pm
        where pm.project_id = p_project_id
          and pm.user_id = (select auth.uid())
      )
    );
$$;
revoke all on function app_private.can_access_project(uuid) from public, anon;
grant execute on function app_private.can_access_project(uuid) to authenticated;

drop policy if exists "projects_select_accessible" on public.projects;
create policy "projects_select_accessible" on public.projects
  for select to authenticated
  using (app_private.can_access_project(id));

drop policy if exists "project_members_select_accessible" on public.project_members;
create policy "project_members_select_accessible" on public.project_members
  for select to authenticated
  using (app_private.can_access_project(project_id));
