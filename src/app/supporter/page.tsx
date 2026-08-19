"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { createSupporter, getActiveSupporter, revokeSupporter } from "./actions";

export default function SupporterPage() {
  const [email, setEmail] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [activeEmail, setActiveEmail] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const shareUrl = useMemo(() => {
    if (!token || typeof window === "undefined") return null;
    return `${window.location.origin}/share/${token}`;
  }, [token]);

  useEffect(() => {
    startTransition(async () => {
      const result = await getActiveSupporter();
      if (!result.ok) {
        setMessage(result.error);
        return;
      }
      setActiveEmail(result.supporter?.email ?? null);
    });
  }, []);

  function createLink() {
    setMessage(null);
    startTransition(async () => {
      const result = await createSupporter(email);
      if (!result.ok) {
        setMessage(result.error);
        return;
      }
      setToken(result.token);
      setActiveEmail(result.email);
      setEmail("");
      setMessage("Read-only supporter access is ready. Share this link only with the person you trust.");
    });
  }

  function revoke() {
    setMessage(null);
    startTransition(async () => {
      const result = await revokeSupporter();
      if (!result.ok) {
        setMessage(result.error);
        return;
      }
      setToken(null);
      setActiveEmail(null);
      setMessage("Supporter access revoked immediately.");
    });
  }

  async function copyLink() {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setMessage("Share link copied.");
  }

  return (
    <main className="shell">
      <Link className="text-link" href="/">← Home</Link>
      <div style={{ height: 22 }} />
      <span className="eyebrow">TRUSTED SUPPORTER</span>
      <h1 className="title">Share progress, not control.</h1>
      <p className="subtitle">Add one parent or trusted person. They get a read-only snapshot; they do not get a LandingNL account and cannot edit your journey.</p>

      <section className="focus stack">
        <span className="pill">STUDENT CONTROLLED</span>
        <h2 style={{ margin: 0, fontSize: 26 }}>One supporter. Read only. Revoke anytime.</h2>
        <p style={{ margin: 0 }}>We never share document contents, exact address, or account controls through the supporter view.</p>
      </section>

      <div style={{ height: 16 }} />
      <section className="card stack">
        <label htmlFor="supporter-email"><strong>{activeEmail ? "Replace active supporter" : "Supporter email"}</strong></label>
        <input id="supporter-email" className="input" type="email" value={email} placeholder="parent@example.com" onChange={(event) => setEmail(event.target.value)} />
        <button className="primary" disabled={isPending || !email} onClick={createLink}>{isPending ? "Saving access…" : activeEmail ? "Replace and rotate link →" : "Create read-only access →"}</button>
        {activeEmail ? <span className="muted" style={{ fontSize: 12 }}>Creating a new supporter automatically revokes the previous active link.</span> : null}
      </section>

      {activeEmail ? (
        <>
          <div style={{ height: 16 }} />
          <section className="card stack">
            <div className="row"><strong>Active supporter</strong><span className="pill">READ ONLY</span></div>
            <span className="muted">{activeEmail}</span>
            {shareUrl ? (
              <>
                <input className="input" readOnly value={shareUrl} aria-label="Trusted supporter share link" />
                <button className="secondary" onClick={copyLink}>Copy share link</button>
              </>
            ) : (
              <p className="muted" style={{ margin: 0, fontSize: 12 }}>For security, an existing bearer link is not redisplayed after refresh. You can still revoke it immediately, or replace the supporter to rotate the link.</p>
            )}
            <button className="secondary" disabled={isPending} onClick={revoke}>Revoke access now</button>
          </section>
        </>
      ) : null}

      {message ? <p className="muted" role="status">{message}</p> : null}
      <p className="muted" style={{ fontSize: 12 }}>The supporter link is a bearer link. Anyone with the link can see the limited snapshot until you revoke it.</p>
    </main>
  );
}
