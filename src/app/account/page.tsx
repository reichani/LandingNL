import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "./actions";

export default async function AccountPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("first_name,city,university,membership").eq("id", user.id).maybeSingle();

  return (
    <main className="shell">
      <Link className="text-link" href="/">← Home</Link>
      <div style={{ height: 20 }} />
      <span className="eyebrow">ACCOUNT</span>
      <h1 className="title">Your LandingNL controls.</h1>
      <p className="subtitle">Profile, sharing and session controls stay with the student.</p>

      <section className="card stack">
        <div className="row"><strong>{profile?.first_name || user.user_metadata?.name || "Student"}</strong><span className="pill">{profile?.membership || "free"}</span></div>
        <span className="muted">{user.email}</span>
        {profile?.city ? <div className="row"><span>City</span><strong>{profile.city}</strong></div> : null}
        {profile?.university ? <div className="row"><span>Study</span><strong>{profile.university}</strong></div> : null}
      </section>

      <div style={{ height: 16 }} />
      <section className="card stack">
        <Link className="secondary" href="/onboarding">Update personal setup</Link>
        <Link className="secondary" href="/housing">Update housing readiness</Link>
        <Link className="secondary" href="/supporter">Trusted supporter access</Link>
      </section>

      <div style={{ height: 16 }} />
      <section className="card stack">
        <strong>Privacy boundary</strong>
        <span className="muted">LandingNL does not need to store your BSN number in the journey tracker. The supporter view excludes exact address, document contents and account controls.</span>
      </section>

      <div style={{ height: 16 }} />
      <form action={signOut}>
        <button className="secondary" type="submit">Sign out</button>
      </form>
    </main>
  );
}
