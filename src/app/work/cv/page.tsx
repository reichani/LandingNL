import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CVEditor } from "./CVEditor";
import type { CVInput } from "./actions";

export default async function CVWizardPage() {
  let signedIn = false;
  let initial: CVInput = {
    name: "",
    city: "",
    education: "",
    languages: "",
    strengths: "",
    availability: "",
    experience: "",
  };

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    signedIn = Boolean(user);
    if (user) {
      const [{ data: profile }, { data: cv }] = await Promise.all([
        supabase.from("profiles").select("first_name,city,university").eq("id", user.id).maybeSingle(),
        supabase.from("student_cvs").select("name,city,education,languages,strengths,availability,experience").eq("user_id", user.id).maybeSingle(),
      ]);
      initial = {
        name: cv?.name ?? profile?.first_name ?? user.user_metadata?.name ?? "",
        city: cv?.city ?? profile?.city ?? "",
        education: cv?.education ?? profile?.university ?? "",
        languages: cv?.languages ?? "",
        strengths: cv?.strengths ?? "",
        availability: cv?.availability ?? "",
        experience: cv?.experience ?? "",
      };
    }
  } catch {
    // Empty preview is safer than inventing personal CV facts.
  }

  return (
    <main className="shell">
      <Link className="text-link" href="/work">← Work journey</Link>
      <div style={{ height: 20 }} />
      {!signedIn ? <div className="card"><span className="muted">Preview the CV builder now. <Link className="text-link" href="/login">Sign in with Google</Link> to save it.</span></div> : null}
      <div style={{ height: 16 }} />
      <CVEditor initial={initial} signedIn={signedIn} />
    </main>
  );
}
