# LandingNL Student UX Journey

Last reviewed: 2026-08-22

Audience: international students, primarily born around 2008, preparing to study and live independently in the Netherlands.

Product promise: **Your first 90 days in the Netherlands, in the right order.**

## Experience contract

Every focus view answers five questions in under one screen:

1. What should I do now?
2. Why now?
3. What do I need?
4. How will I know it is done?
5. What happens next?

The interface must never manufacture certainty. It shows the source, review date and truth state for time-sensitive guidance.

## Phase 0 — Prepare

Period: admission decision to arrival.

Primary feeling: high anxiety and bureaucratic uncertainty.

| Order | Milestone | Required branch | Completion evidence | Safe focus action |
|---|---|---|---|---|
| 1 | Admission conditions | Institution/programme | User-confirmed or institution evidence | Check the remaining admission condition |
| 2 | Immigration route | EU/EEA/Swiss vs non-EU | Official route identified | Open the correct official route |
| 3 | Housing | City and contract status | Signed contract or confirmed accommodation | Review address, dates and deposit |
| 4 | Pre-arrival insurance | Nationality, residence and work intent | Coverage selected and confirmed | Check whether current coverage applies |
| 5 | Registration plan | Stay duration and municipality | BRP/RNI appointment planned | Book or confirm the correct registration route |
| 6 | First-month budget | Housing and known costs | User-confirmed plan | See the next unavoidable payment |
| 7 | Arrival plan | Arrival date and institution | Check-in plan confirmed | Save the first destination and contact |

Do not infer age, nationality, city, institution or programme from Google sign-in.

## Phase 1 — Settle

Period: arrival through day 30.

Primary feeling: excitement mixed with administrative overload.

| Order | Milestone | Dependency | Valid states | Safe focus action |
|---|---|---|---|---|
| 1 | Municipality/RNI registration | Address and stay duration | planned → submitted → waiting → confirmed | Prepare for or confirm registration |
| 2 | BSN | Registration outcome | waiting → completed_user_confirmed | Record that the BSN was issued; never store it in plain UI state |
| 3 | DigiD | BSN, registered address and phone | submitted → waiting_external → completed_user_confirmed | Apply, wait for letter, then activate |
| 4 | Banking setup | Provider-specific conditions | needs_confirmation → completed_user_confirmed | Compare requirements; do not claim a bank is active |
| 5 | Insurance re-check | Study/work situation | verified/conditional/needs_input | Re-evaluate when work or internship begins |
| 6 | Huisarts | Postcode/coarse area | contacted → waiting_external → completed_user_confirmed | Find nearby practices and contact them |
| 7 | Essential support | Institution and city | confirmed | Save emergency and student-support contacts |

There is no reliable central source for live huisarts acceptance. LandingNL may show nearby practices but must instruct the student to confirm capacity directly.

## Phase 2 — Belong

Period: days 31–90 and continued use.

Primary feeling: independence, belonging and budget pressure.

### Study

| Capability | Rule |
|---|---|
| BSA target | Institution/programme-specific; never use one national number |
| ECTS progress | Student-confirmed until an approved integration exists |
| Study Progress Monitoring | Separate from BSA and especially relevant to residence-permit holders |
| Risk warning | Explain the missing credits/deadline and route to the study adviser |

### Money and work

| Capability | Rule |
|---|---|
| Work route | Branch by EU/EEA/Swiss status, permit status and work type |
| TWV guidance | Show only when the verified rule applies; employer action must be explicit |
| Insurance | Recalculate the guidance when paid work, internship or self-employment begins |
| Zorgtoeslag | Deterministic scenario only; no guaranteed amount or approval claim |
| Huurtoeslag | Check housing type, rent and household conditions; no guaranteed amount |
| DUO | Route to the official calculator/application; no autonomous application |

### Community

Community is a separate, optional surface:

- Ask — practical questions;
- Meet — low-risk student activities;
- Share — useful items or information;
- Exchange — zero-cash meals, skills, bikes and tools.

Required before launch: authenticated ownership, school/city scope, server-side validation, moderation status, reporting, abuse controls and safe-contact boundaries. Discovery uses opt-in city/campus/coarse distance, never precise public location.

## Truth-state UI language

| State | Example label | CTA |
|---|---|---|
| Verified | Verified from IND · reviewed 22 Aug 2026 | View source |
| Conditional | Likely applies based on 3 confirmed answers | Review answers |
| Needs input | Two answers needed | Complete check |
| Institution-specific | Your programme sets this target | Add programme rule |
| Needs confirmation | Contact the practice to confirm availability | Call or visit site |
| Stale | This guidance needs review | Open official source |
| Unavailable | LandingNL cannot verify this result | Continue with authority |

## Gen Z UX acceptance criteria

- The current task and CTA fit within the initial mobile viewport.
- No more than one primary CTA per focus state.
- Known information is prefilled but never silently assumed.
- Progress reflects meaningful states, not button taps.
- No text block is required to understand the next action.
- Confetti and motion respect `prefers-reduced-motion`.
- Dark mode meets contrast requirements.
- Samsung S24+, iPhone and tablet widths have no horizontal overflow or clipped controls.
- Commercial offers are labelled and do not interrupt the core journey.

## Authoritative source baseline

- [IND — student residence permit and work conditions](https://ind.nl/en/residence-permits/study/student-residence-permit-for-university-or-higher-professional-education)
- [Government.nl — citizen service number (BSN)](https://www.government.nl/themes/government-and-democracy/personal-data/citizen-service-number-bsn)
- [DigiD — application requirements](https://www.digid.nl/en/apply-and-activate/apply-digid)
- [Study in NL — healthcare insurance](https://www.studyinnl.org/plan-your-stay/healthcare-insurance)
- [Study in NL — working while studying](https://www.studyinnl.org/life-in-nl/working-while-studying)
- [DUO — EU/EEA student-finance eligibility](https://duo.nl/particulier/student-finance-citizens-eu-eer-switzerland-or-uk/eligibility.jsp)
- [UvA — Binding Study Advice](https://student.uva.nl/en/information/binding-study-advice-bsa)
- [UvA — Study Progress Monitoring](https://www.uva.nl/en/education/practical-information/visas-and-permits/study-progress-monitoring.html)
- [ZorgkaartNederland — huisarts discovery limitations](https://www.zorgkaartnederland.nl/huisarts)

## Delivery sequence

1. Journey foundation: this contract, ADR and rule inventory; no runtime change.
2. Mobile Focus Home: one-next-action state machine and responsive acceptance tests.
3. Benefits/work rule service: deterministic, sourced and versioned outcomes.
4. Academic coach: institution/programme BSA and ECTS tracking.
5. Community foundation: moderated, scoped and privacy-safe exchange.

