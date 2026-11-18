alter table public.tasks drop constraint if exists tasks_status_check;
alter table public.tasks add constraint tasks_status_check
  check (status in ('created', 'in_progress', 'done', 'cancelled'));

alter table public.tasks add column if not exists previous_status text
  check (previous_status in ('created', 'in_progress', 'done'));

drop policy if exists "tasks_update_owner_or_admin" on public.tasks;
create policy "tasks_update_owner_or_admin" on public.tasks
  for update to authenticated
  using (
    app_private.can_manage_project_members(project_id)
    and status not in ('done', 'cancelled')
  )
  with check (
    app_private.can_manage_project_members(project_id)
    and status not in ('done', 'cancelled')
    and app_private.is_valid_task_assignee(project_id, assignee_id)
  );

create or replace function public.cancel_task(p_task_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not app_private.has_active_auth_session() then
    raise exception 'Session inactive' using errcode = '42501';
  end if;

  update public.tasks t
  set previous_status = t.status,
      status = 'cancelled'
  from public.projects pr
  where t.id = p_task_id
    and pr.id = t.project_id
    and pr.status = 'active'
    and t.status <> 'cancelled'
    and (app_private.is_admin() or pr.owner_id = (select auth.uid()));

  if not found then
    raise exception 'Action non autorisée ou tâche déjà annulée' using errcode = '42501';
  end if;
end;
$$;
revoke all on function public.cancel_task(uuid) from public, anon;
grant execute on function public.cancel_task(uuid) to authenticated;

create or replace function public.reactivate_task(p_task_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_restored text;
begin
  if not app_private.has_active_auth_session() then
    raise exception 'Session inactive' using errcode = '42501';
  end if;

  update public.tasks t
  set status = coalesce(t.previous_status, 'created'),
      previous_status = null
  from public.projects pr
  where t.id = p_task_id
    and pr.id = t.project_id
    and pr.status = 'active'
    and t.status = 'cancelled'
    and (app_private.is_admin() or pr.owner_id = (select auth.uid()))
  returning t.status into v_restored;

  if v_restored is null then
    raise exception 'Action non autorisée ou tâche non annulée' using errcode = '42501';
  end if;

  return v_restored;
end;
$$;
revoke all on function public.reactivate_task(uuid) from public, anon;
grant execute on function public.reactivate_task(uuid) to authenticated;
