import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { saveContract } from "./actions";

type Contract = {
  id: string;
  employer_name: string | null;
  role_title: string | null;
  contract_type: string | null;
  start_date: string | null;
  contracted_hours_weekly: number | string | null;
  gross_hourly_wage_eur: number | string | null;
  work_location: string | null;
  pay_frequency: string | null;
  employee_signed: boolean;
  employer_signed: boolean;
};

export default async function ContractCheckPage() {
  let signedIn = false;
  let contract: Contract | null = null;

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    signedIn = Boolean(user);
    if (user) {
      const { data } = await supabase
        .from("employment_contracts")
        .select("id,employer_name,role_title,contract_type,start_date,contracted_hours_weekly,gross_hourly_wage_eur,work_location,pay_frequency,employee_signed,employer_signed")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      contract = data as Contract | null;
    }
  } catch {
    // Preview mode.
  }

  const checks = [
    Boolean(contract?.employer_name),
    Boolean(contract?.start_date),
    Boolean(contract?.contract_type),
    Number(contract?.contracted_hours_weekly ?? 0) > 0,
    Number(contract?.gross_hourly_wage_eur ?? 0) > 0,
    Boolean(contract?.role_title),
    Boolean(contract?.work_location),
    Boolean(contract?.pay_frequency),
    Boolean(contract?.employee_signed && contract?.employer_signed),
  ];
  const checked = checks.filter(Boolean).length;

  return (
    <main className="shell">
      <Link className="text-link" href="/work">← Work journey</Link>
      <div style={{ height: 20 }} />
      <span className="eyebrow">WORK · CONTRACT CHECK</span>
      <h1 className="title">Check before you sign.</h1>
      <p className="subtitle">Evidence-readiness check only. LandingNL does not determine whether a contract is legally valid.</p>

      <section className="focus stack">
        <div className="row"><span className="pill">CONTRACT READINESS</span><strong>{checked} / {checks.length}</strong></div>
        <div className="progress-track"><div className="progress-fill" style={{ width: `${Math.round((checked / checks.length) * 100)}%` }} /></div>
        <p style={{ margin: 0 }}>Critical dates, working hours, wage and signatures should be clear before you rely on the contract for your work journey.</p>
      </section>

      <div style={{ height: 16 }} />
      <form className="card stack" action={saveContract}>
        <input type="hidden" name="contract_id" value={contract?.id ?? ""} />
        <label><strong>Employer legal name *</strong><input className="input" name="employer_name" required defaultValue={contract?.employer_name ?? ""} disabled={!signedIn} /></label>
        <label><strong>Role / title</strong><input className="input" name="role_title" defaultValue={contract?.role_title ?? ""} disabled={!signedIn} /></label>
        <label><strong>Contract type *</strong><input className="input" name="contract_type" required placeholder="e.g. fixed-term, on-call" defaultValue={contract?.contract_type ?? ""} disabled={!signedIn} /></label>
        <label><strong>Employment start date *</strong><input className="input" name="start_date" type="date" required defaultValue={contract?.start_date ?? ""} disabled={!signedIn} /></label>
        <div className="row">
          <label style={{ flex: 1 }}><strong>Weekly hours *</strong><input className="input" name="weekly_hours" type="number" min="0" step="0.5" required defaultValue={contract?.contracted_hours_weekly == null ? "" : String(contract.contracted_hours_weekly)} disabled={!signedIn} /></label>
          <label style={{ flex: 1 }}><strong>Gross hourly wage € *</strong><input className="input" name="gross_hourly_wage" type="number" min="0" step="0.01" required defaultValue={contract?.gross_hourly_wage_eur == null ? "" : String(contract.gross_hourly_wage_eur)} disabled={!signedIn} /></label>
        </div>
        <label><strong>Work location</strong><input className="input" name="work_location" defaultValue={contract?.work_location ?? ""} disabled={!signedIn} /></label>
        <label><strong>Pay frequency</strong><input className="input" name="pay_frequency" placeholder="e.g. monthly" defaultValue={contract?.pay_frequency ?? ""} disabled={!signedIn} /></label>
        <label className="row"><span>Employee signed</span><input name="employee_signed" type="checkbox" defaultChecked={contract?.employee_signed ?? false} disabled={!signedIn} /></label>
        <label className="row"><span>Employer signed</span><input name="employer_signed" type="checkbox" defaultChecked={contract?.employer_signed ?? false} disabled={!signedIn} /></label>
        {signedIn ? <button className="primary" type="submit">Save contract readiness →</button> : <Link className="primary" href="/login">Sign in to save →</Link>}
      </form>

      <div style={{ height: 16 }} />
      <section className="card stack">
        <strong>Why the start date matters</strong>
        <p style={{ margin: 0 }}>LandingNL can compare timing with the currently approved regulatory rule in the Rule Registry, but it must not promise DUO eligibility.</p>
        <p className="muted" style={{ margin: 0, fontSize: 12 }}>Rules are versioned and require human approval before active guidance uses them.</p>
      </section>
    </main>
  );
}
