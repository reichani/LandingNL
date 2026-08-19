import { getRule, ruleRegistry } from "./rules";

export type WorkMonthStatus = "below-review-zone" | "review-zone" | "standard-hours-indicator";

export type WorkMonthSummary = {
  paidHours: number;
  targetHours: number;
  reviewHours: number;
  remainingHours: number;
  status: WorkMonthStatus;
};

export function summarizeWorkMonth(
  paidHours: number,
  targetHours = getRule(ruleRegistry.duoEuWorkerMonthlyHours),
  reviewHours = getRule(ruleRegistry.duoEuWorkerReviewAverageHours),
): WorkMonthSummary {
  const remainingHours = Math.max(0, targetHours - paidHours);

  let status: WorkMonthStatus = "below-review-zone";
  if (paidHours >= targetHours) status = "standard-hours-indicator";
  else if (paidHours >= reviewHours) status = "review-zone";

  return { paidHours, targetHours, reviewHours, remainingHours, status };
}
