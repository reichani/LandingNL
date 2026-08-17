"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { saveOnboarding } from "./actions";

type Answers = {
  city: string;
  university: string;
  citizenship: string;
  arrivalDate: string;
  housing: "secured" | "searching";
};

const initial: Answers = {
  city: "",
  university: "",
  citizenship: "",
  arrivalDate: "",
  housing: "searching",
};

export default function OnboardingPage() {
  const [answers, setAnswers] = useState(initial);
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
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

  const hints: Record<typeof key, string> = {
    city: "Used to shape municipality and local arrival guidance.",
    university: "Keeps your study context visible in the work and money journey.",
    citizenship: "Use a simple status such as EU / EEA or non-EU. Do not enter passport numbers.",
    arrivalDate: "Helps order pre-arrival versus after-arrival tasks.",
    housing: "A registrable address changes which government steps can move next.",
  };

  function continueFlow() {
    setError(null);
    if (key !== "housing" && !answers[key].trim()) {
      setError("Please answer this step before continuing.");
      return;
    }
    if (step < fields.length - 1) {
      setStep((current) => current + 1);
      return;
    }

    startTransition(async () => {
      const result = await saveOnboarding(answers);
      if (result && !result.ok) setError(result.error);
    });
  }

  return (
    <main className="shell">
      <Link className="text-link" href="/">← Home</Link>
      <div style={{ height: 20 }} />
      <div className="row"><span className="eyebrow">60-SECOND SETUP</span><span className="pill">{step + 1}/{fields.length}</span></div>
      <h1 className="title">Build your landing plan.</h1>
      <p className="subtitle">Five essentials. No passport number, BSN number or unnecessary detail.</p>
      <div className="progress-track"><div className="progress-fill" style={{ width: `${progress}%` }} /></div>
      <div style={{ height: 18 }} />

      <section className="card stack">
        <h2 style={{ margin: 0 }}>{labels[key]}</h2>
        <p className="muted" style={{ margin: 0 }}>{hints[key]}</p>
        {key === "housing" ? (
          <div className="choice-grid">
            {(["secured", "searching"] as const).map((value) => (
              <button key={value} className={answers.housing === value ? "choice selected" : "choice"} onClick={() => setAnswers({ ...answers, housing: value })}>
                {value === "secured" ? "I have a place" : "I’m still searching"}
              </button>
            ))}
          </div>
        ) : key === "arrivalDate" ? (
          <input className="input" type="date" value={answers.arrivalDate} onChange={(event) => setAnswers({ ...answers, arrivalDate: event.target.value })} />
        ) : (
          <input className="input" value={answers[key]} placeholder={key === "city" ? "e.g. Amsterdam" : key === "university" ? "e.g. University of Amsterdam" : "e.g. EU / EEA"} onChange={(event) => setAnswers({ ...answers, [key]: event.target.value })} />
        )}
      </section>

      <div style={{ height: 18 }} />
      <div className="row">
        {step > 0 ? <button className="secondary" onClick={() => setStep((current) => current - 1)}>← Back</button> : null}
        <button className="primary" disabled={isPending} onClick={continueFlow}>
          {isPending ? "Saving your plan…" : step === fields.length - 1 ? "Build my plan →" : "Next →"}
        </button>
      </div>
      {error ? <p role="alert" className="muted">{error}</p> : null}
      <p className="muted" style={{ fontSize: 12 }}>You can update these answers later. Product analytics is not automatically opted in during setup.</p>
    </main>
  );
}
