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
    and (
      exists (
        select 1
        from public.profiles me
        where me.id = (select auth.uid())
          and me.role in ('admin', 'owner')
      )
      or exists (
        select 1
        from public.projects pr
        where pr.owner_id = (select auth.uid())
      )
    )
  order by p.first_name, p.last_name;
$$;
revoke all on function public.list_active_profiles_for_project() from public, anon;
grant execute on function public.list_active_profiles_for_project() to authenticated;
