"use client";

import { useMemo, useState, useTransition } from "react";
import { saveCV, type CVInput } from "./actions";

const fieldLabels: Record<keyof CVInput, string> = {
  name: "Name",
  city: "City",
  education: "Education",
  languages: "Languages",
  strengths: "Strengths",
  availability: "Availability",
  experience: "Experience",
};

export function CVEditor({ initial, signedIn }: { initial: CVInput; signedIn: boolean }) {
  const [data, setData] = useState(initial);
  const [step, setStep] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const fields = useMemo(() => Object.keys(fieldLabels) as (keyof CVInput)[], []);
  const field = fields[step];

  function next() {
    if (step < fields.length - 1) {
      setStep((current) => current + 1);
      return;
    }
    startTransition(async () => {
      const result = await saveCV(data);
      setMessage(result.ok ? "CV saved. Your Plan now knows this milestone is complete." : result.error);
    });
  }

  return (
    <>
      <span className="eyebrow">CV WIZARD · {step + 1}/{fields.length}</span>
      <h1 className="title">Your first student CV.</h1>
      <p className="subtitle">No invented experience. Start with education, languages, strengths and real availability.</p>

      <section className="card stack">
        <label htmlFor="cv-field"><strong>{fieldLabels[field]}</strong></label>
        <textarea id="cv-field" className="input" rows={4} value={data[field]} placeholder={`Add ${fieldLabels[field].toLowerCase()}`} onChange={(event) => setData({ ...data, [field]: event.target.value })} />
      </section>

      <div style={{ height: 16 }} />
      <button className="primary" disabled={isPending || (!signedIn && step === fields.length - 1)} onClick={next}>
        {isPending ? "Saving…" : step === fields.length - 1 ? (signedIn ? "Save my CV →" : "Sign in to save") : "Next →"}
      </button>
      {message ? <p className="muted" role="status">{message}</p> : null}

      <div style={{ height: 18 }} />
      <section className="card stack" aria-label="CV preview">
        <div className="row"><span className="eyebrow">LIVE PREVIEW</span><span className="pill">ONE PAGE</span></div>
        <h2 style={{ margin: 0 }}>{data.name || "Your name"}</h2>
        <span className="muted">{[data.city, data.education].filter(Boolean).join(" · ") || "City · Education"}</span>
        <strong>Languages</strong><span>{data.languages || "Add languages you actually use"}</span>
        <strong>Strengths</strong><span>{data.strengths || "Add strengths you can explain with examples"}</span>
        <strong>Availability</strong><span>{data.availability || "Add your real study-compatible availability"}</span>
        <strong>Experience</strong><span>{data.experience || "No formal experience yet is a valid starting point"}</span>
      </section>
    </>
  );
}
