-- Cadence database schema (Postgres / Supabase).
-- Every row belongs to one user; primary keys are (user_id, id) with client-generated text ids.
-- Row-level security limits every table to the signed-in user's own rows.

create or replace function public.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end $$;

-- Plans: a date range plus settings (training sessions, decision, programs, stages, rules, deload).
create table public.plans (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  id text not null,
  name text not null default 'Untitled plan',
  start_date date not null,
  end_date date not null,
  settings jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, id),
  check (end_date >= start_date)
);

-- Pursuits: the lanes of a plan (ML, training, guitar...).
create table public.pursuits (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  id text not null,
  plan_id text not null,
  pursuit_key text not null,
  name text not null,
  color smallint not null default 0 check (color between 0 and 12),
  tracked boolean not null default true,
  streak boolean not null default false,
  deload boolean not null default false,
  sort integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, id),
  foreign key (user_id, plan_id) references public.plans(user_id, id) on delete cascade
);

-- Blocks: the weekly timetable, one row per block per weekday (0 = Sunday).
create table public.blocks (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  id text not null,
  plan_id text not null,
  weekday smallint not null check (weekday between 0 and 6),
  block_key text not null,
  start_time text not null,
  end_time text not null,
  pursuit_key text not null,
  title text not null default '',
  detail text not null default '',
  hours numeric,
  uses_session boolean not null default false,
  widget text not null default '',
  busy_mode text not null default 'keep' check (busy_mode in ('keep','min','drop')),
  busy_detail text not null default '',
  busy_hours numeric,
  sort integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, id),
  foreign key (user_id, plan_id) references public.plans(user_id, id) on delete cascade
);

-- Periods: dated ranges inside a plan (milestone phases, languages, breaks, rotating blocks).
create table public.periods (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  id text not null,
  plan_id text not null,
  kind text not null check (kind in ('phase','language','break','rotation')),
  period_key text not null,
  name text not null default '',
  start_date date,
  end_date date,
  note text not null default '',
  items jsonb not null default '[]'::jsonb,
  is_break boolean not null default false,
  sort integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, id),
  foreign key (user_id, plan_id) references public.plans(user_id, id) on delete cascade
);

create table public.resources (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  id text not null,
  plan_id text not null,
  name text not null default '',
  url text not null default '',
  note text not null default '',
  sort integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, id),
  foreign key (user_id, plan_id) references public.plans(user_id, id) on delete cascade
);

-- Block ticks: one row per finished block per day.
create table public.block_ticks (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  id text not null,
  day date not null,
  block_key text not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);
create index block_ticks_day on public.block_ticks (user_id, day);

-- Day logs: flashcards, warm-up, game results (W/L/D string) and sleep times.
create table public.day_logs (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  id text not null,
  day date not null,
  cards integer not null default 0,
  warmup boolean not null default false,
  games text not null default '' check (games ~ '^[WLD]*$'),
  slept_at text not null default '',
  woke_at text not null default '',
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);
create index day_logs_day on public.day_logs (user_id, day);

create table public.training_sessions (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  id text not null,
  day date not null,
  kind text not null,
  minutes integer not null check (minutes > 0),
  km numeric,
  rpe smallint check (rpe between 1 and 10),
  note text not null default '',
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);
create index training_sessions_day on public.training_sessions (user_id, day);

-- Weeks: per-week flags and notes, keyed by the Monday.
create table public.weeks (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  id text not null,
  week_start date not null,
  busy boolean not null default false,
  build text not null default '',
  loop_done boolean not null default false,
  meals_prepped integer not null default 0,
  recipe text not null default '',
  vod_focus text not null default '',
  review_done text not null default '',
  review_slipped text not null default '',
  review_change text not null default '',
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create table public.milestone_checks (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  id text not null,
  phase_key text not null,
  item_index integer not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create table public.books (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  id text not null,
  title text not null,
  status text not null default 'queued' check (status in ('queued','reading','done')),
  finished_on date,
  line text not null default '',
  sort integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create table public.prefs (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  id text not null,
  song text not null default '',
  theory_stage integer not null default 0,
  ear_stage integer not null default 0,
  theme text not null default 'system',
  track_from date, -- progress (XP, streaks, quests, stats) counts from this date; earlier days are a preview
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

do $$
declare t text;
begin
  foreach t in array array['plans','pursuits','blocks','periods','resources','block_ticks','day_logs','training_sessions','weeks','milestone_checks','books','prefs'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "own rows" on public.%I for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()))', t);
    execute format('revoke all on public.%I from anon', t);
    execute format('create trigger touch before update on public.%I for each row execute function public.touch_updated_at()', t);
    execute format('alter table public.%I replica identity full', t);
    execute format('alter publication supabase_realtime add table public.%I', t);
  end loop;
end $$;

-- Assistant: who may use it (it spends the owner's OpenAI credit), and a per-day request count.
-- Only the assistant Edge Function (service role) reads or writes these; no client policies.
create table public.assistant_access (
  email text primary key check (email = lower(email)),
  created_at timestamptz not null default now()
);
create table public.assistant_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  day date not null,
  requests integer not null default 0,
  input_tokens bigint not null default 0,
  output_tokens bigint not null default 0,
  primary key (user_id, day)
);
alter table public.assistant_access enable row level security;
alter table public.assistant_usage enable row level security;
revoke all on public.assistant_access from anon, authenticated;
revoke all on public.assistant_usage from anon, authenticated;
