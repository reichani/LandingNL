## Change

What changed and why?

## Root cause

What made the defect or gap possible?

## Permanent prevention

What automated invariant, test or process change prevents the same class of issue returning?

## Evidence

- [ ] `CODED` — commit linked
- [ ] `CI_GREEN` — typecheck, lint, permanent invariants, Worker build
- [ ] `DEPLOYED` — Cloudflare version matched to this commit
- [ ] `E2E_PASSED` — relevant production smoke path passed
- [ ] `RELEASED` — Release Manager sign-off

## UX / responsive

- [ ] 360px mobile
- [ ] tablet
- [ ] desktop
- [ ] keyboard focus / accessible labels
- [ ] no layout tilt/skew/overflow
- [ ] loading, empty, error and success states reviewed

## Data / security

- [ ] RLS impact reviewed
- [ ] no service-role/public-secret regression
- [ ] no unnecessary sensitive data added
- [ ] two-user isolation tested when persistence changes

## Rollback

Last known-good commit/version and rollback action:

## Residual risk

What remains unverified?
