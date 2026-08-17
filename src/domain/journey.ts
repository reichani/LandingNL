export type Entitlement = "guest" | "free" | "plus";

export type JourneyEvent =
  | "housing_search_started"
  | "housing_secured"
  | "municipality_completed"
  | "bsn_received"
  | "digid_activated"
  | "bike_selected"
  | "cv_created"
  | "job_application_sent"
  | "job_offer_received"
  | "contract_signed"
  | "shift_logged"
  | "payslip_received"
  | "duo_applied"
  | "duo_approved";

export type JourneyState = {
  housingSecured: boolean;
  municipalityComplete: boolean;
  bsnReceived: boolean;
  digidActive: boolean;
  cvCreated: boolean;
  contractSigned: boolean;
  paidHoursThisMonth: number;
  duoApplied: boolean;
};

export type NextAction = {
  id: string;
  title: string;
  description: string;
  href: string;
  cta: string;
  blocking: boolean;
  entitlement: Entitlement;
};

export function getNextAction(state: JourneyState): NextAction {
  if (!state.housingSecured) {
    return { id: "housing", title: "Secure a registrable address", description: "Housing unlocks your registration and real monthly budget.", href: "/housing", cta: "Open housing →", blocking: true, entitlement: "guest" };
  }
  if (!state.municipalityComplete) {
    return { id: "municipality", title: "Register with your municipality", description: "Bring the documents surfaced in your Wallet.", href: "/plan", cta: "Open registration task →", blocking: true, entitlement: "guest" };
  }
  if (!state.bsnReceived) {
    return { id: "bsn", title: "Mark your BSN as received", description: "You never need to store the number here. Marking the milestone unlocks DigiD and the next setup steps.", href: "/plan", cta: "Update milestone →", blocking: true, entitlement: "free" };
  }
  if (!state.digidActive) {
    return { id: "digid", title: "Activate DigiD", description: "Set up secure access to Dutch government services.", href: "/plan", cta: "Open DigiD step →", blocking: true, entitlement: "free" };
  }
  if (!state.cvCreated) {
    return { id: "cv", title: "Build your student CV", description: "Create a one-page CV and get ready for part-time applications.", href: "/work/cv", cta: "Build my CV →", blocking: false, entitlement: "free" };
  }
  if (!state.contractSigned) {
    return { id: "work", title: "Find your first part-time role", description: "Track applications and save your contract when you sign.", href: "/work/applications", cta: "Open applications →", blocking: false, entitlement: "free" };
  }
  return { id: "hours", title: "Track this month’s paid hours", description: "Keep your work evidence and monthly total current.", href: "/work/log-shift", cta: "Log paid hours →", blocking: false, entitlement: "free" };
}
