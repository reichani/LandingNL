# ADR 0005: Durable account resume routing

## Status

Accepted for the authentication and D1 foundation.

## Context

LandingNL must reopen a returning student's existing account and durable journey state. The recovered flow sent every successful Google or email login to onboarding, even when the same D1 user had already completed it. Browser-local state cannot be the authority for this decision.

## Decision

- Keep the existing provider subject as the stable identity lookup for this change.
- Record `onboarding_completed_at` on the D1 user only after the Worker validates and persists the complete onboarding payload.
- Resolve the next protected route on the server: incomplete users go to `/onboarding`; completed users go to `/dashboard`.
- Backfill the completion timestamp only for existing users whose D1 state contains every required onboarding field.
- Keep account linking across different identity providers out of this migration. Linking requires separate proof and acceptance tests and must never occur from an unverified email match.

## Consequences

- Returning users using the same verified sign-in method resume the same D1-backed journey.
- Existing completed staging users are not forced through onboarding again.
- The migration is forward-only because SQLite cannot safely remove the added column in place; rollback uses the previous Worker version, which ignores the column.
- Cross-provider account linking remains a separate authentication change.
