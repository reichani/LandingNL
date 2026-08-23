# LandingNL Release Evidence

Use one copy of this template per release candidate.

## Candidate

- GitHub commit:
- Branch:
- PR:
- Cloudflare version/deployment ID:
- Production origin:
- Rollback commit/version:

## Agent sign-off

| Agent | Result | Evidence | Blockers |
|---|---|---|---|
| Product & UX Guardian | ⬜ | | |
| Principal Engineer | ⬜ | | |
| Auth, Data & RLS Guardian | ⬜ | | |
| Platform & Deployment Guardian | ⬜ | | |
| Test & Regression Guardian | ⬜ | | |
| Regulatory & Trust Specialist (when applicable) | ⬜ | | |

## Automated gates

- [ ] typecheck
- [ ] lint
- [ ] permanent UX/architecture invariants
- [ ] Cloudflare Worker build

## Production critical path

- [ ] guest Home renders
- [ ] Google sign-in completes
- [ ] onboarding 1/5 → 5/5 completes
- [ ] `SETUP COMPLETE` appears
- [ ] Home opens on the same session
- [ ] NOW points to the correct destination
- [ ] THIS WEEK has ≤2 cards and does not duplicate NOW
- [ ] 360px mobile has no horizontal overflow
- [ ] desktop geometry is flat/aligned
- [ ] keyboard focus is visible

## Data/security

- [ ] User A cannot read/update User B profile
- [ ] User A cannot read/update User B housing
- [ ] persistence changes have matching RLS policy
- [ ] no service-role key is exposed

## Decision

- Status: `CODED / CI_GREEN / DEPLOYED / E2E_PASSED / RELEASED`
- Residual risk:
- Release Manager:
- Timestamp:
