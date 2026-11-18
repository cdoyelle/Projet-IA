grant update (title, description, priority, due_date, tags, assignee_id) on public.tasks to authenticated;

drop policy if exists "tasks_update_owner_or_admin" on public.tasks;
create policy "tasks_update_owner_or_admin" on public.tasks
  for update to authenticated
  using (
    app_private.can_manage_project_members(project_id)
    and status <> 'done'
  )
  with check (
    app_private.can_manage_project_members(project_id)
    and status <> 'done'
    and app_private.is_valid_task_assignee(project_id, assignee_id)
  );

create or replace function public.reopen_done_task(p_task_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not app_private.has_active_auth_session() then
    raise exception 'Session inactive' using errcode = '42501';
  end if;

  update public.tasks t
  set status = 'in_progress'
  from public.projects pr
  where t.id = p_task_id
    and pr.id = t.project_id
    and pr.status = 'active'
    and t.status = 'done'
    and (
      t.assignee_id = (select auth.uid())
      or app_private.is_admin()
      or pr.owner_id = (select auth.uid())
    );

  if not found then
    raise exception 'Action non autorisée ou tâche non terminée' using errcode = '42501';
  end if;

  return 'in_progress';
end;
$$;
revoke all on function public.reopen_done_task(uuid) from public, anon;
grant execute on function public.reopen_done_task(uuid) to authenticated;
