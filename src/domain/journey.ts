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
  blocking: boolean;
  entitlement: Entitlement;
};

export function getNextAction(state: JourneyState): NextAction {
  if (!state.housingSecured) {
    return { id: "housing", title: "Secure a registrable address", description: "Housing unlocks your registration and real monthly budget.", blocking: true, entitlement: "guest" };
  }
  if (!state.municipalityComplete) {
    return { id: "municipality", title: "Register with your municipality", description: "Bring the documents surfaced in your Wallet.", blocking: true, entitlement: "guest" };
  }
  if (!state.bsnReceived) {
    return { id: "bsn", title: "Add your BSN", description: "Your BSN unlocks DigiD and the next setup steps.", blocking: true, entitlement: "free" };
  }
  if (!state.digidActive) {
    return { id: "digid", title: "Activate DigiD", description: "Set up secure access to Dutch government services.", blocking: true, entitlement: "free" };
  }
  if (!state.cvCreated) {
    return { id: "cv", title: "Build your student CV", description: "Create a one-page CV and get ready for part-time applications.", blocking: false, entitlement: "free" };
  }
  if (!state.contractSigned) {
    return { id: "work", title: "Find your first part-time role", description: "Track applications and save your contract when you sign.", blocking: false, entitlement: "free" };
  }
  return { id: "hours", title: "Track this month’s paid hours", description: "Keep your work evidence and monthly total current.", blocking: false, entitlement: "free" };
}
