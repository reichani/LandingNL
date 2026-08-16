import { PrimaryNav } from "@/components/PrimaryNav";

const costs = [
  ["Housing", 1750],
  ["Food & daily life", 350],
  ["Phone / insurance", 120],
] as const;

export default function MoneyPage() {
  const total = costs.reduce((sum, [, amount]) => sum + amount, 0);
  return (
    <main className="shell">
      <span className="eyebrow">MONEY</span>
      <h1 className="title">Know your number.</h1>
      <p className="subtitle">A simple monthly view for now. Plus intelligence comes later when events change your costs.</p>

      <section className="focus stack">
        <span className="pill">CURRENT MONTHLY COST</span>
        <h2 style={{ fontSize: 38, margin: 0 }}>€{total.toLocaleString("en-NL")}</h2>
        <p style={{ margin: 0 }}>Housing is your biggest fixed cost. Work, DUO and insurance events will update this journey later.</p>
      </section>

      <div style={{ height: 16 }} />
      <section className="card stack">
        {costs.map(([label, amount]) => (
          <div className="row" key={label}>
            <span>{label}</span>
            <strong>€{amount.toLocaleString("en-NL")}</strong>
          </div>
        ))}
        <hr className="divider" />
        <div className="row"><strong>Total</strong><strong>€{total.toLocaleString("en-NL")}</strong></div>
      </section>
      <PrimaryNav active="Money" />
    </main>
  );
}
