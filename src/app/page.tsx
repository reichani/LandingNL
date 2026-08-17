import Link from "next/link";
import { PrimaryNav } from "@/components/PrimaryNav";
import { getNextAction, type JourneyState } from "@/domain/journey";
import { createClient } from "@/lib/supabase/server";

type HomeProfile = {
  first_name: string | null;
  city: string | null;
};

type HousingProfile = {
  housing_status: string | null;
  monthly_rent_eur: number | null;
};

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
    // Public LandingNL remains usable even if auth/data is temporarily unavailable.
  }

  if (!userId) {
    return (
      <main className="shell">
        <span className="eyebrow">LANDINGNL · STUDENT LANDING OS</span>
        <h1 className="title">Land in the Netherlands with a plan.</h1>
        <p className="subtitle">Housing, registration, money, documents and part-time work — one calm next action at a time.</p>

        <section className="focus stack">
          <span className="pill">60-SECOND SETUP</span>
          <h2 style={{ margin: 0, fontSize: 28 }}>Make the move yours.</h2>
          <p style={{ margin: 0 }}>Sign in with Google to save your timeline, document readiness, budget and work evidence.</p>
          <Link className="primary" href="/login">Continue with Google →</Link>
        </section>

        <div style={{ height: 16 }} />
        <section className="card stack">
          <div className="row"><strong>Arrival journey</strong><span className="pill">PLAN</span></div>
          <span className="muted">Housing → municipality → BSN → DigiD, surfaced in the right order.</span>
        </section>

        <div style={{ height: 14 }} />
        <section className="card stack">
          <div className="row"><strong>Part-time work + DUO evidence</strong><span className="pill">WORK</span></div>
          <span className="muted">Student CV, contract check, employer pack, paid-hours tracker and monthly evidence readiness.</span>
          <Link className="secondary" href="/work">Explore Work →</Link>
        </section>

        <div style={{ height: 14 }} />
        <section className="card stack">
          <div className="row"><strong>Money + Wallet</strong><span className="pill">READY</span></div>
          <span className="muted">See the cost of landing and keep the documents connected to each task together.</span>
        </section>

        <PrimaryNav active="Home" />
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
    <main className="shell">
      <span className="eyebrow">LANDINGNL</span>
      <h1 className="title">Hi {displayName}.<br />You’re landing well.</h1>
      <p className="subtitle">{displayCity} · your setup adapts as each step is completed.</p>

      <section className="focus stack" aria-labelledby="today-title">
        <span className="pill">TODAY · PRIMARY FOCUS</span>
        <div>
          <p className="muted" style={{ marginBottom: 8 }}>Your next action</p>
          <h2 id="today-title" style={{ fontSize: 30, margin: 0, letterSpacing: "-.03em" }}>{next.title}</h2>
          <p>{next.description}</p>
        </div>
        <Link className="primary" href="/plan">Open today’s task →</Link>
      </section>

      <div style={{ height: 16 }} />
      <section className="card stack">
        <div className="row">
          <div>
            <span className="eyebrow">WORK + DUO</span>
            <h3 style={{ margin: "7px 0 0" }}>Keep paid work evidence ready</h3>
          </div>
          <span className="pill">LIVE</span>
        </div>
        <p className="muted" style={{ margin: 0 }}>CV, contract, employer pack, paid hours, payslip and salary evidence in one journey.</p>
        <Link className="secondary" href="/work">Open Work →</Link>
      </section>

      <div style={{ height: 14 }} />
      <section className="card stack">
        <div className="row">
          <div>
            <span className="eyebrow">YOUR MOVE</span>
            <h3 style={{ margin: "7px 0 0" }}>{journeyState.housingSecured ? "Housing secured ✓" : "Housing still needs attention"}</h3>
          </div>
          {typeof rent === "number" ? <span className="pill">€{rent.toLocaleString("en-NL")} / mo</span> : null}
        </div>
        <p className="muted" style={{ margin: 0 }}>Your housing status feeds registration, Wallet and your monthly money view.</p>
      </section>

      <PrimaryNav active="Home" />
    </main>
  );
}
