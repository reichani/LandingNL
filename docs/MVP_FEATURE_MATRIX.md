# LandingNL MVP Feature Matrix

Updated: 2026-08-17

## Product principle

LandingNL is a student landing operating system for the Netherlands: one move, one source of truth, one primary action. Urgent government-step guidance must remain useful before sign-in. Data ownership stays with the student.

## Core features

| Feature | Route | Current implementation | Data | Key test |
|---|---|---|---|---|
| Public homepage | `/` | Full responsive marketing homepage, feature navigation, product preview, CTA, SEO metadata | Public | Guest sees homepage, no demo student name/rent |
| Google sign-in | `/login` → `/auth/google` → `/auth/callback` | Server-side OAuth start to avoid browser env dependency | Supabase Auth | Google consent returns to onboarding/home |
| 60-second onboarding | `/onboarding` | City, university, citizenship, arrival date, housing status | `profiles`, `housing_profiles`, `consents` | Save and reload profile |
| Home dashboard | `/` after auth | Personal name/city/housing plus primary action and feature cards | Supabase + Journey Engine | Signed-in user sees own profile, not demo data |
| Plan / Journey Engine | `/plan` | Dependency-ordered steps with persisted completion for municipality, BSN, DigiD | `journey_tasks`, `housing_profiles` | Mark step done and next step unlocks |
| Money | `/money` | User-owned planning amounts plus housing rent | `budget_items`, `housing_profiles` | Save amount, refresh, total persists |
| Wallet | `/wallet` | Task-linked document readiness, no file contents required for MVP | `document_readiness`, `journey_tasks` | Mark ready, refresh, progress persists |
| Work hub | `/work` | CV, contract, employer pack, paid-hours and evidence summary; rule-registry threshold | work tables + `rule_registry` | Logged shift changes current month total |
| Student CV | `/work/cv` | User profile-prefilled, editable, persisted; no invented experience | `student_cvs`, `profiles`, `journey_tasks` | Save, refresh, fields persist and CV milestone completes |
| Contract readiness | `/work/contract` | Persistent key contract fields, readiness score, signature state | `employment_contracts`, `work_evidence`, `journey_tasks` | Save signed contract and evidence readiness updates |
| Employer pack | `/work/employer-pack` | Shareable employer/payroll checklist and student onboarding list | Public guidance | Copy/share actions work, no eligibility promise |
| Paid-hours tracker | `/work/log-shift` | Server-side shift logging; no browser Supabase dependency | `work_shifts` | Log shift and Work monthly total increases |
| DUO regulatory guidance | `/work`, `/admin/rules` | Versioned rule registry with approval boundary; guidance only | `rule_registry` | Active approved rule is used, no hard-coded threshold in UI |
| Trusted supporter | `/supporter`, `/share/[token]` | One read-only supporter, bearer link, student revocation; no parent account | `trusted_supporters` | Create link, snapshot is limited, revoke invalidates link |
| Analytics privacy boundary | internal | Pseudonymous events only; no email/name/address/document contents | `analytics_events` | Schema/comment/payload review |

## Required database migrations added in this implementation pass

- `0005_trusted_supporter.sql`
- `0006_budget_items.sql`
- `0007_document_readiness.sql`
- `0008_student_cv.sql`

These must be applied to Supabase before their respective persistent features can pass end-to-end tests.

## Release gates

1. Cloudflare build succeeds on `feat/sprint-0-foundation`.
2. Runtime has valid `NEXT_PUBLIC_SUPABASE_URL` and publishable key.
3. Google provider has Client ID and Client Secret in Supabase.
4. Supabase Site URL and redirect allow-list include the active Cloudflare URL.
5. New SQL migrations are applied successfully.
6. Guest routes never expose another user's data.
7. RLS tests confirm each authenticated user can only manage their own records.
8. Supporter snapshot exposes only limited progress, never exact address or document contents.
9. Mobile smoke test: 360px width, Samsung S24-class viewport, and desktop.
10. No UI text promises DUO eligibility; rule guidance remains versioned and auditable.
