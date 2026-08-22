# ADR 0002: Behavior-preserving UI extraction

## Status

Accepted for PR #4.

## Context

The recovered UI lived in one `src/legacy-ui.js` file that combined route selection with four complete HTML documents. Editing one page required reviewing a file exceeding one thousand lines and made accidental cross-page changes difficult to detect.

PR #4 already contains authentication, D1, security and content changes. This extraction must not add another behavioral change or widen those risk domains.

## Decision

- Keep `src/legacy-ui.js` as the presentation router and response-header owner.
- Move welcome, login, onboarding and dashboard documents to separate modules under `src/ui/pages/`.
- Preserve the generated HTML byte-for-byte, including inline CSS and browser JavaScript.
- Lock each page to its pre-extraction SHA-256 value in route parity tests.
- Preserve existing paths, statuses, response headers, cookie checks and 404 behavior.

## Consequences

- Page ownership and review boundaries become clearer.
- Accidental presentation drift fails the parity test.
- Inline CSS and browser JavaScript remain technical debt by design.
- Auth, D1, XSS, regulatory content, UX and deployment behavior are not changed by this decision.

## Rollback

Revert the extraction commit to restore the monolithic `src/legacy-ui.js`; no database, binding or production migration is involved.
