import Link from "next/link";

const errorMessages: Record<string, string> = {
  oauth_start: "Google sign-in could not start. Check the Supabase Google provider configuration.",
  supabase_config: "LandingNL cannot reach Supabase yet. Check the Cloudflare runtime environment values.",
  missing_code: "Google did not return a sign-in code. Please try again.",
  oauth_callback: "The Google session could not be completed. Check the allowed redirect URLs.",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;
  const error = params.error ? errorMessages[params.error] ?? "Sign-in could not be completed." : null;

  return (
    <main className="marketing-shell">
      <header className="landing-header">
        <Link className="brand" href="/"><span className="brand-mark">L</span><span>LandingNL</span></Link>
        <div />
        <Link className="header-cta" href="/">Back home</Link>
      </header>

      <section className="hero-grid">
        <div className="hero-copy">
          <span className="eyebrow">SAVE YOUR MOVE</span>
          <h1 className="hero-title">Your plan should follow you.</h1>
          <p className="hero-subtitle">Create a free account only when you want to save progress. Your Plan, Money, Wallet, Work evidence and trusted-supporter settings stay under your control.</p>
          <div className="trust-row"><span>✓ Google sign-in</span><span>✓ Student-owned records</span><span>✓ No parent account</span></div>
        </div>

        <section className="product-preview stack" aria-label="Sign in to LandingNL">
          <span className="pill">FREE ACCOUNT</span>
          <h2 style={{ marginBottom: 0 }}>Continue with Google</h2>
          <p>Use the Google account you want connected to your LandingNL student profile.</p>
          <a className="button-primary" href="/auth/google?next=/onboarding">Continue with Google →</a>
          {error ? <div className="card" role="alert" style={{ color: "#8f2334" }}>{error}</div> : null}
          <div className="preview-steps">
            <div className="preview-step"><span>1</span><div><strong>Sign in</strong><small>Supabase OAuth</small></div></div>
            <div className="preview-step"><span>2</span><div><strong>60-second setup</strong><small>Build your personal plan</small></div></div>
            <div className="preview-step"><span>3</span><div><strong>Keep progress</strong><small>Plan · Money · Wallet · Work</small></div></div>
          </div>
          <p style={{ fontSize: 12 }}>Urgent public-service guidance remains browsable without creating an account.</p>
        </section>
      </section>
    </main>
  );
}
