# LandingNL Auth Integration Runbook

Owner: Auth Integration & Production Journey Guardian

## Purpose

Google sign-in crosses four systems. Repository CI proves only the application code/build; it does not prove the production provider configuration or browser redirect chain.

Critical path:

`Browser → LandingNL login → Supabase signInWithOAuth → Google → Supabase /auth/v1/callback → LandingNL /auth/callback → exchangeCodeForSession → onboarding`

## Canonical production values

LandingNL production origin:

`https://landingnl.reichani.workers.dev`

LandingNL application callback:

`https://landingnl.reichani.workers.dev/auth/callback`

Supabase project origin:

`https://iwzsewwnntfylryqaihu.supabase.co`

Google Cloud Authorized redirect URI:

`https://iwzsewwnntfylryqaihu.supabase.co/auth/v1/callback`

Important: Google Cloud should point to the Supabase callback. Supabase Redirect URLs should allow the LandingNL application callback. These are different URLs and must not be swapped.

## Gate A — deployment identity

Open production `/api/version` and confirm the returned commit equals the GitHub release candidate SHA. Do not troubleshoot auth against a stale deployment.

## Gate B — application architecture

Expected implementation:
- Login starts OAuth from the browser Supabase client with provider `google`.
- `redirectTo` is `${window.location.origin}/auth/callback`.
- No `/auth/google` server OAuth-start route exists.
- `/auth/callback` exchanges the returned PKCE code with `exchangeCodeForSession`.
- Successful callback defaults to `/onboarding`.

CI invariants must fail if this architecture regresses.

## Gate C — Supabase Auth configuration

In Supabase:
1. Authentication → Providers → Google: Enabled.
2. Google Client ID present.
3. Google Client Secret present.
4. Authentication → URL Configuration → Site URL:
   `https://landingnl.reichani.workers.dev`
5. Redirect URLs contains exactly:
   `https://landingnl.reichani.workers.dev/auth/callback`

Use exact production URLs rather than permissive wildcards for release sign-off.

## Gate D — Google Cloud OAuth client

In Google Cloud OAuth Web Client:
1. Authorized redirect URI contains:
   `https://iwzsewwnntfylryqaihu.supabase.co/auth/v1/callback`
2. The Client ID is the same one configured in Supabase.
3. If the consent screen/app is in testing mode, the test Google account is in the allowed test-user audience.

Do not configure the LandingNL `/auth/callback` as Google's authorized redirect URI; Google redirects to Supabase first.

## Gate E — production browser trace

Start in a fresh/incognito browser and record the first failing boundary:

1. `/login` renders.
2. Continue with Google changes the page to a Google/Supabase authorization URL.
3. Google account selection/consent renders.
4. After Google, browser reaches Supabase callback.
5. Supabase redirects to LandingNL `/auth/callback?code=...`.
6. LandingNL callback exchanges the code and sets the session cookie.
7. Browser reaches `/onboarding` as authenticated user.

Failure classification:
- Button never leaves LandingNL → browser public config/client issue.
- Supabase error before Google → provider/client configuration issue.
- Google `redirect_uri_mismatch` → Google Cloud authorized redirect URI issue.
- Google succeeds but returns to wrong app URL → Supabase Site URL/Redirect URLs issue.
- LandingNL callback returns `oauth_callback` → PKCE/session exchange issue; inspect Worker logs for `google_oauth_code_exchange_failed`.
- Onboarding says sign-in expired → callback/session cookie did not persist.

## Release evidence

A Google-auth release is not complete until all five gates are evidenced on the same deployed commit. Status remains `CI_GREEN` or `DEPLOYED`, never `E2E_PASSED`, until the real Google journey reaches authenticated onboarding.
