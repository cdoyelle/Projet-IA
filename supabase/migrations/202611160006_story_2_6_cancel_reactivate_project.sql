alter table public.projects drop constraint if exists projects_status_check;
alter table public.projects add constraint projects_status_check
  check (status in ('active', 'closed', 'cancelled'));

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
        join public.projects pr on pr.id = pm.project_id
        where pm.project_id = p_project_id
          and pm.user_id = (select auth.uid())
          and pr.status <> 'cancelled'
      )
    );
$$;

create or replace function public.cancel_project(p_project_id uuid)
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
  set status = 'cancelled',
      closed_at = v_closed_at
  where id = p_project_id
    and status = 'active'
    and (app_private.is_admin() or owner_id = (select auth.uid()));

  if not found then
    raise exception 'Action non autorisée ou projet non actif' using errcode = '42501';
  end if;

  return v_closed_at;
end;
$$;
revoke all on function public.cancel_project(uuid) from public, anon;
grant execute on function public.cancel_project(uuid) to authenticated;

create or replace function public.reactivate_project(p_project_id uuid)
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
  set status = 'active',
      closed_at = null
  where id = p_project_id
    and status = 'cancelled'
    and (app_private.is_admin() or owner_id = (select auth.uid()));

  if not found then
    raise exception 'Action non autorisée ou projet non annulé' using errcode = '42501';
  end if;
end;
$$;
revoke all on function public.reactivate_project(uuid) from public, anon;
grant execute on function public.reactivate_project(uuid) to authenticated;
