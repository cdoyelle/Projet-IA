alter table public.tasks add column if not exists has_started boolean not null default false;

update public.tasks
set has_started = true
where status <> 'created';

create or replace function app_private.mark_task_started()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status <> 'created' then
    new.has_started := true;
  end if;
  return new;
end;
$$;

drop trigger if exists tasks_mark_started on public.tasks;
create trigger tasks_mark_started
before update on public.tasks
for each row execute function app_private.mark_task_started();

create or replace function public.delete_virgin_task(p_task_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not app_private.has_active_auth_session() then
    raise exception 'Session inactive' using errcode = '42501';
  end if;

  delete from public.tasks t
  using public.projects pr
  where t.id = p_task_id
    and pr.id = t.project_id
    and pr.status = 'active'
    and t.status = 'created'
    and t.has_started = false
    and (app_private.is_admin() or pr.owner_id = (select auth.uid()));

  if not found then
    raise exception 'Suppression non autorisée ou tâche déjà commencée' using errcode = '42501';
  end if;
end;
$$;
revoke all on function public.delete_virgin_task(uuid) from public, anon;
grant execute on function public.delete_virgin_task(uuid) to authenticated;
