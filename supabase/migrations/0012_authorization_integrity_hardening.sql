-- P0 authorization hardening.
-- Profiles are created only by the auth trigger; signed-in users may update an explicit safe column allow-list.

drop policy if exists "users insert own profile" on public.profiles;
drop policy if exists "users read own profile" on public.profiles;
drop policy if exists "users update own profile" on public.profiles;

create policy "users read own profile"
on public.profiles
for select
to authenticated
using ((select auth.uid()) = id);

create policy "users update own profile"
on public.profiles
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

revoke all on table public.profiles from anon;
revoke insert, update, delete, truncate, references, trigger on table public.profiles from authenticated;
grant select on table public.profiles to authenticated;
grant update (first_name, city, university, citizenship_country, arrival_date, birth_year, updated_at)
  on table public.profiles to authenticated;

-- The auth trigger is the only profile-creation path.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, first_name)
  values (
    new.id,
    nullif(coalesce(
      new.raw_user_meta_data ->> 'given_name',
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name'
    ), '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;

-- User-owned data is never directly available to the anonymous Postgres role.
revoke all on table public.consents from anon;
revoke all on table public.housing_profiles from anon;
revoke all on table public.journey_tasks from anon;
revoke all on table public.work_months from anon;
revoke all on table public.work_shifts from anon;
revoke all on table public.work_evidence from anon;
revoke all on table public.trusted_supporters from anon;
revoke all on table public.budget_items from anon;
revoke all on table public.document_readiness from anon;
revoke all on table public.student_cvs from anon;
revoke all on table public.employment_contracts from anon;
revoke all on table public.job_applications from anon;

-- Analytics ingestion is intentionally disabled until a consent-bound write path exists.
alter table public.analytics_events enable row level security;
revoke all on table public.analytics_events from anon, authenticated;

-- Regulatory data is readable by signed-in users but not directly writable from the browser.
revoke all on table public.rule_registry from anon;
revoke insert, update, delete, truncate, references, trigger on table public.rule_registry from authenticated;
grant select on table public.rule_registry to authenticated;

-- RLS/query indexes for user-owned collections.
create index if not exists work_shifts_user_id_idx on public.work_shifts(user_id);
create index if not exists employment_contracts_user_id_idx on public.employment_contracts(user_id);
create index if not exists job_applications_user_id_idx on public.job_applications(user_id);

comment on column public.profiles.membership is
  'Authorization-sensitive. Authenticated users cannot update this column directly; changes require a trusted administrative path.';
