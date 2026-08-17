# LandingNL v2 Agent Operating Model

Frozen: 2026-08-17

## Objective

v2 is intentionally simpler. Agent ownership follows the actual Cloudflare-native runtime rather than the retired Next/OpenNext/Supabase model.

## 1. Product & UX Guardian
Owns the visible student journey.

Permanent rules:
- Home = one **NOW** action + maximum two **THIS WEEK** checks.
- Primary navigation = Home · Plan · Money · Work · Circle.
- Onboarding = three screens.
- Account stays behind profile, not in primary navigation.
- Wallet is contextual, not a destination.
- Persistent surfaces do not tilt/skew or move on hover.
- 360px horizontal overflow is a stop-the-line defect.

## 2. Architecture Simplicity Guardian
Owns dependency count and runtime boundaries.

Permanent rules:
- React/Vite static app only.
- Pages Functions only for server needs.
- No Next.js, OpenNext, Supabase or duplicate auth/persistence path in the active runtime.
- Repeated incident classes become CI invariants.

## 3. Auth Integration & Session Guardian
Owns the complete Google journey:

`Browser → Pages Function → Google → callback → signed HttpOnly session → /app`

Permanent rules:
- state is signed and short-lived;
- callback URI is same-origin/exact production config;
- identity is resolved from Google's UserInfo endpoint after server-side code exchange;
- client secret never enters the browser bundle;
- session cookie is HttpOnly + Secure + SameSite=Lax;
- production OAuth is not called passed until it reaches authenticated onboarding.

## 4. Data Isolation & D1 Guardian
Owns schema, user ownership and privacy.

Permanent rules:
- browser never receives D1 credentials;
- every private API authenticates before data access;
- every user-owned query scopes by `session.uid`;
- community posts expose only intentionally shared fields;
- no BSN value, passport number or exact street address in v2 schema;
- two-user isolation smoke is required before release.

## 5. Cloudflare Pages Platform Guardian
Owns build, bindings, domain and deployment identity.

Permanent rules:
- Pages build = `bun run build`, output = `dist`;
- Functions live in `functions/`;
- `DB` is a D1 binding;
- secrets are Cloudflare environment values only;
- `/version.json` must equal the release candidate SHA before E2E sign-off;
- `landing.nl` is the production origin; legacy workers.dev is rollback/redirect only after cutover.

## 6. Browser Regression Guardian
Owns deterministic journey evidence.

Permanent CI checks:
- v2 typecheck;
- architecture/privacy/UX invariants;
- Pages Functions syntax;
- Vite production build;
- exact build identity artifact;
- Chromium smoke at 360px;
- Home hierarchy;
- five-tab navigation;
- three-screen onboarding → Home.

Production-only checks still required:
- real Google OAuth;
- real D1 writes;
- two-user isolation;
- tablet/desktop visual smoke.

## 7. Trust & Community Safety Guardian
Owns Circle and any sharing feature.

Permanent rules:
- structured Ask / Offer / Pass it on beats an open social feed;
- no open DM in v0;
- public posts reject phone/email contact details;
- exact address is not a post field;
- housing deposits, loans and uncontrolled job marketplace are outside Circle;
- university-email verification is the preferred future student trust layer; student number is not required.

## 8. Release Manager
Only this role can move status through:

`CODED → CI_GREEN → DEPLOYED → E2E_PASSED → RELEASED`

A green build is not a release. A deployed URL is not E2E evidence.

## Four-eyes rule

Auth, session, D1 schema/data access, production bindings, domain routing and Circle trust changes require implementation review plus an independent guardian review.

## Stop-the-line rule

No new feature family begins while any of these is broken:
- Google sign-in;
- onboarding completion;
- Home primary action;
- user isolation;
- production deployment identity;
- responsive primary navigation.
