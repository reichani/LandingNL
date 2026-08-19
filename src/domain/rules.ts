export type RuleRisk = "low" | "medium" | "high" | "critical";

export type RegulatoryRule<T> = {
  key: string;
  value: T;
  unit?: string;
  jurisdiction: "NL";
  sourceAuthority: string;
  sourceUrl: string;
  effectiveFrom: string;
  effectiveTo?: string;
  lastVerifiedAt: string;
  risk: RuleRisk;
  requiresHumanApproval: boolean;
  affects: string[];
};

const duoEligibilityUrl = "https://duo.nl/particulier/student-finance-citizens-eu-eer-switzerland-or-uk/eligibility.jsp";
const duoCommon = {
  jurisdiction: "NL" as const,
  sourceAuthority: "DUO",
  sourceUrl: duoEligibilityUrl,
  effectiveFrom: "2026-01-01",
  lastVerifiedAt: "2026-08-19",
  risk: "critical" as const,
  requiresHumanApproval: true,
  affects: ["work-tracker", "duo-guidance", "notifications", "evidence-readiness"],
};

// These values are evidence/readiness indicators only. They must never be used as
// a complete eligibility engine: age, course, nationality/residence, employment
// history, income and other DUO conditions can all affect the decision.
export const ruleRegistry = {
  duoEuWorkerMonthlyHours: {
    ...duoCommon,
    key: "duo.eu_worker.monthly_hours",
    value: 32,
    unit: "paid_hours_per_month",
  } satisfies RegulatoryRule<number>,
  duoEuWorkerReviewAverageHours: {
    ...duoCommon,
    key: "duo.eu_worker.review_average_hours",
    value: 24,
    unit: "average_paid_hours_per_month",
  } satisfies RegulatoryRule<number>,
  duoEuWorkerReviewMonths: {
    ...duoCommon,
    key: "duo.eu_worker.review_months",
    value: 6,
    unit: "months_worked",
  } satisfies RegulatoryRule<number>,
  duoEuWorkerIncomeThreshold21Plus: {
    ...duoCommon,
    key: "duo.eu_worker.income_threshold_21_plus_2026",
    value: 700.75,
    unit: "eur_per_month",
  } satisfies RegulatoryRule<number>,
  duoEuWorkerIncomeThresholdUnder21: {
    ...duoCommon,
    key: "duo.eu_worker.income_threshold_under_21_2026",
    value: 173,
    unit: "eur_per_month",
  } satisfies RegulatoryRule<number>,
};

export function getRule<T>(rule: RegulatoryRule<T>): T {
  return rule.value;
}
