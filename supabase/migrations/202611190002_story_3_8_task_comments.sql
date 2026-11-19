create table if not exists public.task_comments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  content text not null check (length(btrim(content)) > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

alter table public.task_comments enable row level security;
revoke all on public.task_comments from anon, authenticated;
grant select, insert, delete on public.task_comments to authenticated;
grant update (content, updated_at) on public.task_comments to authenticated;

drop policy if exists "task_comments_select_accessible" on public.task_comments;
create policy "task_comments_select_accessible" on public.task_comments
  for select to authenticated
  using (app_private.can_access_project(project_id));

drop policy if exists "task_comments_insert_accessible" on public.task_comments;
create policy "task_comments_insert_accessible" on public.task_comments
  for insert to authenticated
  with check (
    app_private.can_access_project(project_id)
    and author_id = (select auth.uid())
    and exists (
      select 1 from public.tasks t
      where t.id = task_id and t.project_id = project_id
    )
  );

drop policy if exists "task_comments_update_authorized" on public.task_comments;
create policy "task_comments_update_authorized" on public.task_comments
  for update to authenticated
  using (
    app_private.can_access_project(project_id)
    and (
      author_id = (select auth.uid())
      or app_private.is_admin()
      or exists (
        select 1 from public.projects pr
        where pr.id = project_id and pr.owner_id = (select auth.uid())
      )
    )
  )
  with check (
    app_private.can_access_project(project_id)
    and (
      author_id = (select auth.uid())
      or app_private.is_admin()
      or exists (
        select 1 from public.projects pr
        where pr.id = project_id and pr.owner_id = (select auth.uid())
      )
    )
  );

drop policy if exists "task_comments_delete_authorized" on public.task_comments;
create policy "task_comments_delete_authorized" on public.task_comments
  for delete to authenticated
  using (
    app_private.can_access_project(project_id)
    and (
      author_id = (select auth.uid())
      or app_private.is_admin()
      or exists (
        select 1 from public.projects pr
        where pr.id = project_id and pr.owner_id = (select auth.uid())
      )
    )
  );

create or replace function public.list_task_comments(p_project_id uuid)
returns table (
  id uuid,
  task_id uuid,
  project_id uuid,
  author_id uuid,
  author_name text,
  content text,
  created_at timestamptz,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    c.id,
    c.task_id,
    c.project_id,
    c.author_id,
    trim(p.first_name || ' ' || p.last_name) as author_name,
    c.content,
    c.created_at,
    c.updated_at
  from public.task_comments c
  join public.profiles p on p.id = c.author_id
  where c.project_id = p_project_id
    and app_private.can_access_project(p_project_id)
  order by c.created_at desc;
$$;
revoke all on function public.list_task_comments(uuid) from public, anon;
grant execute on function public.list_task_comments(uuid) to authenticated;

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
    and not exists (select 1 from public.task_comments tc where tc.task_id = t.id)
    and (app_private.is_admin() or pr.owner_id = (select auth.uid()));

  if not found then
    raise exception 'Suppression non autorisée ou tâche déjà commencée/commentée' using errcode = '42501';
  end if;
end;
$$;
