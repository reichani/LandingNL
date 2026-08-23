create table public.job_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  employer_name text not null,
  role_title text not null,
  status text not null default 'planned' check (status in ('planned','applied','interview','offer','rejected','withdrawn')),
  applied_at date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.job_applications enable row level security;

create policy "users manage own job applications"
  on public.job_applications
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

comment on table public.job_applications is 'Student-owned job application tracker. Keep sensitive recruitment documents outside analytics.';
