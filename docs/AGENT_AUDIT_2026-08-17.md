# LandingNL Cross-Agent Audit — 2026-08-17

Scope: `feat/sprint-0-foundation`

## Executive result

Overall: **AMBER / stabilisation required before new major feature work**.

The product has moved beyond prototype quality, but the release discipline lagged behind implementation speed. The main failure pattern was not lack of effort; it was insufficient permanent prevention: fixes were being made faster than regression gates, deployment identity checks and visual consistency controls were being added.

## Agent findings

### Product & UX Guardian — AMBER

Findings:
- Hero preview previously used deliberate `rotate(1deg)`, which visually tilted every nested step card.
- Feature cards still used movement on hover, which conflicts with the new “calm, geometrically stable” design rule.
- No automated visual/invariant gate existed to stop tilt/skew from returning.
- User-facing error states improved, but production screenshots proved that stale deployments could make the UX appear inconsistent with the branch.

Actions:
- Make flat-card geometry a product invariant.
- Remove card movement from persistent product surfaces.
- Add automated CSS geometry gate.
- Keep technical infrastructure errors out of user copy.

### Principal Engineer / Architecture Guardian — AMBER

Findings:
- Onboarding persistence changed architecture multiple times while debugging (server action → browser/RLS), which increased uncertainty during release.
- The final browser/RLS direction is materially simpler and easier to reason about.
- Recurring incidents were fixed in code before equivalent architecture regression tests existed.
- Sprint branch has accumulated a very large change surface, increasing integration risk.

Actions:
- Freeze the current onboarding persistence architecture.
- Prevent reintroduction of onboarding Server Actions with an automated invariant.
- Split future work into smaller release branches after Sprint 0 stabilises.

### Auth, Data & RLS Guardian — GREEN WITH MANUAL GATE

Evidence reviewed:
- `profiles` RLS allows own-row select/update; insert policy is added in the auth bootstrap migration.
- `housing_profiles` uses own-row `for all` policy with `using` and `with check`.
- New user trigger bootstraps a profile from Auth metadata.

Residual risk:
- Real two-account RLS isolation has not yet been proven against the deployed Supabase project.

Action:
- Browser onboarding writes remain allowed only because RLS is the security boundary; two-user production isolation remains a mandatory release gate.

### Platform & Deployment Guardian — RED

Findings:
- GitHub CI proves Worker build compatibility but does not prove which GitHub commit Cloudflare is currently serving.
- Production screenshots showed behaviour inconsistent with the branch, demonstrating deployment identity drift/staleness as a real operational risk.

Actions:
- `DEPLOYED` must never be inferred from push or CI success.
- Record Cloudflare version/commit identity before E2E sign-off.
- Do not call a release complete while deployment identity is unknown.

### Test & Regression Guardian — RED → remediation started

Findings:
- Existing CI only ran typecheck, lint and Worker build.
- No invariant guarded card geometry, onboarding architecture or primary-nav size.
- No automated production browser E2E exists yet.

Actions started:
- Add `scripts/quality-gates.mjs` for architecture/UX invariants.
- Wire permanent invariants into CI.
- Keep production E2E as a mandatory manual gate until browser automation is added.

### Regulatory & Trust Specialist — GREEN FOR CURRENT SCOPE

Findings:
- Current Work/DUO product language retains the “guidance, not eligibility decision” boundary.
- Community work has not yet been opened to unrestricted messaging/marketplace behaviour.

Action:
- Invoke this specialist before Landing Circle enables user-to-user interaction.

## Stop-the-line blockers before next major feature

1. Current CI must include the permanent invariant suite.
2. Flat-card geometry must be enforced, not remembered.
3. Current Cloudflare deployment must be matched to the GitHub head before production UX claims.
4. Google → onboarding → Home must pass on production.
5. Two-user RLS isolation must pass on production Supabase.

## What changes in working style

From this audit forward:
- no “deploy happened” assumption;
- no “coded = done” language;
- no repeated defect without a prevention gate;
- no major feature while a P0 primary journey is red;
- every release report uses `CODED / CI_GREEN / DEPLOYED / E2E_PASSED / RELEASED`.
