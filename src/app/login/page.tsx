"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function continueWithGoogle() {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const redirectTo = `${window.location.origin}/auth/callback?next=/onboarding`;
      const { error: signInError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo },
      });
      if (signInError) setError(signInError.message);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to start sign in.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="shell">
      <span className="eyebrow">LANDINGNL</span>
      <h1 className="title">Save your move.</h1>
      <p className="subtitle">Create a free account after seeing the value. Keep your timeline, documents and money plan synced.</p>

      <section className="focus stack">
        <span className="pill">FREE ACCOUNT</span>
        <h2 style={{ margin: 0, fontSize: 26 }}>Your landing plan follows you.</h2>
        <p style={{ margin: 0 }}>Saved progress · personal timeline · basic budget · document wallet · CV wizard</p>
      </section>

      <div style={{ height: 18 }} />
      <button className="primary" disabled={loading} onClick={continueWithGoogle}>
        {loading ? "Opening Google…" : "Continue with Google"}
      </button>
      {error ? <p role="alert" className="muted">{error}</p> : null}
      <p className="muted" style={{ fontSize: 12, textAlign: "center" }}>No hard paywall on urgent government steps.</p>
    </main>
  );
}
