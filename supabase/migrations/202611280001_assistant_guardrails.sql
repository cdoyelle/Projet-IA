create table if not exists public.assistant_settings (
  id integer primary key default 1 check (id = 1),
  enabled boolean not null default true,
  daily_limit_per_user integer not null default 20 check (daily_limit_per_user > 0),
  monthly_budget_eur numeric(10, 4) not null default 5.0000 check (monthly_budget_eur >= 0),
  alert_threshold_pct integer not null default 80 check (alert_threshold_pct between 1 and 100),
  estimated_cost_per_question_eur numeric(10, 6) not null default 0.000300
);

insert into public.assistant_settings (id) values (1) on conflict (id) do nothing;

create table if not exists public.assistant_logs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  question text not null,
  found boolean not null default false,
  status text not null check (status in ('ok', 'fallback', 'blocked_budget', 'blocked_quota', 'disabled')),
  estimated_cost_eur numeric(10, 6) not null default 0
);

create table if not exists public.assistant_daily_usage (
  user_id uuid not null references public.profiles(id) on delete cascade,
  usage_date date not null default current_date,
  question_count integer not null default 0,
  primary key (user_id, usage_date)
);

alter table public.assistant_settings enable row level security;
alter table public.assistant_logs enable row level security;
alter table public.assistant_daily_usage enable row level security;

revoke all on public.assistant_settings from anon, authenticated;
revoke all on public.assistant_logs from anon, authenticated;
revoke all on public.assistant_daily_usage from anon, authenticated;
