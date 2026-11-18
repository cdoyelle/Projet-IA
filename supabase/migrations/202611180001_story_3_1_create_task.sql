create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'created' check (status in ('created', 'in_progress', 'done')),
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high')),
  due_date date not null,
  tags text[] not null default '{}',
  assignee_id uuid references public.profiles(id) on delete set null,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);

alter table public.tasks enable row level security;
revoke all on public.tasks from anon, authenticated;
grant select, insert on public.tasks to authenticated;

create or replace function app_private.is_valid_task_assignee(p_project_id uuid, p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select p_user_id is null
    or (
      app_private.is_active_profile(p_user_id)
      and (
        exists (
          select 1
          from public.projects pr
          where pr.id = p_project_id
            and pr.owner_id = p_user_id
        )
        or exists (
          select 1
          from public.project_members pm
          where pm.project_id = p_project_id
            and pm.user_id = p_user_id
        )
      )
    );
$$;
revoke all on function app_private.is_valid_task_assignee(uuid, uuid) from public, anon;
grant execute on function app_private.is_valid_task_assignee(uuid, uuid) to authenticated;

drop policy if exists "tasks_select_accessible" on public.tasks;
create policy "tasks_select_accessible" on public.tasks
  for select to authenticated
  using (app_private.can_access_project(project_id));

drop policy if exists "tasks_insert_owner_or_admin" on public.tasks;
create policy "tasks_insert_owner_or_admin" on public.tasks
  for insert to authenticated
  with check (
    app_private.can_manage_project_members(project_id)
    and status = 'created'
    and created_by = (select auth.uid())
    and app_private.is_valid_task_assignee(project_id, assignee_id)
  );

create or replace function public.list_project_assignable_profiles(p_project_id uuid)
returns table (
  id uuid,
  first_name text,
  last_name text,
  role text
)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.first_name, p.last_name, p.role
  from public.profiles p
  where p.active = true
    and app_private.can_access_project(p_project_id)
    and (
      exists (
        select 1
        from public.projects pr
        where pr.id = p_project_id
          and pr.owner_id = p.id
      )
      or exists (
        select 1
        from public.project_members pm
        where pm.project_id = p_project_id
          and pm.user_id = p.id
      )
    )
  order by p.first_name, p.last_name;
$$;
revoke all on function public.list_project_assignable_profiles(uuid) from public, anon;
grant execute on function public.list_project_assignable_profiles(uuid) to authenticated;
