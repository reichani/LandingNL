"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function GoogleSignInButton() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startGoogleSignIn() {
    if (pending) return;
    setPending(true);
    setError(null);

    try {
      const supabase = createClient();
      const redirectTo = `${window.location.origin}/auth/callback`;
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo },
      });

      if (oauthError) {
        console.error("google_oauth_start_failed", {
          name: oauthError.name,
          message: oauthError.message,
        });
        setError("Google sign-in couldn’t start. Please try again.");
        setPending(false);
      }
    } catch (startError) {
      console.error("google_oauth_browser_start_failed", startError);
      setError("Google sign-in couldn’t start. Please try again.");
      setPending(false);
    }
  }

  return (
    <div className="stack" data-auth-flow="browser-pkce-v1">
      <button
        className="button-primary"
        type="button"
        onClick={startGoogleSignIn}
        disabled={pending}
        aria-busy={pending}
      >
        {pending ? "Opening Google…" : "Continue with Google →"}
      </button>
      {error ? <div className="card" role="alert" style={{ color: "#8f2334" }}>{error}</div> : null}
    </div>
  );
}
