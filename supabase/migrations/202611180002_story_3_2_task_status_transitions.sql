create or replace function public.update_my_task_status(p_task_id uuid, p_status text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_current text;
begin
  if not app_private.has_active_auth_session() then
    raise exception 'Session inactive' using errcode = '42501';
  end if;

  if p_status not in ('created', 'in_progress', 'done') then
    raise exception 'Statut cible invalide' using errcode = '22023';
  end if;

  select t.status into v_current
  from public.tasks t
  join public.projects pr on pr.id = t.project_id
  where t.id = p_task_id
    and t.assignee_id = (select auth.uid())
    and pr.status = 'active';

  if v_current is null then
    raise exception 'Action non autorisée sur cette tâche' using errcode = '42501';
  end if;

  if v_current = 'done' and p_status <> 'in_progress' then
    raise exception 'Transition non autorisée' using errcode = '22023';
  end if;

  update public.tasks
  set status = p_status
  where id = p_task_id;

  return p_status;
end;
$$;
revoke all on function public.update_my_task_status(uuid, text) from public, anon;
grant execute on function public.update_my_task_status(uuid, text) to authenticated;
