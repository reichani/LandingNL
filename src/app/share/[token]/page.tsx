import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

type Snapshot = {
  student_first_name?: string | null;
  city?: string | null;
  housing_status?: string | null;
  journey?: Array<{ task_key: string; status: string }>;
  shared_at?: string;
};

export default async function SupporterSnapshotPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  let snapshot: Snapshot | null = null;

  try {
    const supabase = await createClient();
    const { data } = await supabase.rpc("get_supporter_snapshot", { p_token: token });
    snapshot = (data as Snapshot | null) ?? null;
  } catch {
    snapshot = null;
  }

  if (!snapshot) {
    return (
      <main className="shell">
        <span className="eyebrow">LANDINGNL · TRUSTED SUPPORTER</span>
        <h1 className="title">This share link is no longer active.</h1>
        <p className="subtitle">The student may have revoked access or replaced the supporter link.</p>
        <Link className="secondary" href="/">About LandingNL</Link>
      </main>
    );
  }

  const tasks = Array.isArray(snapshot.journey) ? snapshot.journey : [];
  const firstName = snapshot.student_first_name || "Student";

  return (
    <main className="shell">
      <span className="eyebrow">READ-ONLY SUPPORTER VIEW</span>
      <h1 className="title">{firstName}’s landing snapshot.</h1>
      <p className="subtitle">This page is intentionally limited. You can see progress, but you cannot edit the student’s plan or access documents.</p>

      <section className="focus stack">
        <div className="row"><span className="pill">SHARED BY STUDENT</span><strong>Read only</strong></div>
        <h2 style={{ margin: 0, fontSize: 28 }}>{snapshot.city || "Netherlands"}</h2>
        <p style={{ margin: 0 }}>Housing: {snapshot.housing_status || "Not shared yet"}</p>
      </section>

      <div style={{ height: 16 }} />
      <section className="card stack">
        <strong>Journey progress</strong>
        {tasks.length > 0 ? tasks.map((task) => (
          <div className="row" key={task.task_key}>
            <span>{task.task_key.replaceAll("_", " ")}</span>
            <span className="pill">{task.status}</span>
          </div>
        )) : <span className="muted">No journey milestones have been shared yet.</span>}
      </section>

      <p className="muted" style={{ fontSize: 12 }}>Not shared here: exact address, document contents, account controls, private financial records, or Google account information.</p>
    </main>
  );
}
