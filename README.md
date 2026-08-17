# LandingNL v2

LandingNL is a mobile-first landing operating system for international students in the Netherlands.

## Active architecture

`Cloudflare Pages + React/Vite + Pages Functions + D1 + direct Google OAuth`

The v2 product is intentionally simple:
- `/` — public website
- `/app` — authenticated product
- `/api/*` — Cloudflare Pages Functions
- `d1/migrations/` — canonical database schema

Primary app navigation is **Home · Plan · Money · Work · Circle**.

## Local build

```bash
bun install
bun run typecheck
bun run quality
bun run build
```

Cloudflare Pages build output is `dist`.

## Runtime bindings

Configure in Cloudflare Pages:
- `DB` — D1 binding
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `SESSION_SECRET`
- optional `OAUTH_REDIRECT_URI`

See `docs/V2_ARCHITECTURE_UX_FREEZE.md` and `docs/V2_RELEASE_RUNBOOK.md`.

## Legacy v1

The inherited Next/OpenNext/Supabase source remains temporarily in the branch history/repository only as migration reference. It is not part of the v2 build or runtime. Remove it after v2 production E2E and rollback observation are complete.
