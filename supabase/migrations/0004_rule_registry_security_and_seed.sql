-- Secure Rule Registry and seed the current reviewed EU-worker monthly-hours rule.

alter table public.rule_registry enable row level security;

create policy "authenticated users read active rules"
on public.rule_registry
for select
to authenticated
using (status = 'active');

create policy "admins manage rules"
on public.rule_registry
for all
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid() and p.membership = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid() and p.membership = 'admin'
  )
);

insert into public.rule_registry (
  rule_key,
  version,
  value,
  unit,
  source_authority,
  source_url,
  effective_from,
  risk,
  status,
  requires_human_approval,
  last_verified_at
)
values (
  'duo.eu_worker.monthly_hours',
  1,
  '{"value":32}'::jsonb,
  'paid_hours_per_month',
  'DUO',
  'https://duo.nl/particulier/student-finance-citizens-eu-eer-switzerland-or-uk/eligibility.jsp',
  '2026-01-01',
  'critical',
  'active',
  true,
  '2026-08-16T00:00:00Z'
)
on conflict (rule_key, version) do update
set value = excluded.value,
    unit = excluded.unit,
    source_authority = excluded.source_authority,
    source_url = excluded.source_url,
    effective_from = excluded.effective_from,
    risk = excluded.risk,
    status = excluded.status,
    requires_human_approval = excluded.requires_human_approval,
    last_verified_at = excluded.last_verified_at;
