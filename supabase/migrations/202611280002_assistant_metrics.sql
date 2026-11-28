create table if not exists public.assistant_metrics (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_role text not null,
  model_used text,
  ttft_ms integer,
  total_ms integer not null default 0,
  input_tokens integer not null default 0,
  output_tokens integer not null default 0,
  estimated_cost_eur numeric(10, 6) not null default 0,
  passages_count integer not null default 0,
  is_unknown boolean not null default false,
  feedback text check (feedback in ('up', 'down'))
);

alter table public.assistant_metrics enable row level security;
revoke all on public.assistant_metrics from anon, authenticated;
grant select on public.assistant_metrics to authenticated;

drop policy if exists "assistant_metrics_admin_read" on public.assistant_metrics;
create policy "assistant_metrics_admin_read" on public.assistant_metrics
  for select to authenticated
  using (app_private.is_admin());

create or replace function public.submit_assistant_feedback(p_metric_id uuid, p_feedback text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not app_private.has_active_auth_session() then
    raise exception 'Session inactive' using errcode = '42501';
  end if;
  if p_feedback not in ('up', 'down') then
    raise exception 'Retour invalide' using errcode = '22023';
  end if;

  update public.assistant_metrics
  set feedback = p_feedback
  where id = p_metric_id;
end;
$$;
revoke all on function public.submit_assistant_feedback(uuid, text) from public, anon;
grant execute on function public.submit_assistant_feedback(uuid, text) to authenticated;
