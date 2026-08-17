export default function LoginPage() {
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
      <a className="primary" href="/auth/google?next=/onboarding" style={{ display: "block", textAlign: "center" }}>
        Continue with Google
      </a>
      <p className="muted" style={{ fontSize: 12, textAlign: "center" }}>No hard paywall on urgent government steps.</p>
    </main>
  );
}
