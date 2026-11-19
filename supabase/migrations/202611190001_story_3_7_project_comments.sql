create table if not exists public.project_comments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  content text not null check (length(btrim(content)) > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

alter table public.project_comments enable row level security;
revoke all on public.project_comments from anon, authenticated;
grant select, insert, delete on public.project_comments to authenticated;
grant update (content, updated_at) on public.project_comments to authenticated;

drop policy if exists "project_comments_select_accessible" on public.project_comments;
create policy "project_comments_select_accessible" on public.project_comments
  for select to authenticated
  using (app_private.can_access_project(project_id));

drop policy if exists "project_comments_insert_accessible" on public.project_comments;
create policy "project_comments_insert_accessible" on public.project_comments
  for insert to authenticated
  with check (
    app_private.can_access_project(project_id)
    and author_id = (select auth.uid())
  );

drop policy if exists "project_comments_update_authorized" on public.project_comments;
create policy "project_comments_update_authorized" on public.project_comments
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

drop policy if exists "project_comments_delete_authorized" on public.project_comments;
create policy "project_comments_delete_authorized" on public.project_comments
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

create or replace function public.list_project_comments(p_project_id uuid)
returns table (
  id uuid,
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
    c.project_id,
    c.author_id,
    trim(p.first_name || ' ' || p.last_name) as author_name,
    c.content,
    c.created_at,
    c.updated_at
  from public.project_comments c
  join public.profiles p on p.id = c.author_id
  where c.project_id = p_project_id
    and app_private.can_access_project(p_project_id)
  order by c.created_at desc;
$$;
revoke all on function public.list_project_comments(uuid) from public, anon;
grant execute on function public.list_project_comments(uuid) to authenticated;
