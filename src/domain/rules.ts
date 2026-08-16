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

// Seed values are intentionally versioned and must be reviewed before production use.
export const ruleRegistry = {
  duoEuWorkerMonthlyHours: {
    key: "duo.eu_worker.monthly_hours",
    value: 32,
    unit: "paid_hours_per_month",
    jurisdiction: "NL",
    sourceAuthority: "DUO",
    sourceUrl: "https://duo.nl/particulier/student-finance-citizens-eu-eer-switzerland-or-uk/eligibility.jsp",
    effectiveFrom: "2026-01-01",
    lastVerifiedAt: "2026-08-16",
    risk: "critical",
    requiresHumanApproval: true,
    affects: ["work-tracker", "duo-eligibility", "notifications", "evidence-readiness"],
  } satisfies RegulatoryRule<number>,
};

export function getRule<T>(rule: RegulatoryRule<T>): T {
  return rule.value;
}
