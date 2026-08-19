"use client";

import { useActionState } from "react";
import { signInWithEmail, type EmailSignInState } from "./actions";

const initialState: EmailSignInState = { status: "idle" };

export function EmailSignInForm() {
  const [state, action, pending] = useActionState(signInWithEmail, initialState);

  return (
    <form action={action} className="stack email-sign-in-form">
      <label htmlFor="sign-in-email"><strong>Or continue with email</strong></label>
      <input
        className="input"
        id="sign-in-email"
        name="email"
        type="email"
        inputMode="email"
        autoComplete="email"
        placeholder="you@example.com"
        required
        disabled={pending || state.status === "success"}
      />
      <button className="button-secondary" type="submit" disabled={pending || state.status === "success"}>
        {pending ? "Sending secure link…" : state.status === "success" ? "Email sent ✓" : "Continue with email →"}
      </button>
      {state.message ? (
        <div
          className={`auth-message ${state.status}`}
          role={state.status === "error" ? "alert" : "status"}
          aria-live="polite"
        >
          {state.message}
        </div>
      ) : null}
    </form>
  );
}
