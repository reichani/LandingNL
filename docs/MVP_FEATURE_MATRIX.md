# LandingNL MVP Feature Matrix

Updated: 2026-08-17

## Product principle

LandingNL is a student landing operating system for the Netherlands: one move, one source of truth, one primary action. Urgent government-step guidance must remain useful before sign-in. Data ownership stays with the student.

## Core features

| Feature | Route | Current implementation | Data | Key test |
|---|---|---|---|---|
| Public homepage | `/` | Full responsive marketing homepage, feature navigation, product preview, CTA, SEO metadata | Public | Guest sees homepage, no demo student name/rent |
| Google sign-in | `/login` → `/auth/google` → `/auth/callback` | Supabase Google OAuth with public project config pinned at build time; return path restricted to same-origin internal paths | Supabase Auth | Google consent returns to onboarding/home; protocol-relative `next` cannot escape origin |
| 60-second onboarding | `/onboarding` | City, university, citizenship, arrival date, housing status; no analytics auto-opt-in; save resolves before browser navigation | `profiles`, `housing_profiles` | Save reaches success state and Home without a server exception |
| Home dashboard | `/` after auth | Personal name/city/housing plus persisted journey-driven primary action and contextual weekly focus | Supabase + Journey Engine | Signed-in user sees own profile, correct next milestone and no duplicate weekly CTA |
| Weekly Focus / This Week | `/` after auth | Maximum two secondary checks derived from arrival timing, journey stage and known housing cost; primary action is never duplicated | Existing profile/journey/housing data | Change arrival/journey state and confirm weekly cards adapt while staying at two maximum |
| Housing readiness | `/housing` | Registrability, housing status, rent, contract state, move-in date and commute; no exact address required | `housing_profiles` | Save housing readiness and see Plan/Home/Money react |
| Plan / Journey Engine | `/plan` | Dependency-ordered steps with persisted completion for municipality, BSN, DigiD and work milestones | `journey_tasks`, `housing_profiles` | Mark step done and next step unlocks |
| Money | `/money` | User-owned planning amounts plus housing rent | `budget_items`, `housing_profiles` | Save amount, refresh, total persists |
| Wallet | `/wallet` | Task-linked document readiness, no file contents required for MVP | `document_readiness`, `journey_tasks` | Mark ready, refresh, progress persists |
| Work hub | `/work` | CV, applications, contract, employer pack, paid-hours and evidence summary; rule-registry threshold | work tables + `rule_registry` | Logged shift changes current month total |
| Job applications | `/work/applications` | Lightweight employer/role/stage tracker | `job_applications` | Add role, refresh, count persists in Work hub |
| Student CV | `/work/cv` | User profile-prefilled, editable, persisted; no invented experience | `student_cvs`, `profiles`, `journey_tasks` | Save, refresh, fields persist and CV milestone completes |
| Contract readiness | `/work/contract` | Persistent key contract fields, readiness score, signature state | `employment_contracts`, `work_evidence`, `journey_tasks` | Save signed contract and evidence readiness updates |
| Employer pack | `/work/employer-pack` | Shareable nationality-neutral employer/payroll checklist | Public guidance | Copy/share actions work, no eligibility promise |
| Paid-hours tracker | `/work/log-shift` | Server-side shift logging; no browser Supabase dependency | `work_shifts` | Log shift and Work monthly total increases |
| Monthly work evidence | `/work/evidence` | Contract, logged hours, payslip and salary-evidence readiness | `work_evidence`, `work_shifts` | Mark evidence ready and derive paid-hours readiness |
| DUO regulatory guidance | `/work`, `/admin/rules` | Versioned rule registry with approval boundary; guidance only | `rule_registry` | Active approved rule is used, no hard-coded threshold in UI |
| Trusted supporter | `/supporter`, `/share/[token]` | One read-only supporter, bearer link, student revocation; no parent account | `trusted_supporters` | Create link, snapshot is limited, revoke invalidates link |
| Account controls | `/account` | Student profile summary, setup links, supporter controls and sign-out | Auth + profile | Signed-in user can sign out and manage own settings |
| Analytics privacy boundary | internal | Pseudonymous events only; no email/name/address/document contents; onboarding does not auto-grant consent | `analytics_events`, `consents` | Schema/payload review |
| Automated quality gate | GitHub Actions | Bun install + TypeScript + ESLint + OpenNext Cloudflare build | Repository | PR cannot be considered release-ready until workflow is green |

## Required database migrations added in this implementation pass

- `0005_trusted_supporter.sql`
- `0006_budget_items.sql`
- `0007_document_readiness.sql`
- `0008_student_cv.sql`
- `0009_employment_contracts.sql`
- `0010_job_applications.sql`

Weekly Focus adds no migration; it derives a small view from data already owned by the student.

These migrations must be applied to Supabase before their respective persistent features can pass end-to-end tests.

## Migration hygiene fixed

- Removed duplicate `0002_profile_bootstrap.sql`; `0002_auth_profile_bootstrap.sql` is the canonical auth-profile bootstrap.
- Removed the conflicting old `0003_employment_evidence.sql`; `0003_work_evidence.sql` is the canonical `work_shifts` / `work_evidence` schema.
- Employment contract fields now live in the separate `0009_employment_contracts.sql` migration.
- Contract evidence writes use the canonical `work_evidence(user_id, month, evidence_type, status, reference)` shape.

## Release gates

1. GitHub Actions `LandingNL CI` succeeds: install, typecheck, lint, OpenNext Worker build.
2. Cloudflare build succeeds on `feat/sprint-0-foundation` and auto-deploys the same head.
3. Build environment contains valid `NEXT_PUBLIC_SUPABASE_URL` and publishable key values; production build fails if either is missing.
4. Google provider has Client ID and Client Secret in Supabase.
5. Supabase Site URL and redirect allow-list include the active Cloudflare URL.
6. New SQL migrations are applied successfully.
7. Guest routes never expose another user's data.
8. RLS tests confirm each authenticated user can only manage their own records.
9. Supporter snapshot exposes only limited progress, never exact address or document contents.
10. OAuth return paths are same-origin only; `//external-host` style redirects are rejected.
11. Mobile smoke test: 360px width, Samsung S24-class viewport, and desktop.
12. Home keeps one primary action; Weekly Focus shows no more than two secondary checks and never duplicates the primary destination.
13. No UI text promises DUO eligibility; rule guidance remains versioned and auditable.

See `docs/RELEASE_RUNBOOK.md` for the exact release sequence and verification queries.
