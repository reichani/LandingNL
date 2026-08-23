-- Reviewed 2026 DUO worker-condition evidence indicators.
-- These are not a complete eligibility engine and must remain guidance-only.

insert into public.rule_registry (
  rule_key, version, value, unit, source_authority, source_url,
  effective_from, risk, status, requires_human_approval, last_verified_at
)
values
  (
    'duo.eu_worker.review_average_hours', 1, '{"value":24}'::jsonb,
    'average_paid_hours_per_month', 'DUO',
    'https://duo.nl/particulier/student-finance-citizens-eu-eer-switzerland-or-uk/eligibility.jsp',
    '2026-01-01', 'critical', 'active', true, '2026-08-19T00:00:00Z'
  ),
  (
    'duo.eu_worker.review_months', 1, '{"value":6}'::jsonb,
    'months_worked', 'DUO',
    'https://duo.nl/particulier/student-finance-citizens-eu-eer-switzerland-or-uk/eligibility.jsp',
    '2026-01-01', 'critical', 'active', true, '2026-08-19T00:00:00Z'
  ),
  (
    'duo.eu_worker.income_threshold_21_plus_2026', 1, '{"value":700.75}'::jsonb,
    'eur_per_month', 'DUO',
    'https://duo.nl/particulier/student-finance-citizens-eu-eer-switzerland-or-uk/eligibility.jsp',
    '2026-01-01', 'critical', 'active', true, '2026-08-19T00:00:00Z'
  ),
  (
    'duo.eu_worker.income_threshold_under_21_2026', 1, '{"value":173}'::jsonb,
    'eur_per_month', 'DUO',
    'https://duo.nl/particulier/student-finance-citizens-eu-eer-switzerland-or-uk/eligibility.jsp',
    '2026-01-01', 'critical', 'active', true, '2026-08-19T00:00:00Z'
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
