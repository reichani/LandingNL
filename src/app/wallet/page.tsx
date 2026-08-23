import Link from "next/link";
import { PrimaryNav } from "@/components/PrimaryNav";
import { createClient } from "@/lib/supabase/server";
import { toggleDocumentReady } from "./actions";

type ReadinessRow = { document_key: string; status: string };
type TaskRow = { task_key: string; status: string };

const labels: Record<string, string> = {
  passport: "Passport / EU ID",
  housing_proof: "Housing / address proof",
  appointment_confirmation: "Municipality appointment confirmation",
  bsn_confirmation: "BSN confirmation",
  employment_contract: "Employment contract",
  payslip: "Payslip",
  salary_evidence: "Salary bank evidence",
};

const municipalityDocs = ["passport", "housing_proof", "appointment_confirmation"];
const workDocs = ["employment_contract", "payslip", "salary_evidence"];

export default async function WalletPage() {
  let signedIn = false;
  let rows: ReadinessRow[] = [];
  let tasks: TaskRow[] = [];

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    signedIn = Boolean(user);
    if (user) {
      const [{ data: readiness }, { data: taskRows }] = await Promise.all([
        supabase.from("document_readiness").select("document_key,status").eq("user_id", user.id),
        supabase.from("journey_tasks").select("task_key,status").eq("user_id", user.id),
      ]);
      rows = (readiness ?? []) as ReadinessRow[];
      tasks = (taskRows ?? []) as TaskRow[];
    }
  } catch {
    // Preview remains visible if the data layer is unavailable.
  }

  const ready = new Set(rows.filter((row) => row.status === "ready").map((row) => row.document_key));
  const municipalityDone = tasks.some((task) => task.task_key === "municipality" && task.status === "completed");
  const currentDocs = municipalityDone ? workDocs : municipalityDocs;
  const currentTitle = municipalityDone ? "Prepare work evidence" : "Bring these to municipality registration";
  const readyCount = currentDocs.filter((key) => ready.has(key)).length;

  function readinessRow(key: string) {
    const isReady = ready.has(key);
    return (
      <form className="row" action={toggleDocumentReady} key={key}>
        <input type="hidden" name="document_key" value={key} />
        <span>{isReady ? "✓" : "○"} {labels[key]}</span>
        {signedIn ? <button className="pill" type="submit">{isReady ? "Ready" : "Mark ready"}</button> : <span className="pill">{isReady ? "Ready" : "Preview"}</span>}
      </form>
    );
  }

  return (
    <main className="shell">
      <span className="eyebrow">PLAN · WALLET</span>
      <h1 className="title">Bring the right things.</h1>
      <p className="subtitle">Wallet is task-linked readiness inside your Plan, not a giant document dump. File contents are not required for this MVP.</p>

      <section className="focus stack">
        <div className="row"><span className="pill">CURRENT TASK</span><strong>{readyCount}/{currentDocs.length} ready</strong></div>
        <h2 style={{ fontSize: 28, margin: 0 }}>{currentTitle}</h2>
        <div className="progress-track"><div className="progress-fill" style={{ width: `${Math.round((readyCount / currentDocs.length) * 100)}%` }} /></div>
      </section>

      <div style={{ height: 16 }} />
      <section className="card stack">
        <strong>{municipalityDone ? "Work documents" : "Municipality documents"}</strong>
        {currentDocs.map(readinessRow)}
      </section>

      <div style={{ height: 14 }} />
      <section className="card stack">
        <div className="row"><strong>Coming later in your journey</strong><span className="pill">DEPENDENCY-AWARE</span></div>
        {(municipalityDone ? municipalityDocs : workDocs).map((key) => (
          <div className="row" key={key}><span>{labels[key]}</span><span className="muted">{ready.has(key) ? "Ready" : "Waiting"}</span></div>
        ))}
      </section>

      {!signedIn ? <p className="muted" style={{ fontSize: 12 }}>Sign in to save readiness. You can browse the required documents without an account.</p> : <p className="muted" style={{ fontSize: 12 }}>Only readiness metadata is stored here. Exact document contents and exact home address are outside this MVP wallet.</p>}
      <Link className="text-link" href="/plan">See why these documents are needed →</Link>
      <PrimaryNav active="Plan" />
    </main>
  );
}
