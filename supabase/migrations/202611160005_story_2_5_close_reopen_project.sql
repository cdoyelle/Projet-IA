alter table public.projects add column if not exists closed_at timestamptz;

create or replace function public.close_project(p_project_id uuid)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_closed_at timestamptz := now();
begin
  if not app_private.has_active_auth_session() then
    raise exception 'Session inactive' using errcode = '42501';
  end if;

  update public.projects
  set status = 'closed',
      closed_at = v_closed_at
  where id = p_project_id
    and status = 'active'
    and (app_private.is_admin() or owner_id = (select auth.uid()));

  if not found then
    raise exception 'Action non autorisée ou projet déjà clôturé' using errcode = '42501';
  end if;

  return v_closed_at;
end;
$$;
revoke all on function public.close_project(uuid) from public, anon;
grant execute on function public.close_project(uuid) to authenticated;

create or replace function public.reopen_project(p_project_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not app_private.has_active_auth_session() then
    raise exception 'Session inactive' using errcode = '42501';
  end if;

  update public.projects
  set status = 'active'
  where id = p_project_id
    and status = 'closed'
    and (app_private.is_admin() or owner_id = (select auth.uid()));

  if not found then
    raise exception 'Action non autorisée ou projet non clôturé' using errcode = '42501';
  end if;
end;
$$;
revoke all on function public.reopen_project(uuid) from public, anon;
grant execute on function public.reopen_project(uuid) to authenticated;
