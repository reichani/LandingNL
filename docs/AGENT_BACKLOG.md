# LandingNL Agent Backlog

Priority rule: no major feature work while a P0 item is open.

## P0 — Release stabilisation

### Platform & Deployment Guardian
- [ ] Confirm Cloudflare serves the exact current GitHub head before production sign-off.
- [ ] Record Cloudflare version/deployment ID in release evidence.
- [ ] Define last-known-good rollback target.

### Test & Regression Guardian
- [ ] Production: Google → onboarding 1/5 → 5/5 → `SETUP COMPLETE` → Home.
- [ ] Production: 360px mobile and desktop visual geometry.
- [ ] Production: User A / User B RLS isolation for profile + housing + journey data.

### Product & UX Guardian
- [x] Remove rotate/skew from persistent product cards.
- [x] Remove feature-card movement; keep only border/shadow hover feedback.
- [x] Add permanent CSS geometry invariant.
- [ ] Verify current production deployment has the corrected flat geometry.

### Principal Engineer
- [x] Freeze onboarding persistence on browser Supabase client + RLS.
- [x] Add invariant preventing onboarding Server Action persistence from returning.
- [ ] After Sprint 0 release, stop adding unrelated scope to the long-lived foundation branch.

### Auth, Data & RLS Guardian
- [x] Confirm repository RLS policies support own-profile and own-housing browser writes.
- [ ] Confirm the same migrations/policies exist on the live Supabase project.
- [ ] Execute two-user isolation test.

## P1 — Engineering maturity immediately after P0

- [ ] Add automated browser E2E for public Home, login entry and onboarding success state.
- [ ] Add screenshot/geometry regression at desktop + 360px.
- [ ] Add deployment identity endpoint/metadata so current build can be matched to GitHub without dashboard guesswork.
- [ ] Introduce smaller feature branches/PRs for City Pulse and Landing Circle.

## P2 — Product expansion

Only after P0 is released:
- Weekly Focus production verification.
- City Pulse.
- Landing Circle v0: Ask · Offer · Pass it on.
- Verified student trust layer.
