# LandingNL Worker

This repository captures the Cloudflare dashboard implementation of LandingNL v1.0.4 as a reproducible local Worker project.

## Local setup

1. Install Node.js 20 or newer.
2. Run `npm install`.
3. Copy `.dev.vars.example` to `.dev.vars` and set the Google OAuth client ID.
4. Run `npm test`.
5. Run `npm run dev` and open the local URL printed by Wrangler.

## Release flow

- Feature work is made on a branch and reviewed through a pull request.
- `npm run check` must pass before merge.
- Deploy to staging with `npm run deploy:staging`.
- Verify the checklist in `docs/RELEASE_CHECKLIST.md`.
- Deploy production only from the protected default branch.

The `--keep-vars` flag is intentional during the migration: it prevents existing dashboard-managed variables from being removed before they are inventoried.

## Current architecture

`src/index.js` is an exact recovery copy of the dashboard code. It remains monolithic so the first Git commit is behavior-preserving. The next phase should extract HTML, CSS and browser JavaScript, then replace the demo authentication and browser-only persistence with verified server-side services.
