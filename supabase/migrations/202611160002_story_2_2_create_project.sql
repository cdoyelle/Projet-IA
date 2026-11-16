grant insert on public.projects to authenticated;

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
        and p.role in ('admin', 'owner')
    )
  );
