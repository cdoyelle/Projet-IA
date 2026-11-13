grant update (first_name, last_name) on public.profiles to authenticated;

drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_self" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()) and app_private.has_active_auth_session())
  with check (id = (select auth.uid()) and app_private.has_active_auth_session());
