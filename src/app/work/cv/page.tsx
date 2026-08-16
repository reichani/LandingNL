"use client";

import { useMemo, useState } from "react";

type CVData = {
  name: string;
  city: string;
  education: string;
  languages: string;
  strengths: string;
  availability: string;
  experience: string;
};

const initial: CVData = {
  name: "Deren",
  city: "Amsterdam",
  education: "University of Amsterdam",
  languages: "Turkish, English, German",
  strengths: "Communication, organisation, working with people",
  availability: "Evenings and weekends",
  experience: "No formal work experience yet",
};

export default function CVWizardPage() {
  const [data, setData] = useState(initial);
  const [step, setStep] = useState(0);
  const fields = useMemo(() => Object.keys(initial) as (keyof CVData)[], []);
  const field = fields[step];

  return (
    <main className="shell">
      <span className="eyebrow">CV WIZARD · {step + 1}/{fields.length}</span>
      <h1 className="title">Your first student CV.</h1>
      <p className="subtitle">No work experience is a normal starting point. We build around education, languages, strengths and availability.</p>

      <section className="card stack">
        <label htmlFor="cv-field"><strong>{field[0].toUpperCase() + field.slice(1)}</strong></label>
        <textarea
          id="cv-field"
          className="input"
          rows={4}
          value={data[field]}
          onChange={(event) => setData({ ...data, [field]: event.target.value })}
        />
      </section>

      <div style={{ height: 16 }} />
      <button className="primary" onClick={() => setStep((current) => Math.min(current + 1, fields.length - 1))}>
        {step === fields.length - 1 ? "Preview my CV →" : "Next →"}
      </button>

      <div style={{ height: 18 }} />
      <section className="card stack" aria-label="CV preview">
        <span className="eyebrow">LIVE PREVIEW</span>
        <h2 style={{ margin: 0 }}>{data.name}</h2>
        <span className="muted">{data.city} · {data.education}</span>
        <strong>Languages</strong><span>{data.languages}</span>
        <strong>Strengths</strong><span>{data.strengths}</span>
        <strong>Availability</strong><span>{data.availability}</span>
        <strong>Experience</strong><span>{data.experience}</span>
      </section>
    </main>
  );
}
