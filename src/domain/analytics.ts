export const analyticsEvents = [
  "account_registered",
  "consent_updated",
  "onboarding_completed",
  "housing_search_started",
  "housing_secured",
  "municipality_completed",
  "bsn_received",
  "digid_activated",
  "cv_created",
  "job_application_sent",
  "contract_signed",
  "shift_logged",
  "payslip_received",
  "duo_applied",
  "community_joined",
  "activity_created",
  "activity_joined",
  "exchange_completed",
] as const;

export type AnalyticsEvent = (typeof analyticsEvents)[number];

export type AnalyticsPayload = {
  event: AnalyticsEvent;
  anonymousUserId: string;
  occurredAt: string;
  properties?: Record<string, string | number | boolean | null>;
};

// Do not place names, email addresses, document contents or exact home addresses here.
export function createAnalyticsEvent(input: AnalyticsPayload): AnalyticsPayload {
  return input;
}
