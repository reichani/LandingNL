# LandingNL Sprint 0 Release Runbook

Updated: 2026-08-19

## Release rule

Do not merge `feat/sprint-0-foundation` into `main` until every required gate below is green. The working Cloudflare deployment is the smoke-test target; the repository remains the source of truth.

## 1. Automated quality gate

GitHub Actions workflow: `LandingNL CI`

Required:
- dependency install succeeds
- `bun run typecheck` succeeds
- `bun run lint` succeeds
- permanent UX/architecture gates succeed
- `bun run build:worker` succeeds

A failed gate blocks merge.

## 2. Public Supabase application config

LandingNL uses one canonical Supabase project for this MVP. The public project URL and publishable browser key live in `src/lib/supabase/public-config.ts`.

This is intentional: both values are public client credentials and authorization is enforced by Supabase Auth + RLS. Keeping them canonical in source removes Cloudflare build/runtime environment drift from the Google sign-in critical path.

Never place a privileged secret key in client/application source.

Cloudflare environment variables are therefore not required for the public Supabase URL or publishable key in this release candidate.

## 3. Supabase migration order

Apply in SQL Editor in this exact order if they are not already present:

1. `0001_foundation.sql`
2. `0002_auth_profile_bootstrap.sql`
3. `0003_work_evidence.sql`
4. `0004_rule_registry_security_and_seed.sql`
5. `0005_trusted_supporter.sql`
6. `0006_budget_items.sql`
7. `0007_document_readiness.sql`
8. `0008_student_cv.sql`
9. `0009_employment_contracts.sql`
10. `0010_job_applications.sql`
11. `0011_security_hardening.sql`
12. `0012_authorization_integrity_hardening.sql`

Weekly Focus uses existing profile, journey and housing data and requires no new migration.

Do not reintroduce removed/conflicting duplicate migrations.

### Schema verification

Run after migrations:

```sql
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in (
    'profiles',
    'housing_profiles',
    'journey_tasks',
    'work_shifts',
    'work_evidence',
    'rule_registry',
    'trusted_supporters',
    'budget_items',
    'document_readiness',
    'student_cvs',
    'employment_contracts',
    'job_applications'
  )
order by table_name;
```

Expected: every listed table is returned.

### RLS verification

```sql
select relname, relrowsecurity
from pg_class
join pg_namespace on pg_namespace.oid = pg_class.relnamespace
where pg_namespace.nspname = 'public'
  and relname in (
    'profiles', 'housing_profiles', 'journey_tasks', 'work_shifts',
    'work_evidence', 'trusted_supporters', 'budget_items',
    'document_readiness', 'student_cvs', 'employment_contracts',
    'job_applications'
  )
order by relname;
```

Expected: `relrowsecurity = true` for every user-owned table. Profile creation belongs to the auth trigger; onboarding updates only the authenticated user's safe profile fields and housing row.

## 4. Supabase Auth / Google

Required production settings:

- Google provider enabled with the Google OAuth Client ID and Client Secret.
- Supabase Site URL points to the active LandingNL production URL.
- Redirect allow-list contains `<active-origin>/auth/callback`.
- Google Cloud OAuth authorized redirect URI remains the Supabase callback URL (`https://iwzsewwnntfylryqaihu.supabase.co/auth/v1/callback`).

## 5. Security smoke gates

- OAuth `next` parameter cannot redirect to another origin.
- Guest pages contain no student PII.
- User A cannot read or mutate User B rows.
- Browser-side onboarding can update only the authenticated user's allow-listed profile fields and own housing row through RLS.
- A normal authenticated student cannot change authorization-sensitive membership/admin state.
- Supporter link is read-only and contains no exact address, document content, BSN value, salary bank details, or private CV content.
- Revoking a supporter invalidates the bearer link immediately and remains available after refresh.
- No privileged secret key is exposed client-side.

## 6. Product smoke gates

Execute `docs/SMOKE_TESTS.md` against the active deployment. Minimum critical path:

1. Public Home renders at 360px and desktop widths.
2. Google sign-in leaves LandingNL, reaches Google through Supabase and returns through `/auth/callback`.
3. Onboarding saves through the browser client, shows `SETUP COMPLETE`, then opens Home without a Worker exception.
4. Home keeps one dominant NOW action and the CTA opens the correct destination.
5. Weekly Focus shows at most two contextual secondary checks, never duplicates NOW, and reacts to arrival/journey state.
6. Housing change updates Home/Plan/Money.
7. Municipality → BSN → DigiD milestones advance sequentially.
8. Money values persist after refresh.
9. Wallet readiness persists after refresh.
10. CV save completes the CV milestone only for a minimally valid CV.
11. Job application persists and Work count changes.
12. Contract/evidence/shift flows update Work status and reverse derived readiness when source data becomes incomplete.
13. Trusted supporter share + refresh + revoke passes.
14. Account sign-out returns to a safe guest state.

## 7. Merge decision

Only mark PR #1 ready for review when:

- automated CI is green
- Cloudflare build/deploy is green on the exact release candidate SHA
- Supabase migrations are applied
- Google OAuth production smoke test passes
- onboarding browser-save production smoke test passes
- Weekly Focus passes the two-card/no-duplicate UX gate
- critical manual smoke tests pass
- no P0/P1 security or data-isolation issue remains

Until then PR #1 stays Draft.
