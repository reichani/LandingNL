create table public.student_cvs (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  name text,
  city text,
  education text,
  languages text,
  strengths text,
  availability text,
  experience text,
  updated_at timestamptz not null default now()
);

alter table public.student_cvs enable row level security;

create policy "users manage own student cv"
  on public.student_cvs
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

comment on table public.student_cvs is 'Student-authored CV draft fields. No automated claims about experience or qualifications.';
