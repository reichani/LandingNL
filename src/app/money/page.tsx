import Link from "next/link";
import { PrimaryNav } from "@/components/PrimaryNav";
import { createClient } from "@/lib/supabase/server";
import { saveBudgetItem } from "./actions";

type BudgetItem = { category: string; label: string; monthly_amount_eur: number | string };

const defaults = {
  food: 350,
  phone_insurance: 120,
  transport: 80,
  other: 0,
} as const;

export default async function MoneyPage() {
  let signedIn = false;
  let rent: number | null = null;
  let savedItems: BudgetItem[] = [];

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    signedIn = Boolean(user);
    if (user) {
      const [{ data: housing }, { data: items }] = await Promise.all([
        supabase.from("housing_profiles").select("monthly_rent_eur").eq("user_id", user.id).maybeSingle(),
        supabase.from("budget_items").select("category,label,monthly_amount_eur").eq("user_id", user.id),
      ]);
      rent = housing?.monthly_rent_eur == null ? null : Number(housing.monthly_rent_eur);
      savedItems = (items ?? []) as BudgetItem[];
    }
  } catch {
    // Guest/demo mode keeps the page useful when the data layer is unavailable.
  }

  const values = { ...defaults } as Record<string, number>;
  savedItems.forEach((item) => { values[item.category] = Number(item.monthly_amount_eur); });
  const nonHousing = Object.values(values).reduce((sum, amount) => sum + amount, 0);
  const total = nonHousing + (rent ?? 0);

  const editable = [
    ["food", "Food & daily life"],
    ["phone_insurance", "Phone & insurance"],
    ["transport", "Transport"],
    ["other", "Other monthly costs"],
  ] as const;

  return (
    <main className="shell">
      <span className="eyebrow">MONEY</span>
      <h1 className="title">Know your number.</h1>
      <p className="subtitle">A planning view, not a bank feed. Adjust the monthly assumptions you actually want to use.</p>

      <section className="focus stack">
        <div className="row"><span className="pill">MONTHLY LANDING COST</span><span>{signedIn ? "Saved" : "Preview"}</span></div>
        <h2 style={{ fontSize: 40, margin: 0 }}>€{total.toLocaleString("en-NL")}</h2>
        <p style={{ margin: 0 }}>{rent == null ? "Add housing cost in your setup to complete the total." : `Includes €${rent.toLocaleString("en-NL")} housing.`}</p>
      </section>

      <div style={{ height: 16 }} />
      <section className="card stack">
        <div className="row"><strong>Housing</strong><strong>{rent == null ? "Not set" : `€${rent.toLocaleString("en-NL")}`}</strong></div>
        {rent == null ? <Link className="text-link" href="/onboarding">Update housing setup →</Link> : null}
        <hr className="divider" />
        {editable.map(([category, label]) => (
          <form className="row" action={saveBudgetItem} key={category}>
            <input type="hidden" name="category" value={category} />
            <label htmlFor={`amount-${category}`} style={{ flex: 1 }}>{label}</label>
            <input id={`amount-${category}`} className="input" name="amount" type="number" min="0" step="5" defaultValue={values[category]} disabled={!signedIn} style={{ width: 105 }} />
            {signedIn ? <button className="pill" type="submit">Save</button> : null}
          </form>
        ))}
        <hr className="divider" />
        <div className="row"><strong>Total</strong><strong>€{total.toLocaleString("en-NL")}</strong></div>
      </section>

      {!signedIn ? <p className="muted" style={{ fontSize: 12 }}>Sign in to replace preview assumptions with your own saved monthly plan.</p> : <p className="muted" style={{ fontSize: 12 }}>LandingNL stores planning amounts only — no bank credentials or transaction feed.</p>}
      <PrimaryNav active="Money" />
    </main>
  );
}
