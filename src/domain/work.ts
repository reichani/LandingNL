import { getRule, ruleRegistry } from "./rules";

export type WorkMonthStatus = "below-review-zone" | "review-zone" | "target-reached";

export type WorkMonthSummary = {
  paidHours: number;
  targetHours: number;
  remainingHours: number;
  status: WorkMonthStatus;
};

export function summarizeWorkMonth(
  paidHours: number,
  targetHours = getRule(ruleRegistry.duoEuWorkerMonthlyHours),
): WorkMonthSummary {
  const remainingHours = Math.max(0, targetHours - paidHours);

  let status: WorkMonthStatus = "below-review-zone";
  if (paidHours >= targetHours) status = "target-reached";
  else if (paidHours >= 24) status = "review-zone";

  return { paidHours, targetHours, remainingHours, status };
}
