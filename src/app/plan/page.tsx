import Link from "next/link";
import { PrimaryNav } from "@/components/PrimaryNav";
import { createClient } from "@/lib/supabase/server";
import { completeJourneyTask } from "./actions";

type TaskRow = { task_key: string; status: string };

type Step = {
  key: string;
  title: string;
  description: string;
  href?: string;
  manuallyCompletable?: boolean;
};

const steps: Step[] = [
  { key: "housing", title: "Secure registrable housing", description: "A registrable address unlocks municipality registration.", href: "/onboarding" },
  { key: "municipality", title: "Register with your municipality", description: "Bring the task-specific documents shown in Wallet.", manuallyCompletable: true },
  { key: "bsn", title: "Receive your BSN", description: "Record only that it arrived; LandingNL does not need to store the BSN number.", manuallyCompletable: true },
  { key: "digid", title: "Activate DigiD", description: "Secure access to Dutch government services.", manuallyCompletable: true },
  { key: "cv", title: "Create your student CV", description: "Prepare for part-time applications.", href: "/work/cv" },
  { key: "contract", title: "Start part-time work", description: "Check the contract and keep employment evidence ready.", href: "/work/contract" },
  { key: "duo", title: "Prepare DUO evidence", description: "Track paid hours and monthly evidence readiness before applying.", href: "/work" },
];

export default async function PlanPage() {
  let signedIn = false;
  let housingSecured = false;
  let taskRows: TaskRow[] = [];

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    signedIn = Boolean(user);
    if (user) {
      const [{ data: housing }, { data: tasks }] = await Promise.all([
        supabase.from("housing_profiles").select("housing_status").eq("user_id", user.id).maybeSingle(),
        supabase.from("journey_tasks").select("task_key,status").eq("user_id", user.id),
      ]);
      housingSecured = housing?.housing_status === "secured";
      taskRows = (tasks ?? []) as TaskRow[];
    }
  } catch {
    // Show a useful preview when the data layer is unavailable.
  }

  const completed = new Set(taskRows.filter((row) => row.status === "completed").map((row) => row.task_key));
  if (housingSecured) completed.add("housing");
  const activeIndex = steps.findIndex((step) => !completed.has(step.key));

  return (
    <main className="shell">
      <span className="eyebrow">YOUR PLAN</span>
      <h1 className="title">What comes next.</h1>
      <p className="subtitle">Dependencies first. One active step now; everything else waits until it becomes useful.</p>

      {!signedIn ? (
        <section className="focus stack">
          <span className="pill">PREVIEW MODE</span>
          <h2 style={{ margin: 0 }}>Save progress with Google.</h2>
          <p style={{ margin: 0 }}>You can browse the journey without an account. Sign in only when you want LandingNL to remember completion.</p>
          <Link className="primary" href="/login">Continue with Google →</Link>
        </section>
      ) : null}

      <div style={{ height: 16 }} />
      <section className="card stack">
        {steps.map((step, index) => {
          const isDone = completed.has(step.key);
          const isActive = activeIndex === index;
          const isLocked = activeIndex >= 0 && index > activeIndex;
          const stateClass = isDone ? "done" : isActive ? "active" : "";
          const meta = isDone ? "Completed" : isActive ? "Do this now" : isLocked ? "Waits for earlier steps" : "Available";

          return (
            <div className="timeline-item" key={step.key}>
              <span className={`status-dot ${stateClass}`} aria-hidden="true" />
              <div style={{ flex: 1 }}>
                <strong>{step.title}</strong>
                <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>{step.description}</div>
                <div className="muted" style={{ fontSize: 12, marginTop: 5 }}>{meta}</div>
              </div>
              {isDone ? <span className="pill">DONE</span> : null}
              {isActive && signedIn && step.manuallyCompletable ? (
                <form action={completeJourneyTask}>
                  <input type="hidden" name="task_key" value={step.key} />
                  <button className="pill" type="submit">Mark done</button>
                </form>
              ) : null}
              {isActive && step.href ? <Link className="pill" href={step.href}>OPEN</Link> : null}
            </div>
          );
        })}
      </section>

      <p className="muted" style={{ fontSize: 12 }}>LandingNL stores milestone status, not sensitive identifiers such as your BSN number.</p>
      <PrimaryNav active="Plan" />
    </main>
  );
}
