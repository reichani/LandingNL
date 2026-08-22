# ADR 0003: Student journey and truth policy

## Status

Proposed for the journey-foundation PR.

## Context

LandingNL serves international students, primarily people born around 2008, from the moment they decide to study in the Netherlands through their first 90 days and early academic life. The product must reduce anxiety without presenting a prototype, estimate or AI-generated explanation as an official decision.

Visa, registration, insurance, work, benefits and academic-progress rules vary by nationality, residence status, employment, housing, municipality, institution, programme and effective date. A single static checklist would create false certainty.

## Decision

### Journey model

Use three user-facing phases:

1. **Prepare** — admission decision to arrival.
2. **Settle** — arrival through the first 30 days.
3. **Belong** — days 31–90 and continuing academic/community life.

The product promise remains: **“Your first 90 days in the Netherlands, in the right order.”** Pre-arrival preparation is the entry ramp to that promise.

At any moment, the focus view presents one primary next action, one reason, and an optional preview of what follows. The full journey remains available as a secondary overview.

### Required branching

Journey eligibility must branch on explicit, user-confirmed facts. At minimum:

- EU/EEA/Swiss versus non-EU status;
- intended stay of four months or more versus a shorter stay;
- studying only versus employed/interning/self-employed;
- age band;
- housing type and registered address availability;
- municipality, institution and programme;
- Dutch public health-insurance status.

Google sign-in must not be treated as evidence of age, nationality, city, institution or programme.

### Truth policy

AI may simplify or translate approved content. AI must not decide eligibility, invent a monetary amount, mark a milestone complete, claim live availability, or replace an official authority.

Every time-sensitive rule or recommendation must include:

- stable rule key and version;
- jurisdiction and audience conditions;
- official source URL;
- effective date and optional expiry date;
- last-reviewed timestamp;
- review status;
- plain-language rationale;
- deterministic outcome and explanation.

Allowed user-facing truth states:

- `verified` — supported by a current authoritative source;
- `conditional` — deterministic result based on confirmed inputs;
- `needs_input` — required facts are missing;
- `institution_specific` — the institution/programme is authoritative;
- `needs_confirmation` — completion or availability requires user/third-party confirmation;
- `stale` — the review date has expired;
- `unavailable` — the feature cannot make a reliable claim.

When evidence is missing, the system must fail closed: show what is unknown and link to the responsible authority instead of guessing.

### Completion policy

A button click alone cannot prove BSN issuance, DigiD activation, bank activation, huisarts registration, benefit approval or BSA compliance. Milestones use evidence-aware states:

- `not_started`;
- `planned`;
- `submitted`;
- `waiting_external`;
- `completed_user_confirmed`;
- `verified_external` where a reviewed integration exists;
- `blocked`.

### Gen Z interaction policy

- Mobile-first, fast and plain-language.
- One focus, one primary action.
- No repeated collection of known information; prefill and ask for confirmation.
- Micro-celebrations only after a genuine completion state and with reduced-motion support.
- No sponsor banners or disguised advertising. Commercial benefits require clear labelling and verified redemption terms.
- No exact-location sharing for community discovery; use opt-in city, campus or coarse distance.
- Bento layouts are for overview only, not a substitute for the focus journey.

## Scope boundaries

This decision does not add automated DUO applications, document intelligence, a parent account, a supporter console, live huisarts-capacity claims, bank integration, or an AI benefits adjudicator.

Community remains optional and separate from the administrative focus journey. The core journey must work when community and trusted-supporter features are disabled.

## Consequences

- Current prototype claims such as simulated bank integration or button-confirmed DigiD activation must be replaced in later UX PRs.
- Benefits and work guidance require a deterministic, versioned rule service rather than embedded UI copy.
- BSA targets must be institution/programme-specific and may remain unknown until verified.
- Journey definitions and user milestone state require separate D1 migrations and authorization tests before becoming authoritative.
- This ADR itself changes no runtime behavior and requires no deployment.

## Rollback

Close the journey-foundation PR or revert its documentation commit. No route, binding, database or production version is affected.

