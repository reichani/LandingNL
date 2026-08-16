# LandingNL Product Scope — v0.1

## North star
LandingNL is a student landing operating system for the Netherlands, not a generic information portal.

Lifecycle: **Land → Settle → Belong**.

## UX rule
**One Moment → One Focus → One Action**.

Home answers: **What do I do now?**
Plan answers: **What comes next?**
Money answers: **What changes financially?**
Wallet answers: **What do I need to bring or prove?**

## Entitlements

### Guest
- Core arrival guide
- Basic checklist
- Municipality / BSN / DigiD explainers
- Housing and mobility basics

### Registered Free
- Saved progress
- Personal timeline
- Simple budget
- Document wallet
- Student CV wizard
- Basic paid-hours tracker
- Community participation

### Plus
- Adaptive triggers
- Regulatory-aware DUO guidance
- Smart reminders
- Dynamic budget
- Work-hour intelligence and evidence readiness
- Job-specific CV tailoring
- Application tracker
- Contract / evidence workflow

## P0 — v0.1
1. Authentication + consent
2. Onboarding
3. Housing journey
4. Home / Plan shell
5. Municipality → BSN → DigiD
6. Wallet
7. Basic budget
8. Work Journey
   - Work preferences
   - CV wizard
   - CV export
   - Job application state
   - Paid-hours tracker
9. Analytics event taxonomy
10. Admin foundations / roles

## P1
- DUO intelligence
- Health insurance event flow
- Dynamic budget
- Rule Registry + regulatory operations admin
- Community core: Ask / Meet / Share / Exchange

## P2
- Online sessions
- IRL get-togethers
- Shared dinner
- Skills exchange matching
- Community intelligence

## Community model
Single `CommunityActivity` object with activity type:
- ASK
- MEET
- SHARE
- EXCHANGE

Context fields can include journey step, city/area, online/IRL, time, capacity, offer, requested exchange, and safety flags.

Community stays largely free to support network effects and long-term retention.

## Regulatory model
Official sources → Regulatory Watch → Change detection → Impact analysis → Review queue → Approval → Versioned Rule Registry → Journey / Money / Work engines.

Agents never write critical rules directly to production.

## Data principles
- PII, operational data and analytics separated
- Explicit consent boundaries
- Analytics should be aggregated/pseudonymous where possible
- Free users are useful product-learning participants, not data inventory
- No sale of personal user data

## Infrastructure principle
Start on free tiers where appropriate. Upgrade infrastructure when real usage or revenue justifies it.
