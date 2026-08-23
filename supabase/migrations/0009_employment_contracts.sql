create table if not exists public.employment_contracts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  employer_name text,
  role_title text,
  contract_type text,
  start_date date,
  end_date date,
  contracted_hours_weekly numeric(6,2),
  contracted_hours_monthly numeric(6,2),
  gross_hourly_wage_eur numeric(10,2),
  work_location text,
  pay_frequency text,
  employee_signed boolean not null default false,
  employer_signed boolean not null default false,
  document_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.employment_contracts enable row level security;

drop policy if exists "users manage own employment contracts" on public.employment_contracts;
create policy "users manage own employment contracts"
  on public.employment_contracts
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

alter table public.work_months
  add column if not exists contracted_hours numeric(6,2),
  add column if not exists gross_pay_eur numeric(10,2),
  add column if not exists paid_hours_evidence_received boolean not null default false,
  add column if not exists salary_bank_evidence_received boolean not null default false,
  add column if not exists contract_active boolean not null default false;

comment on table public.employment_contracts is 'User-owned employment contract readiness fields. Legal validity is outside LandingNL scope.';
