"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";

type Answers = {
  city: string;
  university: string;
  citizenship: string;
  arrivalDate: string;
  housing: "secured" | "searching";
};

type SaveErrorKind = "auth" | "profile" | "housing" | "network" | null;

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
  const [errorKind, setErrorKind] = useState<SaveErrorKind>(null);
  const [complete, setComplete] = useState(false);
  const [isPending, startTransition] = useTransition();
  const fields = useMemo(() => ["city", "university", "citizenship", "arrivalDate", "housing"] as const, []);
  const key = fields[step];
  const progress = complete ? 100 : ((step + 1) / fields.length) * 100;

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
    citizenship: "A simple status is enough, such as EU / EEA or non-EU. Never enter a passport number.",
    arrivalDate: "Helps put pre-arrival and after-arrival tasks in the right order.",
    housing: "A registrable address changes which government steps can move next.",
  };

  async function saveSetup() {
    try {
      const supabase = createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        setErrorKind("auth");
        setError("Your sign-in has expired. Sign in again, then we’ll bring you back to setup.");
        return;
      }

      // Profile creation belongs exclusively to the trusted auth trigger. The browser may
      // update only the authenticated user's safe profile columns under RLS/column grants.
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          city: answers.city.trim(),
          university: answers.university.trim(),
          citizenship_country: answers.citizenship.trim(),
          arrival_date: answers.arrivalDate,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (profileError) {
        console.error("onboarding_profile_save_failed", { code: profileError.code, message: profileError.message });
        setErrorKind("profile");
        setError("We couldn’t save your setup yet. Your answers are still here — try once more.");
        return;
      }

      const { error: housingError } = await supabase.from("housing_profiles").upsert({
        user_id: user.id,
        housing_status: answers.housing,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });

      if (housingError) {
        console.error("onboarding_housing_save_failed", { code: housingError.code, message: housingError.message });
        setErrorKind("housing");
        setError("Your main setup is saved. We only need to save your housing status — try again.");
        return;
      }

      setComplete(true);
      window.setTimeout(() => window.location.assign("/"), 650);
    } catch (saveError) {
      console.error("onboarding_browser_save_failed", saveError);
      setErrorKind("network");
      setError("We couldn’t reach your account just now. Your answers are still here — check your connection and try again.");
    }
  }

  function continueFlow() {
    setError(null);
    setErrorKind(null);

    if (key !== "housing" && !answers[key].trim()) {
      setError("Add an answer to continue.");
      return;
    }

    if (step < fields.length - 1) {
      setStep((current) => current + 1);
      return;
    }

    startTransition(saveSetup);
  }

  function retrySave() {
    setError(null);
    setErrorKind(null);
    startTransition(saveSetup);
  }

  return (
    <main className="shell" data-onboarding-flow="browser-update-v3">
      <Link className="text-link" href="/">← Home</Link>
      <div style={{ height: 20 }} />
      <div className="row">
        <span className="eyebrow">60-SECOND SETUP</span>
        <span className="pill">{complete ? "DONE" : `${step + 1}/${fields.length}`}</span>
      </div>
      <h1 className="title">{complete ? "Your plan is ready." : "Build your landing plan."}</h1>
      <p className="subtitle">
        {complete
          ? "We’re opening your first priority now."
          : "Five essentials. No passport number, BSN number or unnecessary detail."}
      </p>
      <div className="progress-track"><div className="progress-fill" style={{ width: `${progress}%` }} /></div>
      <div style={{ height: 18 }} />

      {complete ? (
        <section className="card stack" aria-live="polite">
          <span className="pill">SETUP COMPLETE ✓</span>
          <h2 style={{ margin: 0 }}>One move. One next action.</h2>
          <p className="muted" style={{ margin: 0 }}>Your Home will now show the first task that matters for your real situation.</p>
        </section>
      ) : (
        <section className="card stack">
          <h2 style={{ margin: 0 }}>{labels[key]}</h2>
          <p className="muted" style={{ margin: 0 }}>{hints[key]}</p>
          {key === "housing" ? (
            <div className="choice-grid">
              {(["secured", "searching"] as const).map((value) => (
                <button key={value} type="button" className={answers.housing === value ? "choice selected" : "choice"} onClick={() => setAnswers({ ...answers, housing: value })}>
                  {value === "secured" ? "I have a place" : "I’m still searching"}
                </button>
              ))}
            </div>
          ) : key === "arrivalDate" ? (
            <input className="input" type="date" value={answers.arrivalDate} onChange={(event) => setAnswers({ ...answers, arrivalDate: event.target.value })} />
          ) : (
            <input
              className="input"
              value={answers[key]}
              autoComplete="off"
              placeholder={key === "city" ? "e.g. Amsterdam" : key === "university" ? "e.g. University of Amsterdam" : "e.g. EU / EEA"}
              onChange={(event) => setAnswers({ ...answers, [key]: event.target.value })}
              onKeyDown={(event) => {
                if (event.key === "Enter") continueFlow();
              }}
            />
          )}
        </section>
      )}

      {!complete ? (
        <>
          <div style={{ height: 18 }} />
          <div className="row">
            {step > 0 ? <button type="button" className="secondary" disabled={isPending} onClick={() => setStep((current) => current - 1)}>← Back</button> : <span />}
            <button className="primary" disabled={isPending} onClick={continueFlow}>
              {isPending ? "Saving your plan…" : step === fields.length - 1 ? "Build my plan →" : "Next →"}
            </button>
          </div>
          {error ? (
            <div role="alert" className="card stack" style={{ marginTop: 14 }}>
              <strong>{errorKind === "auth" ? "Sign in again to continue." : "We couldn’t save your plan yet."}</strong>
              <p className="muted" style={{ margin: 0 }}>{error}</p>
              <p className="muted" style={{ margin: 0, fontSize: 12 }}>Your answers stay on this screen until the save succeeds.</p>
              {errorKind === "auth" ? (
                <Link className="secondary" href="/login?next=/onboarding">Continue with Google →</Link>
              ) : (
                <button type="button" className="secondary" disabled={isPending} onClick={retrySave}>{isPending ? "Trying again…" : "Try again"}</button>
              )}
            </div>
          ) : null}
          <p className="muted" style={{ fontSize: 12 }}>You can update these answers later. Analytics is never turned on automatically during setup.</p>
        </>
      ) : null}
    </main>
  );
}
