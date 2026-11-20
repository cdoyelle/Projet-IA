create or replace function public.get_project_progress(p_project_id uuid)
returns table (
  global_progress integer,
  personal_progress integer
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    round(
      avg(
        case t.status
          when 'created' then 0.0
          when 'in_progress' then 0.5
          when 'done' then 1.0
        end
      ) * 100
    )::integer as global_progress,
    round(
      avg(
        case
          when t.assignee_id = (select auth.uid()) then
            case t.status
              when 'created' then 0.0
              when 'in_progress' then 0.5
              when 'done' then 1.0
            end
        end
      ) * 100
    )::integer as personal_progress
  from public.tasks t
  where t.project_id = p_project_id
    and t.status <> 'cancelled'
    and app_private.can_access_project(p_project_id);
$$;
revoke all on function public.get_project_progress(uuid) from public, anon;
grant execute on function public.get_project_progress(uuid) to authenticated;
