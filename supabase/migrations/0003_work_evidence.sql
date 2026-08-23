create table public.work_shifts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  shift_date date not null,
  paid_hours numeric(5,2) not null check (paid_hours > 0 and paid_hours <= 24),
  employer_name text,
  notes text,
  created_at timestamptz not null default now()
);

create table public.work_evidence (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  month date not null,
  evidence_type text not null check (evidence_type in ('contract','paid_hours','payslip','salary_bank')),
  status text not null default 'waiting' check (status in ('waiting','ready','verified')),
  reference text,
  updated_at timestamptz not null default now(),
  unique(user_id, month, evidence_type)
);

alter table public.work_shifts enable row level security;
alter table public.work_evidence enable row level security;

create policy "users manage own shifts" on public.work_shifts
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "users manage own work evidence" on public.work_evidence
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
