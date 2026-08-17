import Link from "next/link";
import { GoogleSignInButton } from "./GoogleSignInButton";

const errorMessages: Record<string, string> = {
  missing_code: "Google didn’t return a sign-in code. Please try again.",
  oauth_callback: "We couldn’t finish signing you in. Please try again.",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;
  const error = params.error ? errorMessages[params.error] ?? "We couldn’t sign you in. Please try again." : null;

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
          <h1 className="hero-title">Pick up where you left off.</h1>
          <p className="hero-subtitle">Sign in once to save your personal landing plan and continue it on any device. Your progress stays under your control.</p>
          <div className="trust-row"><span>✓ Google sign-in</span><span>✓ Your data, your control</span><span>✓ Free account</span></div>
        </div>

        <section className="product-preview stack" aria-label="Sign in to LandingNL">
          <span className="pill">FREE ACCOUNT</span>
          <h2 style={{ marginBottom: 0 }}>Continue with Google</h2>
          <p>Use the Google account you want connected to your LandingNL profile.</p>
          <GoogleSignInButton />
          {error ? <div className="card" role="alert" style={{ color: "#8f2334" }}>{error}</div> : null}
          <div className="preview-steps">
            <div className="preview-step"><span>1</span><div><strong>Sign in</strong><small>Continue securely with Google</small></div></div>
            <div className="preview-step"><span>2</span><div><strong>60-second setup</strong><small>Tell us the essentials</small></div></div>
            <div className="preview-step"><span>3</span><div><strong>Get your plan</strong><small>Your next step stays clear</small></div></div>
          </div>
          <p style={{ fontSize: 12 }}>You can still browse essential guidance without creating an account.</p>
        </section>
      </section>
    </main>
  );
}
