import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { markEvidenceReady } from "./actions";

function monthBounds() {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  return {
    month: start.toISOString().slice(0, 10),
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

export default async function EvidencePage() {
  let signedIn = false;
  const ready = new Set<string>();
  const bounds = monthBounds();

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    signedIn = Boolean(user);
    if (user) {
      const [{ data: evidenceRows }, { data: shifts }] = await Promise.all([
        supabase.from("work_evidence").select("evidence_type,status").eq("user_id", user.id).eq("month", bounds.month),
        supabase.from("work_shifts").select("paid_hours").eq("user_id", user.id).gte("shift_date", bounds.start).lt("shift_date", bounds.end),
      ]);
      (evidenceRows ?? []).filter((row) => ["ready","verified"].includes(row.status)).forEach((row) => ready.add(row.evidence_type));
      const paidHours = (shifts ?? []).reduce((sum, row) => sum + Number(row.paid_hours ?? 0), 0);
      if (paidHours > 0) ready.add("paid_hours");
    }
  } catch {
    // Preview mode.
  }

  return (
    <main className="shell">
      <Link className="text-link" href="/work">← Work journey</Link>
      <div style={{ height: 20 }} />
      <span className="eyebrow">WORK · MONTHLY EVIDENCE</span>
      <h1 className="title">Keep the month evidence-ready.</h1>
      <p className="subtitle">A readiness tracker, not an eligibility decision. Keep the underlying official documents yourself.</p>

      <section className="focus stack">
        <div className="row"><span className="pill">{bounds.month.slice(0,7)}</span><strong>{ready.size}/4 recorded</strong></div>
        <h2 style={{ margin: 0, fontSize: 28 }}>Contract · hours · payslip · salary</h2>
        <p style={{ margin: 0 }}>LandingNL keeps these evidence categories visible together so missing proof is noticed early.</p>
      </section>

      <div style={{ height: 16 }} />
      <section className="card stack">
        <div className="row"><span>{ready.has("contract") ? "✓" : "○"} Employment contract</span><span className="muted">Managed in Contract Check</span></div>
        <div className="row"><span>{ready.has("paid_hours") ? "✓" : "○"} Paid-hours record</span><span className="muted">Derived from logged shifts</span></div>
        {(["payslip", "salary_bank"] as const).map((type) => {
          const label = type === "payslip" ? "Payslip" : "Salary bank evidence";
          const isReady = ready.has(type);
          return (
            <form className="row" action={markEvidenceReady} key={type}>
              <input type="hidden" name="evidence_type" value={type} />
              <span>{isReady ? "✓" : "○"} {label}</span>
              {signedIn ? <button className="pill" type="submit">{isReady ? "Ready" : "Mark ready"}</button> : <span className="pill">Preview</span>}
            </form>
          );
        })}
      </section>

      {!signedIn ? <Link className="primary" href="/login">Sign in to save evidence →</Link> : null}
      <p className="muted" style={{ fontSize: 12 }}>Do not treat this checklist as a substitute for official DUO instructions or document requirements.</p>
    </main>
  );
}
