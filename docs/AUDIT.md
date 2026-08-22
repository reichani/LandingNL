# LandingNL v1.0.4 audit

Source snapshot SHA-256: `0934d62a46e32a7b1be5a348f99b81659d6f23e7d1fa211ca08e58a074cf3ea7`

## Executive assessment

The file is a useful interactive prototype, but it is not yet a secure multi-user application. The production-critical gap is identity: both Google and email flows create a client-side marker without verifying the user. All state is device-local, and community content has a stored DOM injection path.

## Remediation status

The secure-foundation implementation resolves the eight findings in code: server-side Google verification, email ownership proof, opaque HttpOnly sessions, protected routes, D1-backed cross-device state, safe community rendering, a versioned regulatory rule registry, and authenticated root redirect. Activation remains gated on creating the staging/production D1 databases and configuring Google/Brevo environment values.

## Findings

### CRITICAL — Authentication can be forged

`src/index.js:92-111` ignores the Google credential callback payload and accepts any email containing `@`. JavaScript then creates `landingnl_session=active`; there is no signed server-side session and no ownership proof.

Required direction: verify Google ID tokens server-side, implement email magic-link/OTP verification, issue an `HttpOnly; Secure; SameSite=Lax/Strict` signed session cookie, and authorize every protected route on the server.

### HIGH — Protected routes are public

`src/index.js:121` and `src/index.js:259` serve onboarding and dashboard without checking an authenticated identity. Cookie detection uses substring matching at `src/index.js:16-17`, which is not authentication.

### HIGH — Stored XSS in community posts

User-controlled category, title and offer values are persisted and later interpolated into `innerHTML` at `src/index.js:804`. A crafted value can execute script in the page.

Required direction: construct DOM nodes and assign user values via `textContent`; validate length and allowed category server-side before persistence.

### HIGH — No shared or durable data model

Profile, progress and swap posts use `localStorage` (`src/index.js:538-550`). Data is limited to one browser, is editable by the user, cannot support trusted-supporter sharing, and disappears when storage is cleared.

Required direction: move identity, onboarding, milestones, supporter grants and moderated community posts into D1. Keep only non-sensitive UI preferences locally.

### MEDIUM — Reset clears unrelated site storage

`src/index.js:548` calls `localStorage.clear()`, deleting every local-storage key for the origin, not only LandingNL keys.

### MEDIUM — CORS and preflight behavior are over-broad

All HTML responses include `Access-Control-Allow-Origin: *` and OPTIONS receives the normal HTML header set (`src/index.js:6-13`). The application currently has no cross-origin API requiring this.

### MEDIUM — Missing browser security headers

There is no Content Security Policy, frame protection, referrer policy, permissions policy, or `X-Content-Type-Options`. Inline scripts/styles currently prevent a strict CSP without refactoring.

### MEDIUM — Root route with a session returns 404

The `/` handler only runs when `!hasSession` (`src/index.js:20`); an existing session visiting `/` falls through to 404 instead of redirecting to `/dashboard`.

### MEDIUM — Time-sensitive legal/financial claims are hard-coded

Savings, allowance, wage, insurance and work-hour statements are embedded in UI code. They need a dated, sourced content model, jurisdiction/status eligibility rules, and a visible `last reviewed` field.

### LOW — Monolithic delivery blocks safe maintenance

One 964-line template mixes routing, HTML, CSS, UI state, business rules and content. This makes small changes difficult to test and review.

Remediation status: the presentation router and four page documents are separated under `src/ui/pages/`. Exact HTML output is protected by SHA-256 parity tests. CSS and browser scripts deliberately remain embedded so this mechanical change does not alter runtime behavior.

## Target structure after the recovery commit

```text
src/
  index.ts                 Worker entry and routing
  auth/                    Google/email verification and sessions
  routes/                  page and API handlers
  repositories/            D1 queries only
  services/                milestones, eligibility, supporter sharing
  validation/              request schemas
public/
  pages/                   semantic HTML
  styles/                  tokens and page styles
  scripts/                 browser behavior without business authority
migrations/                reviewed D1 migrations
test/                      route, auth, authorization and XSS tests
docs/                      architecture, release and data decisions
```

## Safe migration sequence

1. Commit this exact dashboard snapshot and verify route parity locally.
2. Connect GitHub to a staging Worker; do not point the first build at production.
3. Extract static presentation without changing behavior.
4. Add D1 schema and repositories behind tests.
5. Implement verified authentication and server authorization.
6. Migrate onboarding and milestones to D1.
7. Add trusted-supporter read-only grants with instant revocation.
8. Add moderated, school/city-scoped community posts.
9. Complete mobile, accessibility, privacy and security release gates.
