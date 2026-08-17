import Link from "next/link";
import { PrimaryNav } from "@/components/PrimaryNav";
import { summarizeWorkMonth } from "@/domain/work";
import { createClient } from "@/lib/supabase/server";

const EVIDENCE_TYPES = ["contract", "paid_hours", "payslip", "salary_bank"] as const;

function monthBounds(now = new Date()) {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  return {
    month: start.toISOString().slice(0, 10),
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

export default async function WorkPage() {
  const bounds = monthBounds();
  let signedIn = false;
  let paidHours = 0;
  let targetHours = 32;
  let applicationCount = 0;
  const evidence = new Set<string>();

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    signedIn = Boolean(user);

    if (user) {
      const [{ data: shifts }, { data: evidenceRows }, { data: ruleRows }, { count }] = await Promise.all([
        supabase.from("work_shifts").select("paid_hours").gte("shift_date", bounds.start).lt("shift_date", bounds.end),
        supabase.from("work_evidence").select("evidence_type").eq("month", bounds.month),
        supabase.from("rule_registry").select("value").eq("rule_key", "duo.eu_worker.monthly_hours").eq("status", "active").lte("effective_from", bounds.month).or(`effective_to.is.null,effective_to.gte.${bounds.month}`).order("version", { ascending: false }).limit(1),
        supabase.from("job_applications").select("id", { count: "exact", head: true }).eq("user_id", user.id),
      ]);

      paidHours = (shifts ?? []).reduce((sum, row) => sum + Number(row.paid_hours ?? 0), 0);
      (evidenceRows ?? []).forEach((row) => evidence.add(row.evidence_type));
      applicationCount = count ?? 0;
      const configured = ruleRows?.[0]?.value as { value?: number } | undefined;
      if (typeof configured?.value === "number") targetHours = configured.value;
    }
  } catch {
    // Work remains browsable in preview mode if auth/runtime config is unavailable.
  }

  if (paidHours > 0) evidence.add("paid_hours");
  const status = summarizeWorkMonth(paidHours, targetHours);
  const message = status.status === "target-reached"
    ? "Current configured threshold reached for this month. Keep your payslip and salary evidence ready."
    : `${status.remainingHours} more paid hours to reach the current configured threshold.`;
  const evidenceReady = EVIDENCE_TYPES.filter((type) => evidence.has(type)).length;

  return (
    <main className="shell">
      <span className="eyebrow">WORK JOURNEY</span>
      <h1 className="title">Build income. Keep evidence ready.</h1>
      <p className="subtitle">CV, applications, contract, monthly paid hours and DUO evidence stay in one flow.</p>

      {!signedIn ? (
        <section className="card stack">
          <div className="row"><strong>Preview mode</strong><span className="pill">NO ACCOUNT NEEDED</span></div>
          <p className="muted" style={{ margin: 0 }}>Explore the full work journey first. Sign in when you want to save applications, shifts and evidence.</p>
          <Link className="secondary" href="/login">Sign in with Google →</Link>
        </section>
      ) : null}

      <div style={{ height: 16 }} />
      <section className="focus stack">
        <div className="row"><span className="pill">DUO WORK STATUS</span><strong>{signedIn ? (status.status === "target-reached" ? "On track" : status.status === "review-zone" ? "Attention" : "Track hours") : "Preview"}</strong></div>
        <h2 style={{ fontSize: 34, margin: 0 }}>{paidHours} / {targetHours} paid hours</h2>
        <p style={{ margin: 0 }}>{message}</p>
        <Link className="primary" href={signedIn ? "/work/log-shift" : "/login"}>{signedIn ? "Log a shift →" : "Sign in to track →"}</Link>
        <p className="muted" style={{ margin: 0, fontSize: 12 }}>Guidance only. LandingNL reads the currently approved rule registry; DUO makes the eligibility decision.</p>
      </section>

      <div style={{ height: 16 }} />
      <section className="card stack">
        <div className="row"><strong>Student CV</strong><Link className="pill" href="/work/cv">Build CV</Link></div>
        <div className="row"><span>Applications</span><Link className="pill" href="/work/applications">{applicationCount} tracked</Link></div>
        <div className="row"><span>Employment contract</span><Link className="pill" href="/work/contract">Check contract</Link></div>
        <div className="row"><span>Employer pack</span><Link className="pill" href="/work/employer-pack">Open & share</Link></div>
      </section>

      <div style={{ height: 16 }} />
      <section className="card stack">
        <div className="row"><strong>Monthly evidence</strong><span className="pill">{evidenceReady}/{EVIDENCE_TYPES.length} ready</span></div>
        <div className="row"><span>{evidence.has("contract") ? "✓" : "○"} Employment contract</span><span className="muted">{evidence.has("contract") ? "Ready" : "Waiting"}</span></div>
        <div className="row"><span>{evidence.has("paid_hours") ? "✓" : "○"} Paid-hours record</span><span className="muted">{evidence.has("paid_hours") ? "Ready" : "Waiting"}</span></div>
        <div className="row"><span>{evidence.has("payslip") ? "✓" : "○"} Payslip</span><span className="muted">{evidence.has("payslip") ? "Ready" : "Waiting"}</span></div>
        <div className="row"><span>{evidence.has("salary_bank") ? "✓" : "○"} Salary bank evidence</span><span className="muted">{evidence.has("salary_bank") ? "Ready" : "Waiting"}</span></div>
      </section>

      <PrimaryNav active="Work" />
    </main>
  );
}
