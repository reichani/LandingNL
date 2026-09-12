# Deploying LandingNL

There is exactly one supported path to production: merge to `main` and let the
`Deploy production` GitHub Actions workflow run. It runs the tests, applies D1
migrations, deploys with `--env production` and then smoke-tests the live site.

## Why the top-level wrangler config has no database

`wrangler.jsonc` defines two environments:

| Environment | Worker | Database |
|---|---|---|
| `staging` | `landingnl-staging` | `landingnl-db-staging` |
| `production` | `landingnl` | `landingnl-db` |

The top-level block deliberately has **no** `d1_databases` binding and is not
named `landingnl`. A deploy that forgets `--env` therefore produces a Worker
without a database, and every request fails with
`Database binding is not configured` instead of quietly writing real users into
the staging database.

On 12 September 2026 exactly that happened: `landingnl.com` was serving from the
staging database while `landingnl-db` stayed empty, because an automated build
deployed without an environment.

## Cloudflare Workers Builds

The repository is connected to Cloudflare Workers Builds, which redeploys on
every push to any branch. Leaving it on a non-production branch is what caused
the wrong-database incident. Pick one:

**Option A — turn it off (recommended while the pilot runs).**
Cloudflare dashboard → Workers & Pages → `landingnl` → Settings → Build →
disconnect the repository. Production then only changes through the GitHub
Actions workflow, which cannot skip the tests.

**Option B — keep it, but pin it to production.**
In the same Build settings, set the deploy command to
`npx wrangler deploy --env production --keep-vars` and the watched branch to
`main`. Any other branch must not trigger a production build.

Either way, `landingnl-staging` may keep building from `release/**` branches.

## Checks after any production deploy

1. `https://landingnl.com/` renders the welcome page (no phone/SMS prototype).
2. `https://landingnl.com/privacy` loads.
3. `https://landingnl.com/dashboard` redirects to `/login` when signed out.
4. A new sign-in creates a row in `landingnl-db`, not in `landingnl-db-staging`.

## Rollback

`npx wrangler rollback --env production`. D1 migrations are additive and are not
rolled back.
