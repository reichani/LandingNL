"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function LogShiftPage() {
  const [shiftDate, setShiftDate] = useState("");
  const [paidHours, setPaidHours] = useState("");
  const [employerName, setEmployerName] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setStatus(null);

    try {
      const supabase = createClient();
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) throw new Error("Please sign in again.");

      const hours = Number(paidHours);
      if (!shiftDate || !Number.isFinite(hours) || hours <= 0 || hours > 24) {
        throw new Error("Enter a valid shift date and paid hours.");
      }

      const { error } = await supabase.from("work_shifts").insert({
        user_id: userData.user.id,
        shift_date: shiftDate,
        paid_hours: hours,
        employer_name: employerName.trim() || null,
      });
      if (error) throw error;

      setStatus("Shift saved. Your monthly DUO work status can now include these paid hours.");
      setPaidHours("");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to save shift.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="shell">
      <span className="eyebrow">WORK · PAID HOURS</span>
      <h1 className="title">Log a paid shift.</h1>
      <p className="subtitle">Track actual paid hours month by month. LandingNL keeps the rule threshold separate in the Rule Registry.</p>

      <form className="card stack" onSubmit={submit}>
        <label className="stack">
          <strong>Shift date</strong>
          <input className="input" type="date" value={shiftDate} onChange={(e) => setShiftDate(e.target.value)} required />
        </label>
        <label className="stack">
          <strong>Paid hours</strong>
          <input className="input" inputMode="decimal" value={paidHours} onChange={(e) => setPaidHours(e.target.value)} placeholder="e.g. 8" required />
        </label>
        <label className="stack">
          <strong>Employer</strong>
          <input className="input" value={employerName} onChange={(e) => setEmployerName(e.target.value)} placeholder="Optional" />
        </label>
        <button className="primary" disabled={saving}>{saving ? "Saving…" : "Save paid shift →"}</button>
        {status ? <p role="status" className="muted" style={{ margin: 0 }}>{status}</p> : null}
      </form>

      <div style={{ height: 16 }} />
      <Link href="/work" className="pill">← Back to Work</Link>
    </main>
  );
}
