create table public.document_readiness (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  document_key text not null,
  status text not null default 'waiting' check (status in ('waiting','ready','not_needed')),
  updated_at timestamptz not null default now(),
  unique(user_id, document_key)
);

alter table public.document_readiness enable row level security;

create policy "users manage own document readiness"
  on public.document_readiness
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

comment on table public.document_readiness is 'Readiness metadata only. Document file contents are intentionally outside this MVP table.';
