create table public.budget_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  category text not null,
  label text not null,
  monthly_amount_eur numeric(10,2) not null check (monthly_amount_eur >= 0),
  source text not null default 'user' check (source in ('user','system')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, category)
);

alter table public.budget_items enable row level security;

create policy "users manage own budget items"
  on public.budget_items
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

comment on table public.budget_items is 'Simple user-owned monthly planning amounts. Do not store bank credentials, account numbers or transaction-level banking data.';
