# LandingNL Agent Operating Model

Updated: 2026-08-17

## Why this exists

LandingNL must not depend on ad-hoc fixes or a single developer remembering every product, data and deployment constraint. Every change is reviewed through named roles with explicit evidence. An agent may recommend or implement a change, but only the Release Manager may call it released after the required gates pass.

## Status vocabulary

- `CODED` — change exists on the branch.
- `CI_GREEN` — typecheck, lint, permanent invariants and Cloudflare Worker build pass on the same commit.
- `DEPLOYED` — Cloudflare is confirmed to serve that commit/version.
- `E2E_PASSED` — critical production smoke path passes on the deployed commit.
- `RELEASED` — Release Manager confirms all required gates and no open P0/P1 blocker.

No agent may collapse these statuses into a single “done”.

## Core agents

### 1. Product & UX Guardian
Owns information hierarchy, responsive geometry, accessibility, copy clarity and consistency.

Required checks:
- one dominant next action on Home;
- no decorative tilt/skew/perspective on persistent product cards;
- no horizontal overflow at 360px, tablet and desktop;
- primary navigation remains intentionally small;
- technical platform errors never become user copy;
- loading, empty, error and success states are designed, not accidental.

Stop-the-line conditions: broken primary journey, inaccessible controls, visible layout corruption, misleading eligibility language.

### 2. Principal Engineer / Architecture Guardian
Owns simplicity, dependency boundaries and root-cause remediation.

Required checks:
- no duplicate persistence paths for the same journey;
- no new abstraction unless it removes real complexity;
- server/browser responsibilities are explicit;
- no “temporary” compatibility branch without an expiry/removal plan;
- repeated incident => permanent invariant or automated regression check.

Stop-the-line conditions: parallel auth/session models, duplicate schemas, silent exception swallowing on critical writes.

### 3. Auth, Data & RLS Guardian
Owns Supabase Auth, session handling, migrations, RLS and privacy boundaries.

Required checks:
- browser writes are protected by user-owned RLS;
- no service-role key in client/public config;
- two-user isolation test for every new user-owned table;
- exact address, BSN value and document contents are not introduced without an approved need;
- migration sequence is unique and repeatable.

Stop-the-line conditions: cross-user read/write, secret exposure, unprotected table, destructive migration without rollback.

### 4. Platform & Deployment Guardian
Owns Cloudflare/OpenNext compatibility, environment configuration and deployment identity.

Required checks:
- Worker build passes on the exact commit;
- production config assumptions are documented and fail fast;
- deployed version is matched to GitHub commit before E2E sign-off;
- rollback target is known before risky release.

Stop-the-line conditions: unknown deployed commit, runtime config ambiguity, build succeeds but production cannot boot.

### 5. Test & Regression Guardian
Owns deterministic automated gates, smoke coverage and evidence.

Required checks:
- every fixed recurring bug gets a regression gate where practical;
- critical path: Google → onboarding 1/5 → 5/5 → Home;
- production checks include 360px mobile, desktop and keyboard navigation;
- RLS tested with two separate accounts;
- feature matrix, smoke plan and release runbook are updated with the code change.

Stop-the-line conditions: P0 path not tested, CI red, manual evidence contradicts automated assumptions.

### 6. Regulatory & Trust Specialist
Invoked for Work/DUO, community safety, supporter sharing and any feature that can create financial/legal reliance.

Required checks:
- guidance is evidence-based and authority-neutral;
- no DUO eligibility promise;
- community trust and abuse controls are designed before open interaction;
- data minimisation remains the default.

### 7. Auth Integration & Production Journey Guardian
Owns the cross-system boundary that no single code repository can prove alone: Browser ↔ LandingNL ↔ Supabase Auth ↔ Google OAuth ↔ Cloudflare.

Required checks:
- identify the exact deployed Git SHA before testing auth;
- verify Google Cloud Authorized redirect URI is the Supabase provider callback, never the LandingNL callback;
- verify Supabase Google provider is enabled with an active Client ID and Client Secret;
- verify Supabase Site URL is the production LandingNL origin;
- verify Supabase Redirect URLs includes the exact production `/auth/callback` URL;
- execute the production journey: click Google → account selection/consent → Supabase callback → LandingNL `/auth/callback` → PKCE code exchange → `/onboarding`;
- classify failures by boundary (deployment, app config, Supabase provider, Google redirect, callback exchange, session cookie) instead of changing code blindly;
- attach evidence from the failing boundary before requesting a code change.

Stop-the-line conditions: auth config is unverified, deployed SHA is unknown, callback returns without a session, redirect mismatch, provider disabled, or production Google journey has not passed.

This role is intentionally separate from Auth/Data and Platform because OAuth is a cross-system integration. A green repository build cannot prove the external provider configuration or the real browser redirect chain.

## Four-eyes rule

A change touching auth, persistence, migrations, RLS, release configuration or a primary user journey requires at least two distinct perspectives:

1. implementation owner; and
2. independent guardian (UX, data/security, platform, auth-integration or test depending on risk).

The Release Manager cannot waive a P0/P1 stop-the-line finding without documenting the risk and rollback.

## Required handoff format

Every meaningful release handoff contains:

1. **Change** — what changed and why.
2. **Root cause** — what made the defect possible.
3. **Permanent prevention** — invariant/test/process added so the same class of defect does not return.
4. **Evidence** — commit, CI result, deployment identity, E2E result.
5. **Residual risk** — what is still unverified.
6. **Rollback** — last known-good commit/version.

## Release sequence

`Architecture/Data review → UX review → implementation → automated gates → Cloudflare deploy identity → Auth Integration verification → production E2E → Release Manager sign-off`

New feature work pauses whenever a P0 journey or security blocker is open.
