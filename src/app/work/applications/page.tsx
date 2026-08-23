import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { addApplication } from "./actions";

type Application = {
  id: string;
  employer_name: string;
  role_title: string;
  status: string;
  applied_at: string | null;
};

export default async function ApplicationsPage() {
  let signedIn = false;
  let applications: Application[] = [];

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    signedIn = Boolean(user);
    if (user) {
      const { data } = await supabase.from("job_applications").select("id,employer_name,role_title,status,applied_at").eq("user_id", user.id).order("created_at", { ascending: false });
      applications = (data ?? []) as Application[];
    }
  } catch {
    // Preview mode.
  }

  return (
    <main className="shell">
      <Link className="text-link" href="/work">← Work journey</Link>
      <div style={{ height: 20 }} />
      <span className="eyebrow">WORK · APPLICATIONS</span>
      <h1 className="title">Keep the search light.</h1>
      <p className="subtitle">Track only what helps you act: employer, role and stage. No oversized recruitment CRM.</p>

      <section className="focus stack">
        <div className="row"><span className="pill">APPLICATION PIPELINE</span><strong>{applications.length} roles</strong></div>
        <h2 style={{ margin: 0, fontSize: 30 }}>{applications.filter((item) => ["applied","interview","offer"].includes(item.status)).length} active</h2>
        <p style={{ margin: 0 }}>Use this alongside your CV and contract journey.</p>
      </section>

      <div style={{ height: 16 }} />
      <form className="card stack" action={addApplication}>
        <strong>Add a role</strong>
        <input className="input" name="employer_name" placeholder="Employer" required disabled={!signedIn} />
        <input className="input" name="role_title" placeholder="Role title" required disabled={!signedIn} />
        <select className="input" name="status" defaultValue="planned" disabled={!signedIn}>
          <option value="planned">Planned</option>
          <option value="applied">Applied</option>
          <option value="interview">Interview</option>
          <option value="offer">Offer</option>
          <option value="rejected">Rejected</option>
          <option value="withdrawn">Withdrawn</option>
        </select>
        {signedIn ? <button className="primary" type="submit">Add application →</button> : <Link className="primary" href="/login">Sign in to track →</Link>}
      </form>

      <div style={{ height: 16 }} />
      <section className="card stack">
        <div className="row"><strong>Your roles</strong><span className="pill">{applications.length}</span></div>
        {applications.length ? applications.map((application) => (
          <div className="row" key={application.id}>
            <div><strong>{application.role_title}</strong><div className="muted" style={{ fontSize: 13, marginTop: 4 }}>{application.employer_name}{application.applied_at ? ` · ${application.applied_at}` : ""}</div></div>
            <span className="pill">{application.status.toUpperCase()}</span>
          </div>
        )) : <span className="muted">No applications tracked yet.</span>}
      </section>
    </main>
  );
}
