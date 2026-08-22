# Student Journey Delivery Plan

## Release boundaries

Do not add this scope to PR #4. PR #4 remains the recovery/security and behavior-preserving extraction boundary. Each item below is independently reviewable and reversible.

## PR J1 — Journey foundation

Scope:

- ADR 0003;
- journey and truth-state contract;
- authoritative source inventory;
- inventory of prototype claims that require replacement.

Runtime impact: none.

Exit gate:

- product and engineering review the phase order, branching facts, completion semantics and out-of-scope list.

## PR J2 — Mobile Focus Home

Scope:

- Prepare, Settle and Belong overview;
- one-next-action focus card;
- planned/submitted/waiting/completed/blocked states;
- secondary journey overview;
- source and review-status component;
- reduced-motion celebration component.

Tests:

- state-transition unit tests;
- authenticated route tests;
- Samsung S24+, iPhone and tablet viewport tests;
- keyboard, focus, contrast and reduced-motion checks.

Runtime impact: staging first.

## PR J3 — Rules and authoritative milestones

Scope:

- versioned rule registry service;
- D1 milestone definitions and user milestone state;
- EU/non-EU, stay-duration, work and insurance branches;
- fail-closed stale/missing-source behavior;
- removal of simulated DigiD, bank and huisarts completion claims.

Tests:

- D1 migration and rollback implications;
- authorization and ownership;
- missing, stale and conflicting rule cases;
- deterministic explanation snapshots.

Runtime impact: staging first.

## PR J4 — Benefits and work scenarios

Scope:

- Zorgtoeslag and Huurtoeslag pre-checks;
- work/TWV and insurance decision paths;
- official source handoff;
- no automated government application and no guaranteed amount.

Tests:

- boundary-value rule tests;
- EU/non-EU negative cases;
- expired-rule blocking;
- source/version visibility.

Runtime impact: staging first.

## PR J5 — Academic coach

Scope:

- institution/programme-specific BSA rule;
- ECTS progress and deadline model;
- separate Study Progress Monitoring warning;
- study-adviser handoff.

Tests:

- unknown-programme fail-closed behavior;
- BSA/SPM separation;
- user-confirmed versus externally verified status.

Runtime impact: staging first.

## PR J6 — Community foundation

Scope:

- Ask, Meet, Share and Exchange;
- city/campus/coarse-distance discovery;
- moderation and reporting;
- safe contact and privacy boundaries.

Tests:

- user-content encoding;
- ownership and moderation states;
- report/abuse flows;
- private profile, supporter and precise-location non-disclosure.

Runtime impact: feature-flagged staging only until acceptance passes.

## Explicitly deferred

- parent accounts or supporter console;
- document vault or document intelligence;
- automatic DUO/Belastingdienst applications;
- live bank integration;
- live huisarts acceptance claims;
- exact public location;
- AI eligibility adjudication;
- unverified commercial perks.

