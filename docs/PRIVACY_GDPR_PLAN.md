# LandingNL privacy and GDPR delivery plan

Status: implementation plan; not a legal declaration or evidence of compliance.

## Current data inventory

| Processing area | Current data | Purpose | System |
|---|---|---|---|
| Account | provider subject, email, verified flag, display name, timestamps | identify and resume an account | D1 `users` |
| Session | hashed opaque token, user ID, expiry, creation and revocation timestamps | secure signed-in access | D1 `sessions`; secure cookie in browser |
| Email proof | hashed token, email, expiry, creation and consumption timestamps | prove mailbox ownership | D1 `email_login_tokens` |
| Journey | age, status, city, programme, housing, milestone step and BSN appointment date | personalise and resume the student journey | D1 `user_state` |
| Preferences/community prototype | work-status choice and exchange posts | render optional dashboard features | D1-backed state plus disposable browser cache |
| Release identity | Worker version ID/tag/timestamp | support diagnosis and rollback | Cloudflare version metadata; displayed ID is truncated |

The inventory must be revalidated before publishing a privacy notice. In particular, Cloudflare logs/analytics, Google authentication, email delivery and any future community contact data must be included with their processor and transfer details.

## Delivery gates

### P0 — before public onboarding

1. Confirm the legal data controller name, postal address, privacy contact email and, if applicable, DPO or EU representative.
2. Create a record of processing activities mapping every field to purpose, lawful basis, recipient/processor, location/transfer mechanism and retention period.
3. Sign and archive processor terms/DPAs for Cloudflare, Google and the selected email provider; document any non-EEA transfer safeguard.
4. Define retention jobs for expired sessions and email tokens, plus inactive-account deletion rules.
5. Implement authenticated account export, correction and deletion requests with an auditable identity check.
6. Publish concise Privacy Notice and Cookie Notice pages in English, Turkish and Dutch; link them before sign-in and from every authenticated page.
7. Do not add a consent banner unless non-essential cookies/trackers are actually enabled. If enabled later, block them before consent and make refusal as easy as acceptance.

### P1 — before community launch

1. Move community posts into a dedicated schema with ownership, city/school scope, moderation state, report flow and deletion timestamps.
2. Publish Community Rules and explain what other students can see.
3. Add block/report, abuse triage, retention and contact-safety controls.
4. Run a DPIA screening because the audience includes young students and the feature can expose location/social context; complete a full DPIA if the screening identifies high risk.

### P2 — operational accountability

1. Maintain a breach-response playbook, processor register and data-subject-request log.
2. Review the inventory and notices on every data-model, provider or tracking change and at least annually.
3. Record the privacy-notice version accepted or presented at account creation when required by the chosen lawful basis and evidence model.
4. Add CI checks ensuring privacy routes exist, legal links remain visible and unapproved trackers are absent.

## Publication blockers

- Legal controller identity and contact details are not yet supplied.
- Final lawful-basis choices require qualified Dutch/EU privacy review.
- Retention periods, processor agreements and international transfer facts have not yet been evidenced.
- The current exchange-board prototype lacks the moderation and dedicated-data controls required for a public community launch.

Official reference points: European Commission GDPR guidance and individual-rights guidance; Dutch Autoriteit Persoonsgegevens guidance. Final notices must be reviewed as legal documents rather than generated from this engineering plan alone.
