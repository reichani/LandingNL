create table public.employment_contracts (
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

create table public.work_evidence (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  work_month_id uuid references public.work_months(id) on delete cascade,
  evidence_type text not null check (evidence_type in ('contract','paid_hours','payslip','salary_bank','jaaropgaaf')),
  document_path text,
  received_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.work_months
  add column if not exists contracted_hours numeric(6,2),
  add column if not exists gross_pay_eur numeric(10,2),
  add column if not exists paid_hours_evidence_received boolean not null default false,
  add column if not exists salary_bank_evidence_received boolean not null default false,
  add column if not exists contract_active boolean not null default false;

alter table public.employment_contracts enable row level security;
alter table public.work_evidence enable row level security;

create policy "users manage own employment contracts"
on public.employment_contracts
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "users manage own work evidence"
on public.work_evidence
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

comment on table public.work_evidence is 'User-owned employment evidence metadata. Store file contents in a private storage bucket, never in analytics.';
