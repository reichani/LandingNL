# LandingNL Worker

This repository captures the Cloudflare dashboard implementation of LandingNL v1.0.4 as a reproducible local Worker project.

## Local setup

1. Install Node.js 22 or newer (required by the pinned Wrangler version).
2. Run `npm install`.
3. Create local D1 state and apply `migrations/0001_secure_foundation.sql` with `npm run db:migrate:local`.
4. Copy `.dev.vars.example` to `.dev.vars`; configure Google and the verified Brevo sender.
5. Add the `DB` binding to `wrangler.jsonc` using the D1 database ID returned by Cloudflare.
6. Run `npm test`.
7. Run `npm run dev` and open the local URL printed by Wrangler.

## Release flow

- Feature work is made on a branch and reviewed through a pull request.
- `npm run check` must pass before merge.
- Deploy to staging with `npm run deploy:staging`.
- Verify the checklist in `docs/RELEASE_CHECKLIST.md`.
- Deploy production only from the protected default branch.

The `--keep-vars` flag is intentional during the migration: it prevents existing dashboard-managed variables from being removed before they are inventoried.

## Current architecture

`src/index.js` owns the server trust boundary. `src/legacy-ui.js` is now a thin presentation router, while the four recovered HTML documents live independently under `src/ui/pages/`. Page output is locked to the PR #4 baseline with byte-for-byte SHA-256 regression tests. Google credentials, email magic links, opaque sessions, protected routes and cross-device state terminate at the Worker and D1. See `docs/ARCHITECTURE.md` for the security model and `docs/AUDIT.md` for the original findings.

## Cloudflare activation prerequisites

The code intentionally fails closed until these are configured:

- Separate `landingnl-db-staging` and `landingnl-db` D1 databases.
- A `DB` binding in each environment.
- `GOOGLE_CLIENT_ID` as a non-secret variable.
- `BREVO_API_KEY` as a Worker secret.
- `AUTH_FROM_EMAIL` and `APP_BASE_URL` as environment variables.

Do not connect the production Worker before the staging migration and release checklist pass.
