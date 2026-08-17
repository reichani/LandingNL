import type { BudgetItem, MeData } from "./types";

export type Action = {
  id: string;
  label: string;
  title: string;
  description: string;
  href: string;
  cta: string;
};

function completed(me: MeData, key: string) {
  return me.milestones.some((item) => item.milestone_key === key && item.status === "completed");
}

function budgetHas(items: BudgetItem[], key: string) {
  return items.some((item) => item.item_key === key && Number(item.amount_cents) > 0);
}

export function nextAction(me: MeData): Action {
  if (me.profile?.housing_status !== "secured") {
    return {
      id: "housing",
      label: "LANDING BASICS",
      title: "Find a registrable place",
      description: "A registrable home unlocks municipality registration and makes your real monthly budget possible.",
      href: "/app/plan",
      cta: "Open housing step",
    };
  }
  if (!completed(me, "municipality")) {
    return {
      id: "municipality",
      label: "REGISTRATION",
      title: "Prepare municipality registration",
      description: "Keep the right documents together and mark this step done after your appointment.",
      href: "/app/plan",
      cta: "Open registration step",
    };
  }
  if (!completed(me, "bsn")) {
    return {
      id: "bsn",
      label: "REGISTRATION",
      title: "Mark your BSN as received",
      description: "LandingNL never needs the number itself. The milestone is enough to unlock your next steps.",
      href: "/app/plan",
      cta: "Update milestone",
    };
  }
  if (!completed(me, "digid")) {
    return {
      id: "digid",
      label: "GOVERNMENT ACCESS",
      title: "Activate DigiD",
      description: "Set up secure access to Dutch government services after your BSN is ready.",
      href: "/app/plan",
      cta: "Open DigiD step",
    };
  }
  if (!completed(me, "cv")) {
    return {
      id: "cv",
      label: "WORK",
      title: "Get your student CV ready",
      description: "A simple one-page CV is the fastest way to make part-time applications easier.",
      href: "/app/work",
      cta: "Open Work",
    };
  }
  if (!completed(me, "contract")) {
    return {
      id: "contract",
      label: "WORK",
      title: "Move your job search forward",
      description: "Track applications now; when you get an offer, keep the contract milestone in the same flow.",
      href: "/app/work",
      cta: "Open applications",
    };
  }
  return {
    id: "hours",
    label: "WORK",
    title: "Keep this month’s work evidence current",
    description: "Update paid hours and keep payslip and salary evidence together when they arrive.",
    href: "/app/work",
    cta: "Update work evidence",
  };
}

export function weeklyFocus(me: MeData, primaryHref: string): Action[] {
  const candidates: Action[] = [];
  const daysToArrival = me.profile?.arrival_date
    ? Math.ceil((new Date(`${me.profile.arrival_date}T12:00:00`).getTime() - Date.now()) / 86400000)
    : null;

  if (daysToArrival != null && daysToArrival >= 0 && daysToArrival <= 14) {
    candidates.push({
      id: "arrival",
      label: "ARRIVAL",
      title: "Keep arrival documents together",
      description: "Passport, housing proof and appointment confirmation should be easy to reach on arrival week.",
      href: "/app/plan",
      cta: "See what to keep ready",
    });
  }
  if (!budgetHas(me.budget, "rent") || !budgetHas(me.budget, "food")) {
    candidates.push({
      id: "budget",
      label: "MONEY",
      title: "Set a realistic monthly ceiling",
      description: "Add rent and core living costs once, then use the total as your planning baseline.",
      href: "/app/money",
      cta: "Set monthly budget",
    });
  }
  if (me.applicationCount === 0 && completed(me, "digid")) {
    candidates.push({
      id: "applications",
      label: "WORK",
      title: "Save your first job lead",
      description: "A tiny application tracker keeps the search moving without a spreadsheet.",
      href: "/app/work",
      cta: "Open Work",
    });
  }
  candidates.push({
    id: "circle",
    label: "CIRCLE",
    title: "See what students nearby can share",
    description: "Ask, offer or pass something on without turning LandingNL into a noisy social feed.",
    href: "/app/circle",
    cta: "Open Circle",
  });

  const unique = candidates.filter((item, index, all) => item.href !== primaryHref && all.findIndex((other) => other.href === item.href) === index);
  return unique.slice(0, 2);
}
