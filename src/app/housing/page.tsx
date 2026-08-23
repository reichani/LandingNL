import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { saveHousing } from "./actions";

type Housing = {
  housing_status: string | null;
  monthly_rent_eur: number | string | null;
  address_registrable: boolean | null;
  contract_status: string | null;
  move_in_date: string | null;
  commute_minutes: number | null;
};

export default async function HousingPage() {
  let signedIn = false;
  let housing: Housing | null = null;

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    signedIn = Boolean(user);
    if (user) {
      const { data } = await supabase.from("housing_profiles").select("housing_status,monthly_rent_eur,address_registrable,contract_status,move_in_date,commute_minutes").eq("user_id", user.id).maybeSingle();
      housing = data as Housing | null;
    }
  } catch {
    // Preview mode.
  }

  const registrableValue = housing?.address_registrable == null ? "unknown" : housing.address_registrable ? "yes" : "no";
  const secured = housing?.housing_status === "secured";
  const readiness = [secured, housing?.address_registrable === true, housing?.contract_status === "signed", Boolean(housing?.move_in_date)].filter(Boolean).length;

  return (
    <main className="shell">
      <Link className="text-link" href="/">← Home</Link>
      <div style={{ height: 20 }} />
      <span className="eyebrow">HOUSING</span>
      <h1 className="title">A place is not enough. It must work for the landing plan.</h1>
      <p className="subtitle">Track registrability, contract readiness, move-in timing, rent and commute without storing your exact home address here.</p>

      <section className="focus stack">
        <div className="row"><span className="pill">HOUSING READINESS</span><strong>{readiness}/4</strong></div>
        <h2 style={{ margin: 0, fontSize: 30 }}>{secured ? "Housing secured" : "Housing still open"}</h2>
        <p style={{ margin: 0 }}>{housing?.address_registrable === true ? "Address marked registrable for your plan." : "Confirm whether registration at the address is possible before relying on it for municipality steps."}</p>
      </section>

      <div style={{ height: 16 }} />
      <form className="card stack" action={saveHousing}>
        <label><strong>Status</strong><select className="input" name="status" defaultValue={housing?.housing_status ?? "searching"} disabled={!signedIn}><option value="searching">Still searching</option><option value="secured">Housing secured</option></select></label>
        <label><strong>Can you register at the address?</strong><select className="input" name="registrable" defaultValue={registrableValue} disabled={!signedIn}><option value="unknown">Not confirmed</option><option value="yes">Yes</option><option value="no">No</option></select></label>
        <label><strong>Contract status</strong><select className="input" name="contract_status" defaultValue={housing?.contract_status ?? "none"} disabled={!signedIn}><option value="none">No contract yet</option><option value="reviewing">Reviewing contract</option><option value="signed">Signed</option></select></label>
        <div className="row">
          <label style={{ flex: 1 }}><strong>Monthly rent €</strong><input className="input" name="monthly_rent" type="number" min="0" step="1" defaultValue={housing?.monthly_rent_eur == null ? "" : String(housing.monthly_rent_eur)} disabled={!signedIn} /></label>
          <label style={{ flex: 1 }}><strong>Commute min</strong><input className="input" name="commute_minutes" type="number" min="0" step="1" defaultValue={housing?.commute_minutes ?? ""} disabled={!signedIn} /></label>
        </div>
        <label><strong>Move-in date</strong><input className="input" name="move_in_date" type="date" defaultValue={housing?.move_in_date ?? ""} disabled={!signedIn} /></label>
        {signedIn ? <button className="primary" type="submit">Save housing readiness →</button> : <Link className="primary" href="/login">Sign in to save →</Link>}
      </form>

      <p className="muted" style={{ fontSize: 12 }}>LandingNL intentionally does not need your exact address for this readiness view.</p>
    </main>
  );
}
