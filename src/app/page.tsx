import Link from "next/link";
import { PrimaryNav } from "@/components/PrimaryNav";
import { getNextAction, type JourneyState } from "@/domain/journey";
import { createClient } from "@/lib/supabase/server";

type HomeProfile = { first_name: string | null; city: string | null };
type HousingProfile = { housing_status: string | null; monthly_rent_eur: number | null };

const features = [
  ["Plan", "Housing → municipality → BSN → DigiD in the right dependency order.", "/plan", "LIVE"],
  ["Money", "A clear monthly landing-cost view for housing, daily life and recurring costs.", "/money", "LIVE"],
  ["Wallet", "Only the documents connected to the task in front of you.", "/wallet", "LIVE"],
  ["Work + DUO", "CV, contract, employer pack, paid hours and evidence readiness in one flow.", "/work", "LIVE"],
  ["60-second setup", "City, university, citizenship, arrival date and housing status personalise the journey.", "/onboarding", "LIVE"],
  ["Trusted supporter", "One read-only supporter, controlled and revocable by the student.", "/supporter", "NEXT"],
] as const;

export default async function HomePage() {
  let userId: string | null = null;
  let firstName: string | null = null;
  let city: string | null = null;
  let housing: HousingProfile | null = null;

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    userId = user?.id ?? null;
    if (user) {
      const [{ data: profile }, { data: housingProfile }] = await Promise.all([
        supabase.from("profiles").select("first_name,city").eq("id", user.id).maybeSingle<HomeProfile>(),
        supabase.from("housing_profiles").select("housing_status,monthly_rent_eur").eq("user_id", user.id).maybeSingle<HousingProfile>(),
      ]);
      firstName = profile?.first_name ?? user.user_metadata?.given_name ?? user.user_metadata?.name ?? null;
      city = profile?.city ?? null;
      housing = housingProfile ?? null;
    }
  } catch {
    // Public homepage must remain available if auth/data is temporarily unavailable.
  }

  if (!userId) {
    return (
      <main className="marketing-shell">
        <header className="landing-header">
          <Link className="brand" href="/"><span className="brand-mark">L</span><span>LandingNL</span></Link>
          <nav className="desktop-links" aria-label="Public navigation">
            <a href="#features">Features</a><a href="#how">How it works</a><a href="#work">Work & DUO</a>
          </nav>
          <Link className="header-cta" href="/login">Sign in</Link>
        </header>

        <section className="hero-grid">
          <div className="hero-copy">
            <span className="eyebrow">THE STUDENT LANDING OS FOR THE NETHERLANDS</span>
            <h1 className="hero-title">Your move, in the right order.</h1>
            <p className="hero-subtitle">LandingNL turns housing, registration, money, documents and part-time work into one calm plan — so you always know what matters now and what unlocks next.</p>
            <div className="hero-actions">
              <Link className="button-primary" href="/login">Continue with Google →</Link>
              <a className="button-secondary" href="#features">Explore features</a>
            </div>
            <div className="trust-row"><span>✓ One primary action</span><span>✓ Urgent public-service guidance stays visible</span><span>✓ Student-controlled data</span></div>
          </div>

          <aside className="product-preview" aria-label="LandingNL journey preview">
            <div className="preview-topline"><span>YOUR NEXT ACTION</span><span className="preview-status">Personalised</span></div>
            <h2>Register with your municipality</h2>
            <p>Housing is ready. Registration is the next dependency before BSN and DigiD.</p>
            <div className="preview-steps">
              <div className="preview-step done"><span>✓</span><div><strong>Housing</strong><small>Secured</small></div></div>
              <div className="preview-step active"><span>2</span><div><strong>Municipality</strong><small>Do this now</small></div></div>
              <div className="preview-step"><span>3</span><div><strong>BSN</strong><small>Unlocks next</small></div></div>
              <div className="preview-step"><span>4</span><div><strong>DigiD</strong><small>After BSN</small></div></div>
            </div>
          </aside>
        </section>

        <section className="proof-strip">
          <div><strong>One move</strong><span>From arrival to settled</span></div>
          <div><strong>One source of truth</strong><span>Tasks, documents and money aligned</span></div>
          <div><strong>One next action</strong><span>No overwhelming master checklist</span></div>
        </section>

        <section className="marketing-section" id="features">
          <div className="section-heading"><span className="eyebrow">CORE FEATURES</span><h2>Everything important, connected.</h2><p>The MVP is organised around the real dependencies of an international student landing in the Netherlands.</p></div>
          <div className="feature-grid">
            {features.map(([title, copy, href, state], index) => (
              <Link className="feature-card" href={href} key={title}>
                <div className="feature-card-top"><span className="feature-number">0{index + 1}</span><span className={`feature-badge ${state === "NEXT" ? "next" : ""}`}>{state}</span></div>
                <h3>{title}</h3><p>{copy}</p><span className="feature-link">Open journey →</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="marketing-section how-panel" id="how">
          <div className="section-heading compact"><span className="eyebrow">HOW IT WORKS</span><h2>60 seconds in. A living plan out.</h2></div>
          <div className="how-grid">
            <div><span className="how-number">1</span><h3>Tell us the essentials</h3><p>City, university, citizenship, arrival date and housing status.</p></div>
            <div><span className="how-number">2</span><h3>We order dependencies</h3><p>Housing, municipality, BSN, DigiD, work and funding milestones stay connected.</p></div>
            <div><span className="how-number">3</span><h3>You act on one thing</h3><p>Home surfaces one primary action while Plan, Wallet, Money and Work remain aligned.</p></div>
          </div>
        </section>

        <section className="marketing-section work-spotlight" id="work">
          <div><span className="eyebrow light">WORK + DUO</span><h2>Part-time work changes the landing plan.</h2><p>CV, contract, employer pack, paid hours and evidence readiness belong in one journey — not separate spreadsheets.</p><Link className="button-light" href="/work">Explore Work →</Link></div>
          <div className="work-checklist"><div><span>01</span><strong>Build student CV</strong></div><div><span>02</span><strong>Check contract</strong></div><div><span>03</span><strong>Share employer pack</strong></div><div><span>04</span><strong>Log paid hours</strong></div><div><span>05</span><strong>Keep evidence ready</strong></div></div>
        </section>

        <section className="final-cta"><span className="eyebrow">START WITH YOUR REAL MOVE</span><h2>Less searching. Less guessing. One landing plan.</h2><p>Create an account when you want to save progress; urgent public-service guidance remains accessible.</p><div className="hero-actions centered"><Link className="button-primary" href="/login">Continue with Google →</Link><Link className="button-secondary" href="/onboarding">Preview setup</Link></div></section>
        <footer className="landing-footer"><strong>LandingNL</strong><span>Guidance only · official authorities make eligibility decisions.</span></footer>
      </main>
    );
  }

  const journeyState: JourneyState = {
    housingSecured: housing?.housing_status === "secured",
    municipalityComplete: false,
    bsnReceived: false,
    digidActive: false,
    cvCreated: false,
    contractSigned: false,
    paidHoursThisMonth: 0,
    duoApplied: false,
  };
  const next = getNextAction(journeyState);
  const displayName = firstName || "there";
  const displayCity = city || "Netherlands";
  const rent = housing?.monthly_rent_eur;

  return (
    <main className="dashboard-shell">
      <header className="dashboard-header"><div><span className="eyebrow">LANDINGNL · HOME</span><h1>Hi {displayName}. You know what comes next.</h1><p>{displayCity} · your plan changes as your real-world status changes.</p></div><Link className="dashboard-profile" href="/onboarding">Update setup</Link></header>
      <section className="dashboard-hero"><div className="dashboard-focus"><span className="pill">TODAY · PRIMARY FOCUS</span><p className="kicker">Your next action</p><h2>{next.title}</h2><p>{next.description}</p><Link className="button-primary wide" href="/plan">Open today’s task →</Link></div><div className="status-panel"><span className="eyebrow">MOVE STATUS</span><div className="status-line"><span>Housing</span><strong>{journeyState.housingSecured ? "Secured ✓" : "Needs attention"}</strong></div><div className="status-line"><span>City</span><strong>{displayCity}</strong></div>{typeof rent === "number" ? <div className="status-line"><span>Rent</span><strong>€{rent.toLocaleString("en-NL")} / mo</strong></div> : null}<Link className="text-link" href="/onboarding">Edit setup →</Link></div></section>
      <section className="dashboard-grid">{features.slice(0,4).map(([title, copy, href]) => <Link className="dashboard-card" href={href} key={title}><span className="eyebrow">{title}</span><h3>{title === "Plan" ? next.title : title}</h3><p>{copy}</p><span className="text-link">Open →</span></Link>)}</section>
      <section className="supporter-banner"><div><span className="eyebrow">TRUSTED SUPPORTER</span><h3>Share progress without creating a parent account.</h3><p>One read-only supporter. Student-controlled. Revoke access at any time.</p></div><Link className="button-secondary" href="/supporter">Set up supporter →</Link></section>
      <PrimaryNav active="Home" />
    </main>
  );
}
