create table public.trusted_supporters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  supporter_email text not null,
  token_hash bytea not null unique,
  status text not null default 'active' check (status in ('active','revoked')),
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);

create unique index trusted_supporters_one_active_per_user
  on public.trusted_supporters(user_id)
  where status = 'active';

alter table public.trusted_supporters enable row level security;

create policy "users manage own trusted supporter"
  on public.trusted_supporters
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create or replace function public.create_trusted_supporter(p_email text, p_token text)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  new_id uuid;
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;

  update public.trusted_supporters
    set status = 'revoked', revoked_at = now()
    where user_id = auth.uid() and status = 'active';

  insert into public.trusted_supporters(user_id, supporter_email, token_hash)
  values (auth.uid(), lower(trim(p_email)), digest(p_token, 'sha256'))
  returning id into new_id;

  return new_id;
end;
$$;

create or replace function public.get_supporter_snapshot(p_token text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'student_first_name', p.first_name,
    'city', p.city,
    'housing_status', h.housing_status,
    'journey', coalesce((
      select jsonb_agg(jsonb_build_object('task_key', jt.task_key, 'status', jt.status) order by jt.task_key)
      from public.journey_tasks jt
      where jt.user_id = p.id
    ), '[]'::jsonb),
    'shared_at', ts.created_at
  )
  from public.trusted_supporters ts
  join public.profiles p on p.id = ts.user_id
  left join public.housing_profiles h on h.user_id = p.id
  where ts.status = 'active'
    and ts.token_hash = digest(p_token, 'sha256')
  limit 1;
$$;

revoke all on function public.get_supporter_snapshot(text) from public;
grant execute on function public.get_supporter_snapshot(text) to anon, authenticated;

comment on table public.trusted_supporters is 'One student-controlled, read-only trusted supporter. No parent account and no document contents or exact address are shared.';
