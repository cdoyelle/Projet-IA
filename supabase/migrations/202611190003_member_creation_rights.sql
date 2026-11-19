alter table public.profiles add column if not exists can_create_projects boolean not null default false;
alter table public.profiles add column if not exists can_create_tasks boolean not null default false;

drop policy if exists "projects_insert_owner_or_admin" on public.projects;
create policy "projects_insert_owner_or_admin" on public.projects
  for insert to authenticated
  with check (
    app_private.has_active_auth_session()
    and owner_id = (select auth.uid())
    and status = 'active'
    and exists (
      select 1
      from public.profiles p
      where p.id = (select auth.uid())
        and (p.role in ('admin', 'owner') or p.can_create_projects = true)
    )
  );

drop policy if exists "tasks_insert_owner_or_admin" on public.tasks;
create policy "tasks_insert_owner_or_admin" on public.tasks
  for insert to authenticated
  with check (
    app_private.has_active_auth_session()
    and status = 'created'
    and created_by = (select auth.uid())
    and app_private.is_valid_task_assignee(project_id, assignee_id)
    and (
      app_private.can_manage_project_members(project_id)
      or (
        app_private.can_access_project(project_id)
        and exists (
          select 1 from public.projects pr
          where pr.id = project_id and pr.status = 'active'
        )
        and exists (
          select 1 from public.profiles p
          where p.id = (select auth.uid()) and p.can_create_tasks = true
        )
      )
    )
  );
