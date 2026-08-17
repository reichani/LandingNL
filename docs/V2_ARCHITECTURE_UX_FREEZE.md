# LandingNL v2 — Architecture + UX Freeze

Frozen: 2026-08-17
Status: implementation baseline

## Why v2

There are no production users or user data to migrate. This is the lowest-risk point to remove avoidable runtime complexity before launch.

## Architecture freeze

Canonical production stack:

`GitHub → Cloudflare Pages → React/Vite SPA → Pages Functions → D1`

Authentication:

`Browser → /api/auth/google → Google → /api/auth/callback → signed HttpOnly session → /app`

Rules:
- No Next.js runtime.
- No OpenNext.
- No Supabase runtime.
- No Server Actions.
- D1 is never exposed directly to the browser.
- Every user-owned API route authenticates first and scopes every query by the signed session user id.
- Secrets live only in Cloudflare Pages environment bindings.
- Production domain target is `landing.nl`; `www.landing.nl` redirects to the apex.
- `workers.dev` becomes a temporary compatibility redirect only after v2 release.

## UX freeze

### Website
`landing.nl` is a short marketing/SEO surface. It explains the promise and has one dominant CTA: **Build my plan**.

### App
`landing.nl/app` is the product.

Primary navigation is exactly:

**Home · Plan · Money · Work · Circle**

Account/Profile is not a primary tab; it lives behind the profile control.

### Home
Only two hierarchy levels:
1. **NOW** — one dominant next action.
2. **THIS WEEK** — maximum two secondary checks.

Move status belongs in Plan. Rent belongs in Money. Work status belongs in Work. Sharing/privacy belongs in Profile.

### Onboarding
Exactly three screens:
1. **Your move** — city + arrival date.
2. **Your study** — university + student type + controlled citizenship group.
3. **Housing** — secured or still searching.

No free-text citizenship status. No passport number. No BSN number. No exact street address.

### Plan
Dependency order remains:
Housing → municipality → BSN milestone → DigiD → CV → contract/work.

Wallet is not a destination. Document readiness is contextual inside the task that needs it.

### Work
Progressive disclosure:
- **Get a job** — CV + applications.
- **Got an offer?** — contract readiness.
- **Already working?** — paid hours + monthly evidence.

### Circle v0
A verified-student community layer comes later. v0 starts as a structured mutual-aid board:
- Ask
- Offer
- Pass it on

Exchange types: Free · Favour · Borrow · Swap · €.

No open DM, no exact address, no housing deposits, no loans, no uncontrolled job marketplace.

## Release freeze

No new feature family starts until v2 passes:
1. build + typecheck + invariant CI;
2. Pages deployment identity;
3. direct Google OAuth production E2E;
4. onboarding → Home E2E;
5. D1 two-user isolation checks;
6. 360px + tablet + desktop visual smoke.

Status vocabulary stays:
`CODED → CI_GREEN → DEPLOYED → E2E_PASSED → RELEASED`.
