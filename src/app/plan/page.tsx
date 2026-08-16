import { PrimaryNav } from "@/components/PrimaryNav";

const steps = [
  ["Housing secured", "Done", "done"],
  ["Municipality registration", "Today", "active"],
  ["Receive BSN", "Next", "next"],
  ["Activate DigiD", "After BSN", "next"],
  ["Choose your bike", "Later this week", "next"],
  ["Create your CV", "Before job applications", "next"],
  ["Start part-time work", "Unlocks work-hour tracking", "next"],
  ["Apply for DUO", "When eligibility evidence is ready", "next"],
] as const;

export default function PlanPage() {
  return (
    <main className="shell">
      <span className="eyebrow">YOUR PLAN</span>
      <h1 className="title">What comes next.</h1>
      <p className="subtitle">Your plan stays calm: one active step, the rest waiting in order.</p>
      <section className="card stack">
        {steps.map(([title, meta, state]) => (
          <div className="timeline-item" key={title}>
            <span className={`status-dot ${state}`} aria-hidden="true" />
            <div style={{ flex: 1 }}>
              <strong>{title}</strong>
              <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>{meta}</div>
            </div>
            {state === "active" ? <span className="pill">NOW</span> : null}
          </div>
        ))}
      </section>
      <PrimaryNav active="Plan" />
    </main>
  );
}
