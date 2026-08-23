# Supabase setup for LandingNL

## 1. Create the project
Create a Supabase project named `LandingNL` on the Free plan.

## 2. Add application environment values
From **Project Settings → API**, copy only the public values into your local `.env.local` / deployment environment:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<publishable-key>
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Do not commit secrets. Do not paste the service-role secret into chat or frontend environment variables.

## 3. Apply migrations
Open **SQL Editor** in Supabase and run, in order:

1. `supabase/migrations/0001_foundation.sql`
2. `supabase/migrations/0002_profile_bootstrap.sql`
3. `supabase/seed.sql`

The migrations create user-owned profile, consent, housing, journey and work-month data, plus the versioned regulatory Rule Registry and pseudonymous analytics foundation.

## 4. Configure Google authentication
In **Authentication → Providers → Google**, enable Google.

Create a Google OAuth client and use the Supabase callback URL shown by Supabase for Google as the authorized redirect URI.

For LandingNL, also add these application redirect URLs in Supabase **Authentication → URL Configuration**:

```text
http://localhost:3000/auth/callback
https://<landingnl-production-host>/auth/callback
```

Set Site URL to the active application host. During local development use `http://localhost:3000`. After first deployment, replace/add the production host.

## 5. Smoke test
1. Open `/login`.
2. Continue with Google.
3. Confirm redirect to `/onboarding`.
4. Complete onboarding.
5. Verify a row exists in `profiles` and `housing_profiles` for that authenticated user.
6. Confirm `/plan`, `/money`, `/wallet` and `/work` redirect unauthenticated users to `/login`.

## Security rules
- Never expose the service-role key to the browser.
- RLS remains enabled for all user-owned operational tables.
- Analytics must not contain email, name, exact home address or document contents.
- Critical regulatory rules remain human-approved and versioned.
