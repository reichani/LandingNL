"use client";

import { useMemo, useState } from "react";

type Answers = {
  city: string;
  university: string;
  citizenship: string;
  arrivalDate: string;
  housing: "secured" | "searching";
};

const initial: Answers = {
  city: "Amsterdam",
  university: "University of Amsterdam",
  citizenship: "EU / EEA",
  arrivalDate: "2026-08-24",
  housing: "secured",
};

export default function OnboardingPage() {
  const [answers, setAnswers] = useState(initial);
  const [step, setStep] = useState(0);
  const fields = useMemo(() => ["city", "university", "citizenship", "arrivalDate", "housing"] as const, []);
  const key = fields[step];
  const progress = ((step + 1) / fields.length) * 100;

  const labels: Record<typeof key, string> = {
    city: "Where will you live?",
    university: "Where will you study?",
    citizenship: "What is your citizenship status?",
    arrivalDate: "When do you arrive?",
    housing: "Do you already have housing?",
  };

  return (
    <main className="shell">
      <span className="eyebrow">ABOUT YOU · {step + 1}/{fields.length}</span>
      <h1 className="title">Let’s build your landing plan.</h1>
      <p className="subtitle">Five quick answers. You can change them later.</p>
      <div className="progress-track"><div className="progress-fill" style={{ width: `${progress}%` }} /></div>
      <div style={{ height: 18 }} />
      <section className="card stack">
        <h2 style={{ margin: 0 }}>{labels[key]}</h2>
        {key === "housing" ? (
          <div className="choice-grid">
            {(["secured", "searching"] as const).map((value) => (
              <button key={value} className={answers.housing === value ? "choice selected" : "choice"} onClick={() => setAnswers({ ...answers, housing: value })}>
                {value === "secured" ? "I have a place" : "I’m still searching"}
              </button>
            ))}
          </div>
        ) : (
          <input className="input" value={answers[key]} onChange={(e) => setAnswers({ ...answers, [key]: e.target.value })} />
        )}
      </section>
      <div style={{ height: 18 }} />
      <button className="primary" onClick={() => setStep((current) => Math.min(current + 1, fields.length - 1))}>
        {step === fields.length - 1 ? "Build my plan →" : "Next →"}
      </button>
    </main>
  );
}
