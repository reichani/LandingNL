# Secure foundation architecture

## Trust boundaries

1. The browser is untrusted. It may request operations but cannot declare identity, completion or eligibility.
2. The Worker verifies identity, authorizes protected routes and validates writes.
3. D1 is the system of record for identities, sessions, user journey state and versioned rules.
4. Brevo only transports one-time email links. It does not create sessions.

## Authentication

- Google credentials are verified against Google's rotating JWK set.
- Signature, issuer, audience, expiry, stable `sub` and verified email are checked.
- Email sign-in uses a 32-byte one-time token, stores only its SHA-256 hash, expires after 15 minutes and is consumed once.
- Session cookies contain a random opaque token. Only the SHA-256 hash is stored in D1.
- Cookies are `HttpOnly`, `Secure`, `SameSite=Strict` and scoped to `/`.
- State-changing requests require a same-origin `Origin` header.

## Data

- `users`: verified federated/email identities.
- `sessions`: revocable, expiring opaque sessions.
- `email_login_tokens`: single-use email ownership challenges.
- `user_state`: cross-device onboarding and journey state.
- `users.onboarding_completed_at`: server-authoritative resume routing after a validated onboarding save.
- `regulatory_rules`: versioned, source-linked, date-bounded published rules.

## Regulatory publishing gate

A rule is usable only when it has a source URL, review date, validity window, version and `published=1`. Draft values must never be returned by the public API. UI copy must avoid numerical or categorical guarantees when an active rule is absent.

## Required Cloudflare bindings

- `DB`: D1 database.
- `GOOGLE_CLIENT_ID`: public Google web client identifier.
- `BREVO_API_KEY`: secret.
- `AUTH_FROM_EMAIL`: verified Brevo sender.
- `APP_BASE_URL`: canonical environment URL.
