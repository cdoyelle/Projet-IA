grant insert, delete on public.project_members to authenticated;

create or replace function app_private.is_active_profile(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = p_user_id
      and p.active = true
  );
$$;
revoke all on function app_private.is_active_profile(uuid) from public, anon;
grant execute on function app_private.is_active_profile(uuid) to authenticated;

create or replace function app_private.can_manage_project_members(p_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select app_private.has_active_auth_session()
    and exists (
      select 1
      from public.projects pr
      where pr.id = p_project_id
        and pr.status = 'active'
        and (app_private.is_admin() or pr.owner_id = (select auth.uid()))
    );
$$;
revoke all on function app_private.can_manage_project_members(uuid) from public, anon;
grant execute on function app_private.can_manage_project_members(uuid) to authenticated;

drop policy if exists "project_members_insert_owner_or_admin" on public.project_members;
create policy "project_members_insert_owner_or_admin" on public.project_members
  for insert to authenticated
  with check (
    app_private.can_manage_project_members(project_id)
    and app_private.is_active_profile(user_id)
  );

drop policy if exists "project_members_delete_owner_or_admin" on public.project_members;
create policy "project_members_delete_owner_or_admin" on public.project_members
  for delete to authenticated
  using (app_private.can_manage_project_members(project_id));

create or replace function public.list_project_members(p_project_id uuid)
returns table (
  user_id uuid,
  first_name text,
  last_name text,
  role text
)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id as user_id, p.first_name, p.last_name, p.role
  from public.project_members pm
  join public.profiles p on p.id = pm.user_id
  where pm.project_id = p_project_id
    and app_private.can_access_project(p_project_id)
  order by p.first_name, p.last_name;
$$;
revoke all on function public.list_project_members(uuid) from public, anon;
grant execute on function public.list_project_members(uuid) to authenticated;

create or replace function public.list_active_profiles_for_project()
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
    and app_private.has_active_auth_session()
    and exists (
      select 1
      from public.profiles me
      where me.id = (select auth.uid())
        and me.role in ('admin', 'owner')
    )
  order by p.first_name, p.last_name;
$$;
revoke all on function public.list_active_profiles_for_project() from public, anon;
grant execute on function public.list_active_profiles_for_project() to authenticated;

create or replace function public.add_project_member(p_project_id uuid, p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not app_private.can_manage_project_members(p_project_id) then
    raise exception 'Action non autorisée' using errcode = '42501';
  end if;
  if not app_private.is_active_profile(p_user_id) then
    raise exception 'Compte inactif ou introuvable' using errcode = '22023';
  end if;
  insert into public.project_members (project_id, user_id)
  values (p_project_id, p_user_id)
  on conflict (project_id, user_id) do nothing;
end;
$$;
revoke all on function public.add_project_member(uuid, uuid) from public, anon;
grant execute on function public.add_project_member(uuid, uuid) to authenticated;
