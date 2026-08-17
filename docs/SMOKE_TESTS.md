# LandingNL Smoke Tests

Target: Cloudflare Worker production preview

## Preconditions

- Latest `feat/sprint-0-foundation` build is deployed.
- Cloudflare build variables contain valid `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` values; the production build fails if either is missing.
- Supabase Google provider contains the Google OAuth Client ID and Client Secret.
- Supabase redirect allow-list includes the active Cloudflare `/auth/callback` URL.
- Migrations `0005` through `0010` have been applied.

## 1. Public homepage

1. Open `/` in an incognito window.
2. Confirm there is a full marketing homepage, not a student demo dashboard.
3. Confirm hero, product preview, feature grid, How it works, Work + DUO section and final CTA render.
4. Click Plan, Money, Wallet and Work feature cards.
5. Confirm Weekly Focus appears as a product capability, not the setup flow itself.
6. Resize to ~360px width and confirm no horizontal overflow.

Expected: no personal name, rent or student data is exposed to a guest.

## 2. Google sign-in

1. Open `/login`.
2. Click Continue with Google.
3. Complete Google consent with a test account allowed by the Google OAuth testing audience.
4. Confirm Google returns through Supabase and then `/auth/callback`.
5. Confirm final redirect reaches `/onboarding`.

Expected: no `Invalid supabaseUrl`, redirect mismatch or callback loop.

## 3. Onboarding persistence and privacy

1. Enter city, university, citizenship status, arrival date and housing status.
2. Complete setup.
3. Confirm the browser shows the successful completion state before navigation.
4. Confirm Home opens without a generic server-side exception.
5. Return to `/onboarding`, update setup, and complete it again.
6. Confirm Home uses saved profile context and housing status.
7. Confirm setup never asks for passport number or BSN number.
8. If the session is expired, confirm the page offers a clear Google sign-in recovery action instead of a generic failure.

Expected: the authenticated browser client writes `profiles` then `housing_profiles` directly under RLS, shows `SETUP COMPLETE`, then performs a full navigation to Home. No onboarding Server Action/Worker persistence path is involved; no demo values are injected; analytics is not automatically opted in.

## 4. Housing readiness

1. Open `/housing` signed in.
2. Set housing secured, registrability, signed contract, rent, move-in date and commute.
3. Save and reload.
4. Open `/plan` and `/money`.

Expected: housing readiness persists; Plan treats housing as complete when secured and Money reads rent. No exact address is requested.

## 5. Journey Plan

1. Open `/plan` signed in.
2. Verify only the first unmet dependency is active.
3. If housing is secured, mark Municipality done.
4. Reload; verify Municipality stays completed and BSN becomes active.
5. Mark BSN and DigiD complete in sequence.
6. Return to Home.

Expected: Home primary action advances based on persisted `journey_tasks`; the primary CTA opens the correct destination; no BSN number itself is requested or stored.

## 6. Money

1. Open `/money` signed in.
2. Confirm housing rent is read from the housing profile if present.
3. Change Food, Phone & insurance, Transport or Other.
4. Save each changed category.
5. Reload.

Expected: values persist through `budget_items`, total recalculates, and no bank credentials are requested.

## 7. Wallet

1. Open `/wallet` signed in before Municipality completion.
2. Confirm Passport/ID, housing proof and appointment confirmation are surfaced as current-task documents.
3. Mark each Ready and reload.
4. Complete Municipality in Plan and return to Wallet.

Expected: readiness persists; Wallet switches emphasis toward work evidence after the municipality dependency is complete. No document file contents are required in this MVP.

## 8. Work + DUO hub

1. Open `/work` logged out and confirm preview mode is usable.
2. Sign in and open `/work/log-shift`.
3. Save a valid paid shift.
4. Return to `/work` and confirm monthly hours increase.
5. Confirm displayed threshold comes from the approved Rule Registry when available.

Expected: no UI promises DUO eligibility; DUO remains the decision authority.

## 9. Job applications

1. Open `/work/applications` signed in.
2. Add an employer, role and stage.
3. Reload and return to `/work`.

Expected: application persists and Work hub count increases.

## 10. Student CV

1. Open `/work/cv` signed in.
2. Confirm name/city/education prefill only from the user's own profile where available.
3. Enter languages, strengths, availability and truthful experience.
4. Save at the final step.
5. Reload.
6. Open `/plan`.

Expected: CV fields persist and the CV milestone completes. No invented experience is auto-added.

## 11. Contract readiness

1. Open `/work/contract` signed in.
2. Fill employer, role, type, start date, hours, wage and optional work/pay details.
3. Save once without signatures; confirm readiness is partial.
4. Check both signature boxes and save again.
5. Reload and open `/plan` and `/work`.

Expected: contract fields persist; a sufficiently complete signed contract completes the contract milestone and creates current-month contract evidence readiness.

## 12. Employer pack

1. Open `/work/employer-pack`.
2. Confirm copy-to-clipboard and email action work.
3. Read the generated employer message.

Expected: wording is nationality-neutral and does not promise or imply DUO eligibility.

## 13. Monthly work evidence

1. Open `/work/evidence` signed in.
2. Confirm paid-hours readiness appears after at least one logged current-month shift.
3. Mark payslip and salary evidence ready.
4. Reload and return to `/work`.

Expected: readiness persists and Work hub count reflects ready evidence only.

## 14. Trusted supporter

1. Open `/supporter` signed in.
2. Enter one supporter email and create read-only access.
3. Copy the generated `/share/<token>` link and open it in an incognito window.
4. Confirm only limited snapshot data is visible: first name, city, housing status and journey milestone statuses.
5. Confirm exact address, document contents, private financial data and account controls are absent.
6. Back as the student, revoke supporter access.
7. Reload the share link.

Expected: revoked link no longer returns the snapshot. Creating a new supporter revokes any previous active supporter.

## 15. Account controls

1. Open `/account` signed in.
2. Confirm profile summary is the current user's data.
3. Follow Setup, Housing and Supporter links.
4. Sign out.

Expected: session clears and `/account` redirects to login on next visit.

## 16. RLS isolation

Repeat saved-feature checks with a second test user.

Expected: user B cannot read or mutate user A's profile, housing, tasks, budget, wallet readiness, applications, work records, CV, contract or supporter settings. Direct browser writes from onboarding must also remain limited to the authenticated user's rows.

## 17. Regression / platform

- `/` guest: HTTP 200
- `/login`: HTTP 200
- `/work`: HTTP 200 in guest preview
- Google callback: no 500/1101
- Onboarding completion: no generic server-side exception
- Cloudflare Workers logs: no new uncaught runtime exception
- Desktop Chrome: no layout overflow
- Mobile 360px: no layout overflow
- Keyboard navigation: CTA and form controls are reachable

## 18. Weekly Focus / This Week

1. Sign in with an onboarding profile containing an arrival date within the next 7 days.
2. Open Home and confirm `NOW · PRIMARY FOCUS` remains the single dominant action.
3. Confirm the `THIS WEEK` section contains no more than two secondary cards.
4. Confirm the primary destination is not repeated in Weekly Focus.
5. Move the arrival date to 8–30 days away and confirm the wording changes to pre-arrival guidance when applicable.
6. Complete journey milestones in sequence and return to Home after each meaningful stage.
7. Confirm Weekly Focus shifts between document, money, work/contract or evidence checks as context changes.
8. Confirm exact address, BSN value, document contents or private financial credentials never appear in Weekly Focus.

Expected: Weekly Focus is contextual, calm and secondary to NOW; it uses existing student-owned data and requires no new migration.
