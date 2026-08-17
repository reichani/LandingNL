import type { JourneyState } from "@/domain/journey";

export type WeeklyFocusItem = {
  id: string;
  label: string;
  title: string;
  description: string;
  href: string;
  cta: string;
};

type WeeklyFocusInput = {
  state: JourneyState;
  arrivalDate: string | null;
  hasRent: boolean;
  primaryHref: string;
  now?: Date;
};

function daysUntil(date: string, now: Date) {
  const target = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(target.getTime())) return null;
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

export function getWeeklyFocus({ state, arrivalDate, hasRent, primaryHref, now = new Date() }: WeeklyFocusInput): WeeklyFocusItem[] {
  const candidates: WeeklyFocusItem[] = [];
  const arrivalDays = arrivalDate ? daysUntil(arrivalDate, now) : null;

  if (arrivalDays !== null && arrivalDays >= 0 && arrivalDays <= 7) {
    candidates.push({
      id: "arrival-week",
      label: "ARRIVAL WEEK",
      title: "Keep arrival essentials within reach",
      description: "ID, housing proof and appointment details are easier when they are together.",
      href: "/wallet",
      cta: "Check documents →",
    });
  } else if (arrivalDays !== null && arrivalDays > 7 && arrivalDays <= 30) {
    candidates.push({
      id: "before-arrival",
      label: "BEFORE ARRIVAL",
      title: "Use the quiet time before you travel",
      description: "Review what can be prepared now so arrival week stays light.",
      href: "/plan",
      cta: "Review the plan →",
    });
  } else if (arrivalDays !== null && arrivalDays < 0 && arrivalDays >= -14) {
    candidates.push({
      id: "first-two-weeks",
      label: "FIRST 2 WEEKS",
      title: "Keep your landing steps moving",
      description: "A quick check now helps registration, documents and money stay aligned.",
      href: "/plan",
      cta: "Review progress →",
    });
  }

  if (!state.housingSecured) {
    candidates.push({
      id: "budget-ceiling",
      label: "THIS WEEK",
      title: "Set a realistic monthly ceiling",
      description: "A simple budget makes housing choices easier before you commit.",
      href: "/money",
      cta: "Set my budget →",
    });
  } else if (!state.municipalityComplete) {
    candidates.push({
      id: "municipality-wallet",
      label: "KEEP READY",
      title: "Check your municipality documents",
      description: "Keep only the documents connected to registration ready for the appointment.",
      href: "/wallet",
      cta: "Check readiness →",
    });
  } else if (!state.bsnReceived || !state.digidActive) {
    candidates.push({
      id: "landing-budget",
      label: "THIS WEEK",
      title: hasRent ? "Keep your first-month budget current" : "Add your real housing cost",
      description: hasRent
        ? "A quick review keeps your monthly picture realistic while government steps move forward."
        : "Once rent is known, your monthly landing picture becomes much more useful.",
      href: "/money",
      cta: "Review money →",
    });
  } else if (!state.cvCreated) {
    candidates.push({
      id: "work-preview",
      label: "LOOK AHEAD",
      title: "See what the work journey needs next",
      description: "Applications, contract checks and evidence are already connected when you are ready.",
      href: "/work",
      cta: "Preview Work →",
    });
  } else if (!state.contractSigned) {
    candidates.push({
      id: "contract-ready",
      label: "KEEP READY",
      title: "Know what to check before you sign",
      description: "Keep hours, pay, dates and signatures visible before accepting a role.",
      href: "/work/contract",
      cta: "Open contract check →",
    });
  } else {
    candidates.push({
      id: "monthly-evidence",
      label: "THIS MONTH",
      title: "Keep work evidence together",
      description: "Paid hours, payslip and salary evidence are easier to manage before month-end.",
      href: "/work/evidence",
      cta: "Check evidence →",
    });
  }

  candidates.push({
    id: "money-check",
    label: "QUICK CHECK",
    title: hasRent ? "Is your monthly picture still right?" : "Build your monthly picture",
    description: hasRent
      ? "Review recurring costs when housing or work changes."
      : "Add your known costs now; refine them as your move becomes real.",
    href: "/money",
    cta: "Open Money →",
  });

  const seenHrefs = new Set<string>([primaryHref]);
  return candidates.filter((item) => {
    if (seenHrefs.has(item.href)) return false;
    seenHrefs.add(item.href);
    return true;
  }).slice(0, 2);
}
