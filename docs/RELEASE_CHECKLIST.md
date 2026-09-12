# Release checklist

## Before merge

- [ ] `npm test` passes.
- [ ] `npm run check` passes.
- [ ] No secret or `.dev.vars` file is tracked.
- [ ] Login, onboarding and dashboard routes render locally.
- [ ] Existing Cloudflare variables and bindings are inventoried.
- [ ] Authentication changes include negative tests.
- [ ] User-authored community content is rendered without `innerHTML`.

## Staging

- [ ] Google sign-in is verified with a valid and an invalid credential.
- [ ] Email sign-in requires proof of mailbox ownership.
- [ ] Unauthenticated users cannot open protected routes.
- [ ] Onboarding persists after logout/login and across devices.
- [ ] Returning completed users resume at `/dashboard`; incomplete users resume at `/onboarding`.
- [ ] Mobile checks pass on Samsung S24+, iPhone and tablet widths.
- [ ] Security headers and cookie attributes are present.
- [ ] No console errors or unexpected Worker errors appear.

## Production

- [ ] A rollback version is recorded.
- [ ] Staging and production bindings are distinct where required.
- [ ] GitHub is the source of truth; dashboard editing is frozen.
- [ ] Production smoke test passes after deployment.
