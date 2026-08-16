import { PrimaryNav } from "@/components/PrimaryNav";

const docs = [
  ["Passport", "Ready"],
  ["Housing contract", "Ready"],
  ["Municipality confirmation", "Ready"],
  ["BSN", "Waiting"],
  ["Employment contract", "Later"],
] as const;

export default function WalletPage() {
  return (
    <main className="shell">
      <span className="eyebrow">WALLET</span>
      <h1 className="title">Bring the right things.</h1>
      <p className="subtitle">LandingNL surfaces only the documents connected to your current task.</p>

      <section className="focus stack">
        <span className="pill">TODAY · MUNICIPALITY</span>
        <h2 style={{ fontSize: 28, margin: 0 }}>Bring these 3 things</h2>
        <div className="stack" style={{ gap: 8 }}>
          <strong>Passport</strong>
          <strong>Housing / address proof</strong>
          <strong>Appointment confirmation</strong>
        </div>
      </section>

      <div style={{ height: 16 }} />
      <section className="card stack">
        {docs.map(([name, status]) => (
          <div className="row" key={name}>
            <span>{name}</span>
            <span className="pill">{status}</span>
          </div>
        ))}
      </section>
      <PrimaryNav active="Wallet" />
    </main>
  );
}
