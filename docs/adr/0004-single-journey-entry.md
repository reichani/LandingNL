# ADR 0004: Single journey entry

## Status

Accepted for the button-recovery change on PR #4.

## Context

The welcome page presented two competing login actions: a header button and the central journey call to action. Both depended on a `DOMContentLoaded` JavaScript handler to navigate to `/login`. This contradicted the one-focus/one-primary-action product rule and made basic navigation unnecessarily dependent on client-side JavaScript.

## Decision

- Remove the header login action.
- Keep one central `Yolculuğu Başlat` action.
- Implement that action as a native link to `/login`, so it works without JavaScript.
- Keep Google and email sign-in on the subsequent `/login` step; do not present Google as the product's primary journey entry.
- Preserve `/`, `/login`, `/onboarding` and `/dashboard` routes.

## Consequences

- The welcome screen has one clear next action.
- Entry navigation is keyboard accessible and resilient to script failure.
- Authentication security and provider behavior are unchanged.
- Other interactive dashboard/onboarding controls still require separate browser-level acceptance testing and infrastructure configuration.

## Rollback

Revert the entry commit to restore the header action and JavaScript navigation handlers. No database, binding or migration is involved.
