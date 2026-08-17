# LandingNL v2 Release Runbook

## 1. Cloudflare Pages project
- Framework preset: React (Vite)
- Production branch: choose the v2 release branch first; switch to `main` after merge.
- Build command: `bun run build` or `npm run build`
- Build output directory: `dist`
- Functions directory: repository `functions/` (Cloudflare Pages convention)

The build writes the exact `CF_PAGES_COMMIT_SHA` into `/version.json`. This static file is the canonical deployment identity; do not infer the served commit from an old dashboard row.

## 2. D1
Create one D1 database for LandingNL v2 and bind it to Pages as `DB` for Preview and Production.
Apply `d1/migrations/0001_v2_core.sql` before OAuth E2E.

There is no production data migration because the pre-v2 data store has no production users/data.

## 3. Secrets / environment
Required production values:
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `SESSION_SECRET` (long random value; rotate to invalidate sessions)

Optional:
- `OAUTH_REDIRECT_URI=https://landing.nl/api/auth/callback`

If omitted, the callback uses the request origin plus `/api/auth/callback`.

## 4. Google OAuth
Create/use a Web OAuth client and allow exactly:
- `https://landing.nl/api/auth/callback`

During pre-domain testing, add the exact temporary Pages production callback separately. Do not use broad wildcard callback patterns.

## 5. Domain
Attach `landing.nl` to the Pages project.
Redirect `www.landing.nl` → `https://landing.nl`.
Only after v2 production E2E passes, redirect the legacy workers.dev host to the apex domain.

## 6. Production E2E
First open `/version.json` and confirm `commit` equals the GitHub release candidate SHA. Then use a fresh browser:
1. Open `landing.nl`.
2. Build my plan / Continue with Google.
3. Google account selection returns to `/api/auth/callback`.
4. New account lands on `/app/onboarding`.
5. Complete the three onboarding screens.
6. Home shows one NOW action and ≤2 THIS WEEK cards.
7. Plan milestone writes persist.
8. Money writes persist.
9. Application write persists.
10. Circle post write persists and never exposes email or exact address.
11. Sign out clears the session.

## 7. Isolation
Use two Google users. For every user-owned API, confirm user B cannot retrieve or mutate user A records. Browser never receives a D1 credential.

## 8. Cutover
Only after all gates are green:
- merge v2 release branch;
- make `main` the Pages production branch;
- keep the prior workers.dev deployment as rollback for a short observation period;
- then retire OpenNext/Worker configuration and Supabase project resources if no longer needed.
