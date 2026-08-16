# LandingNL

LandingNL is a mobile-first landing companion for international students moving to the Netherlands.

## Product thesis

**Land → Settle → Belong**

LandingNL helps students move from pre-arrival preparation to becoming operational and independent in the Netherlands, while keeping every screen focused on one clear next action.

### Core journeys
- Housing search and registrable address readiness
- Arrival, municipality registration, BSN and DigiD
- Budget, banking, mobility and essential setup
- Part-time work, CV creation and paid-hours tracking
- DUO and regulatory-aware guidance
- Secure document wallet
- Community: Ask, Meet, Share and Exchange

## Product principles
- One Moment → One Focus → One Action
- Mobile-first and future-facing for students born around 2008
- Free users receive meaningful utility; Plus unlocks adaptive intelligence
- Official-source-first regulatory guidance
- No hard paywall on urgent government tasks
- PII separated from analytics and product signals
- Revenue-funded infrastructure: free tiers first, upgrade as real usage and revenue grow

## Build strategy

The working application is the source of truth. Figma remains the visual specification and is updated at major UX milestones.

Planned stack:
- Next.js + TypeScript
- Responsive component system
- Supabase/PostgreSQL
- Google authentication
- Event-driven journey engine
- Entitlements and consent model
- Versioned regulatory Rule Registry
- Analytics event taxonomy

## Delivery phases

### P0 — v0.1
Auth + consent, Housing, Home/Plan, municipality → BSN → DigiD, Wallet, basic Budget, Work/CV, paid-hours tracker, analytics foundation.

### P1
DUO intelligence, insurance, dynamic budget, Regulatory Admin, Community core (`Ask / Meet / Share / Exchange`).

### P2
Online sessions, IRL get-togethers, shared dinners, skills exchange matching, advanced community intelligence.
