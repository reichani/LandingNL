import { getNextAction, type JourneyState } from "@/domain/journey";

const pilotState: JourneyState = {
  housingSecured: true,
  municipalityComplete: false,
  bsnReceived: false,
  digidActive: false,
  cvCreated: false,
  contractSigned: false,
  paidHoursThisMonth: 0,
  duoApplied: false,
};

export default function HomePage() {
  const next = getNextAction(pilotState);

  return (
    <main className="shell">
      <span className="eyebrow">LANDINGNL</span>
      <h1 className="title">Hi Deren.<br />You’re landing well.</h1>
      <p className="subtitle">Amsterdam · your setup adapts as each step is completed.</p>

      <section className="focus stack" aria-labelledby="today-title">
        <span className="pill">TODAY · PRIMARY FOCUS</span>
        <div>
          <p className="muted" style={{ marginBottom: 8 }}>Your next action</p>
          <h2 id="today-title" style={{ fontSize: 30, margin: 0, letterSpacing: "-.03em" }}>{next.title}</h2>
          <p>{next.description}</p>
        </div>
        <button className="primary">Open today’s task →</button>
      </section>

      <div style={{ height: 16 }} />

      <section className="card stack">
        <div className="row">
          <div>
            <span className="eyebrow">AFTER THIS</span>
            <h3 style={{ margin: "7px 0 0" }}>Get your BSN</h3>
          </div>
          <span className="pill">NEXT</span>
        </div>
        <p className="muted" style={{ margin: 0 }}>Unlocks DigiD, banking and the next funding steps.</p>
      </section>

      <div style={{ height: 14 }} />

      <section className="card stack">
        <div className="row">
          <div>
            <span className="eyebrow">YOUR MOVE</span>
            <h3 style={{ margin: "7px 0 0" }}>Housing secured ✓</h3>
          </div>
          <span className="pill">€1,750 / mo</span>
        </div>
        <p className="muted" style={{ margin: 0 }}>Your address is now part of your registration and budget journey.</p>
      </section>

      <nav className="bottom-nav" aria-label="Primary navigation">
        <span className="active">Home</span>
        <span>Plan</span>
        <span>Money</span>
        <span>Wallet</span>
      </nav>
    </main>
  );
}
