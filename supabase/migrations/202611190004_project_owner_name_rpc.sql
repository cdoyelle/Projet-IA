create or replace function public.list_accessible_projects()
returns table (
  id uuid,
  name text,
  description text,
  status text,
  start_date date,
  due_date date,
  closed_at timestamptz,
  owner_id uuid,
  created_at timestamptz,
  owner_name text
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    pr.id,
    pr.name,
    pr.description,
    pr.status,
    pr.start_date,
    pr.due_date,
    pr.closed_at,
    pr.owner_id,
    pr.created_at,
    trim(p.first_name || ' ' || p.last_name) as owner_name
  from public.projects pr
  join public.profiles p on p.id = pr.owner_id
  where app_private.can_access_project(pr.id)
  order by pr.created_at desc;
$$;
revoke all on function public.list_accessible_projects() from public, anon;
grant execute on function public.list_accessible_projects() to authenticated;
