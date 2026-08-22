# ADR 0006: Runtime release identity and privacy publication gates

- Status: accepted
- Date: 2026-08-22

## Decision

Bind Cloudflare Worker version metadata as `CF_VERSION_METADATA` and show `semantic release · truncated deployment ID` on every application page. The semantic release identifies the product change set; the Worker ID distinguishes every deployment, including a redeploy of the same source.

Treat privacy/GDPR publication as a gated delivery programme. Do not publish a declaration of compliance or a final privacy notice until controller identity, processing inventory, lawful bases, processors/transfers, retention and data-subject-right workflows are evidenced and reviewed.

## Consequences

- Screenshots and incident reports identify the exact deployed Worker version.
- Cloudflare deployment IDs are operational metadata and do not replace GitHub commits, release notes or rollback records.
- D1 state is not rolled back with a Worker version and must continue to use reviewed migrations.
- Legal pages can be drafted in parallel, but public claims remain blocked by the items in `docs/PRIVACY_GDPR_PLAN.md`.

## Rollback

Remove the metadata binding and restore static labels. This does not affect D1 or authentication data. Privacy gates remain applicable independently of the UI label.
