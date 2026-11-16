grant update (name, description, start_date, due_date) on public.projects to authenticated;

drop policy if exists "projects_update_active_owner_or_admin" on public.projects;
create policy "projects_update_active_owner_or_admin" on public.projects
  for update to authenticated
  using (
    app_private.has_active_auth_session()
    and status = 'active'
    and (app_private.is_admin() or owner_id = (select auth.uid()))
  )
  with check (
    app_private.has_active_auth_session()
    and status = 'active'
    and (app_private.is_admin() or owner_id = (select auth.uid()))
  );
