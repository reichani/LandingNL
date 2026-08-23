create extension if not exists pgcrypto;

create type public.membership_tier as enum ('free','plus','admin');
create type public.journey_status as enum ('locked','available','in_progress','completed','skipped');
create type public.rule_risk as enum ('low','medium','high','critical');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  membership public.membership_tier not null default 'free',
  first_name text,
  city text,
  university text,
  citizenship_country text,
  arrival_date date,
  birth_year int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  consent_key text not null,
  granted boolean not null,
  policy_version text not null,
  recorded_at timestamptz not null default now(),
  unique(user_id, consent_key, policy_version)
);

create table public.housing_profiles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  housing_status text not null default 'searching',
  housing_type text,
  monthly_rent_eur numeric(10,2),
  address_registrable boolean,
  contract_status text,
  move_in_date date,
  commute_minutes int,
  updated_at timestamptz not null default now()
);

create table public.journey_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  task_key text not null,
  status public.journey_status not null default 'locked',
  due_at timestamptz,
  completed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  unique(user_id, task_key)
);

create table public.work_months (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  month date not null,
  paid_hours numeric(6,2) not null default 0,
  payslip_received boolean not null default false,
  salary_received boolean not null default false,
  updated_at timestamptz not null default now(),
  unique(user_id, month)
);

create table public.rule_registry (
  id uuid primary key default gen_random_uuid(),
  rule_key text not null,
  version int not null,
  value jsonb not null,
  unit text,
  source_authority text not null,
  source_url text not null,
  effective_from date not null,
  effective_to date,
  risk public.rule_risk not null,
  status text not null default 'draft',
  requires_human_approval boolean not null default true,
  last_verified_at timestamptz,
  created_at timestamptz not null default now(),
  unique(rule_key, version)
);

create table public.analytics_events (
  id bigint generated always as identity primary key,
  anonymous_user_id uuid not null,
  event_name text not null,
  occurred_at timestamptz not null default now(),
  properties jsonb not null default '{}'::jsonb
);

alter table public.profiles enable row level security;
alter table public.consents enable row level security;
alter table public.housing_profiles enable row level security;
alter table public.journey_tasks enable row level security;
alter table public.work_months enable row level security;

create policy "users read own profile" on public.profiles for select using (auth.uid() = id);
create policy "users update own profile" on public.profiles for update using (auth.uid() = id);
create policy "users manage own consents" on public.consents for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users manage own housing" on public.housing_profiles for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users manage own tasks" on public.journey_tasks for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users manage own work months" on public.work_months for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

comment on table public.analytics_events is 'Pseudonymous product analytics only. Do not store email, name, exact address or document contents.';
