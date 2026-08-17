import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import { ApiError, api, postJson } from "./api";
import { nextAction, weeklyFocus } from "./journey";
import type { CirclePost, JobApplication, MeData, Profile, WorkEvidence } from "./types";

const PRIMARY_NAV = ["Home", "Plan", "Money", "Work", "Circle"] as const;
const ONBOARDING_STEPS = 3;

type NavName = (typeof PRIMARY_NAV)[number];

type OnboardingDraft = {
  city: string;
  arrivalDate: string;
  university: string;
  studentType: "bachelor" | "master" | "exchange" | "other";
  citizenshipGroup: "eu_eea_swiss" | "non_eu";
  housingStatus: "secured" | "searching";
};

const navRoutes: Record<NavName, string> = {
  Home: "/app",
  Plan: "/app/plan",
  Money: "/app/money",
  Work: "/app/work",
  Circle: "/app/circle",
};

function usePath() {
  const [path, setPath] = useState(() => window.location.pathname);
  useEffect(() => {
    const update = () => setPath(window.location.pathname);
    window.addEventListener("popstate", update);
    return () => window.removeEventListener("popstate", update);
  }, []);
  return path;
}

function go(path: string) {
  if (window.location.pathname === path) return;
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
  window.scrollTo({ top: 0, behavior: "instant" });
}

function AppLink({ href, className, children }: { href: string; className?: string; children: ReactNode }) {
  return (
    <a
      href={href}
      className={className}
      onClick={(event) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        go(href);
      }}
    >
      {children}
    </a>
  );
}

function Button({ children, onClick, kind = "primary", disabled = false, type = "button" }: { children: ReactNode; onClick?: () => void; kind?: "primary" | "secondary" | "quiet"; disabled?: boolean; type?: "button" | "submit" }) {
  return <button className={`button ${kind}`} onClick={onClick} disabled={disabled} type={type}>{children}</button>;
}

function Marketing() {
  return (
    <main className="marketing-shell">
      <header className="site-header">
        <a className="brand" href="/"><span className="brand-mark">L</span><span>LandingNL</span></a>
        <a className="header-link" href="/api/auth/google?next=/app">Sign in</a>
      </header>

      <section className="marketing-hero">
        <div className="hero-copy">
          <span className="eyebrow">STUDENT LIFE IN THE NETHERLANDS · IN THE RIGHT ORDER</span>
          <h1>Land without the chaos.</h1>
          <p>Housing, registration, money and part-time work become one calm plan. LandingNL keeps one next action clear and the rest light.</p>
          <div className="hero-actions">
            <a className="button primary large" href="/api/auth/google?next=/app">Build my plan →</a>
            <a className="button secondary large" href="#how">See how it works</a>
          </div>
          <div className="micro-trust"><span>Google sign-in</span><span>No BSN number stored</span><span>No exact address required</span></div>
        </div>

        <aside className="hero-preview" aria-label="LandingNL preview">
          <span className="eyebrow">NOW</span>
          <h2>Prepare municipality registration</h2>
          <p>Three things to keep ready. One task to finish next.</p>
          <div className="preview-list">
            <div><span>✓</span><strong>Housing</strong><small>secured</small></div>
            <div className="active"><span>2</span><strong>Municipality</strong><small>do this now</small></div>
            <div><span>3</span><strong>BSN</strong><small>unlocks next</small></div>
          </div>
        </aside>
      </section>

      <section className="value-strip" id="how">
        <article><span>01</span><h3>Three-screen setup</h3><p>Tell us only what changes your landing plan.</p></article>
        <article><span>02</span><h3>One next action</h3><p>No giant checklist competing for your attention.</p></article>
        <article><span>03</span><h3>Useful after arrival</h3><p>Money, work and Circle keep the app relevant beyond registration.</p></article>
      </section>

      <section className="marketing-final">
        <span className="eyebrow">LAND → SETTLE → BELONG</span>
        <h2>Your first months, less fragmented.</h2>
        <p>Start with your real move. LandingNL adapts as your situation changes.</p>
        <a className="button primary large" href="/api/auth/google?next=/app">Continue with Google →</a>
      </section>
      <footer className="site-footer"><strong>LandingNL</strong><span>Guidance only · official authorities make eligibility decisions.</span></footer>
    </main>
  );
}

function SignIn({ path }: { path: string }) {
  const failed = new URLSearchParams(window.location.search).has("auth");
  return (
    <main className="center-shell">
      <section className="auth-card">
        <span className="eyebrow">SAVE YOUR PLAN</span>
        <h1>Continue with Google.</h1>
        <p>One account keeps your plan, budget, work tracker and Circle activity together.</p>
        {failed ? <div className="notice error">Sign-in didn’t finish. Try once more.</div> : null}
        <a className="button primary large full" href={`/api/auth/google?next=${encodeURIComponent(path)}`}>Continue with Google →</a>
        <a className="text-link" href="/">Back to LandingNL</a>
      </section>
    </main>
  );
}

function BottomNav({ active }: { active: NavName }) {
  return (
    <nav className="bottom-nav" aria-label="Primary navigation">
      {PRIMARY_NAV.map((name) => (
        <AppLink key={name} href={navRoutes[name]} className={active === name ? "active" : ""}>
          <span>{name}</span>
        </AppLink>
      ))}
    </nav>
  );
}

function AppHeader({ me }: { me: MeData }) {
  const initials = (me.user.first_name || me.user.full_name || "L").slice(0, 1).toUpperCase();
  return (
    <header className="app-header">
      <AppLink href="/app" className="brand"><span className="brand-mark">L</span><span>LandingNL</span></AppLink>
      <AppLink href="/app/profile" className="profile-button" aria-label="Open profile">{initials}</AppLink>
    </header>
  );
}

function PageFrame({ me, active, children }: { me: MeData; active: NavName; children: ReactNode }) {
  return (
    <main className="app-shell">
      <AppHeader me={me} />
      <div className="app-content">{children}</div>
      <BottomNav active={active} />
    </main>
  );
}

function HomePage({ me }: { me: MeData }) {
  const primary = nextAction(me);
  const week = weeklyFocus(me, primary.href);
  const name = me.user.first_name || me.user.full_name || "there";
  return (
    <PageFrame me={me} active="Home">
      <section className="page-heading compact">
        <span className="eyebrow">HOME</span>
        <h1>Hi {name}. Here’s what matters now.</h1>
        <p>{me.profile?.city || "Netherlands"}{me.profile?.arrival_date ? ` · ${new Date(`${me.profile.arrival_date}T12:00:00`).toLocaleDateString("en-NL", { day: "numeric", month: "short" })}` : ""}</p>
      </section>

      <section className="now-card">
        <span className="eyebrow">NOW</span>
        <span className="context-label">{primary.label}</span>
        <h2>{primary.title}</h2>
        <p>{primary.description}</p>
        <Button onClick={() => go(primary.href)}>{primary.cta} →</Button>
      </section>

      <section className="section-block">
        <div className="section-title-row"><div><span className="eyebrow">THIS WEEK</span><h2>Keep the rest light.</h2></div><span className="count-pill">2 max</span></div>
        <div className="two-card-grid">
          {week.map((item) => (
            <AppLink key={item.id} href={item.href} className="soft-card">
              <span className="context-label">{item.label}</span>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
              <span className="text-link">{item.cta} →</span>
            </AppLink>
          ))}
        </div>
      </section>
    </PageFrame>
  );
}

const planSteps = [
  { key: "housing", title: "Housing", detail: "A registrable place comes first." },
  { key: "municipality", title: "Municipality registration", detail: "Keep passport, housing proof and appointment confirmation ready." },
  { key: "bsn", title: "BSN received", detail: "Store the milestone, never the number." },
  { key: "digid", title: "DigiD active", detail: "Government access after BSN." },
  { key: "cv", title: "Student CV ready", detail: "Work becomes easier to start." },
  { key: "contract", title: "Contract signed", detail: "Then keep monthly work evidence current." },
] as const;

function PlanPage({ me, refresh }: { me: MeData; refresh: () => Promise<void> }) {
  const done = new Set(me.milestones.filter((item) => item.status === "completed").map((item) => item.milestone_key));
  const housingDone = me.profile?.housing_status === "secured";
  const [saving, setSaving] = useState<string | null>(null);

  async function toggle(key: string, completed: boolean) {
    setSaving(key);
    try {
      await postJson("/api/milestones", { key, status: completed ? "todo" : "completed" });
      await refresh();
    } finally {
      setSaving(null);
    }
  }

  return (
    <PageFrame me={me} active="Plan">
      <section className="page-heading"><span className="eyebrow">PLAN</span><h1>Your move, in dependency order.</h1><p>Only the first unfinished step needs your attention.</p></section>
      <section className="step-list">
        {planSteps.map((step, index) => {
          const completed = step.key === "housing" ? housingDone : done.has(step.key);
          const previousComplete = index === 0 || planSteps.slice(0, index).every((previous) => previous.key === "housing" ? housingDone : done.has(previous.key));
          const locked = !completed && !previousComplete;
          return (
            <article className={`step-card ${completed ? "done" : ""} ${locked ? "locked" : ""}`} key={step.key}>
              <div className="step-index">{completed ? "✓" : String(index + 1).padStart(2, "0")}</div>
              <div className="step-copy"><h3>{step.title}</h3><p>{step.detail}</p>
                {step.key === "municipality" && !completed ? <div className="context-box"><strong>Keep ready</strong><span>Passport · housing proof · appointment confirmation</span></div> : null}
              </div>
              <div className="step-action">
                {step.key === "housing" ? <Button kind="secondary" onClick={() => go("/app/onboarding")}>{completed ? "Update" : "Update housing"}</Button> : (
                  <Button kind={completed ? "quiet" : "secondary"} disabled={locked || saving === step.key} onClick={() => toggle(step.key, completed)}>{saving === step.key ? "Saving…" : completed ? "Mark undone" : locked ? "Locked" : "Mark done"}</Button>
                )}
              </div>
            </article>
          );
        })}
      </section>
    </PageFrame>
  );
}

const moneyKeys = [
  ["rent", "Rent"],
  ["food", "Food"],
  ["transport", "Transport"],
  ["insurance", "Phone & insurance"],
  ["other", "Other"],
] as const;

function MoneyPage({ me, refresh }: { me: MeData; refresh: () => Promise<void> }) {
  const initial = useMemo(() => Object.fromEntries(moneyKeys.map(([key]) => [key, (me.budget.find((item) => item.item_key === key)?.amount_cents || 0) / 100])) as Record<string, number>, [me.budget]);
  const [items, setItems] = useState(initial);
  const [status, setStatus] = useState("");
  useEffect(() => setItems(initial), [initial]);
  const total = Object.values(items).reduce((sum, value) => sum + (Number(value) || 0), 0);

  async function save() {
    setStatus("Saving…");
    try {
      await postJson("/api/money", { items });
      await refresh();
      setStatus("Saved ✓");
    } catch {
      setStatus("Couldn’t save yet. Try again.");
    }
  }

  return (
    <PageFrame me={me} active="Money">
      <section className="page-heading"><span className="eyebrow">MONEY</span><h1>Know your monthly baseline.</h1><p>Planning amounts only. No bank connection and no financial account data.</p></section>
      <section className="money-total"><span>Monthly plan</span><strong>€{total.toLocaleString("en-NL", { maximumFractionDigits: 0 })}</strong></section>
      <section className="form-card">
        {moneyKeys.map(([key, label]) => (
          <label className="money-row" key={key}><span>{label}</span><span className="money-input"><b>€</b><input inputMode="decimal" type="number" min="0" value={items[key] || ""} onChange={(event) => setItems({ ...items, [key]: Number(event.target.value) })} /></span></label>
        ))}
        <div className="form-footer"><span className="save-status">{status}</span><Button onClick={save}>Save budget</Button></div>
      </section>
    </PageFrame>
  );
}

function WorkPage({ me, refresh }: { me: MeData; refresh: () => Promise<void> }) {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [evidence, setEvidence] = useState<WorkEvidence>({ paid_hours: me.work.paid_hours || 0, payslip_ready: me.work.payslip_ready || 0, salary_evidence_ready: me.work.salary_evidence_ready || 0 });
  const [employer, setEmployer] = useState("");
  const [role, setRole] = useState("");
  const [stage, setStage] = useState("applied");
  const [message, setMessage] = useState("");
  const cvDone = me.milestones.some((item) => item.milestone_key === "cv" && item.status === "completed");
  const contractDone = me.milestones.some((item) => item.milestone_key === "contract" && item.status === "completed");

  async function load() {
    try {
      const [apps, work] = await Promise.all([
        api<{ applications: JobApplication[] }>("/api/work/applications"),
        api<{ evidence: WorkEvidence }>("/api/work/evidence"),
      ]);
      setApplications(apps.applications);
      setEvidence(work.evidence);
    } catch {
      setMessage("Work details couldn’t load yet.");
    }
  }
  useEffect(() => { void load(); }, []);

  async function setMilestone(key: "cv" | "contract", completed: boolean) {
    await postJson("/api/milestones", { key, status: completed ? "todo" : "completed" });
    await refresh();
  }

  async function addApplication(event: FormEvent) {
    event.preventDefault();
    setMessage("");
    try {
      await postJson("/api/work/applications", { employer, role, stage });
      setEmployer(""); setRole(""); setStage("applied");
      await load(); await refresh();
    } catch {
      setMessage("Add employer and role, then try again.");
    }
  }

  async function saveEvidence() {
    setMessage("Saving…");
    try {
      await postJson("/api/work/evidence", {
        month: new Date().toISOString().slice(0, 7),
        paidHours: Number(evidence.paid_hours || 0),
        payslipReady: Boolean(evidence.payslip_ready),
        salaryEvidenceReady: Boolean(evidence.salary_evidence_ready),
      });
      await refresh();
      setMessage("Work evidence saved ✓");
    } catch {
      setMessage("Couldn’t save yet. Try again.");
    }
  }

  return (
    <PageFrame me={me} active="Work">
      <section className="page-heading"><span className="eyebrow">WORK</span><h1>From first application to paid-hours evidence.</h1><p>Only the part of the journey you need now stays prominent.</p></section>

      <section className="work-section"><div className="section-title-row"><div><span className="eyebrow">GET A JOB</span><h2>CV + applications</h2></div><Button kind="secondary" onClick={() => setMilestone("cv", cvDone)}>{cvDone ? "CV ready ✓" : "Mark CV ready"}</Button></div>
        <form className="inline-form" onSubmit={addApplication}>
          <input placeholder="Employer" value={employer} onChange={(event) => setEmployer(event.target.value)} />
          <input placeholder="Role" value={role} onChange={(event) => setRole(event.target.value)} />
          <select value={stage} onChange={(event) => setStage(event.target.value)}><option value="saved">Saved</option><option value="applied">Applied</option><option value="interview">Interview</option><option value="offer">Offer</option><option value="closed">Closed</option></select>
          <Button type="submit">Add</Button>
        </form>
        <div className="application-list">{applications.length ? applications.map((item) => <div className="application-row" key={item.id}><div><strong>{item.role}</strong><span>{item.employer}</span></div><span className="count-pill">{item.stage}</span></div>) : <p className="empty-copy">No applications yet. Add the first lead when you find one.</p>}</div>
      </section>

      <section className="work-section"><div className="section-title-row"><div><span className="eyebrow">GOT AN OFFER?</span><h2>Contract readiness</h2></div><Button kind="secondary" onClick={() => setMilestone("contract", contractDone)}>{contractDone ? "Contract signed ✓" : "Mark contract signed"}</Button></div><p>Check employer, role, hours, wage and both signatures before you treat the contract as complete.</p></section>

      <section className="work-section"><span className="eyebrow">ALREADY WORKING?</span><h2>Monthly evidence</h2><div className="evidence-grid"><label><span>Paid hours this month</span><input type="number" min="0" max="400" value={evidence.paid_hours || ""} onChange={(event) => setEvidence({ ...evidence, paid_hours: Number(event.target.value) })} /></label><label className="check-row"><input type="checkbox" checked={Boolean(evidence.payslip_ready)} onChange={(event) => setEvidence({ ...evidence, payslip_ready: event.target.checked ? 1 : 0 })} /><span>Payslip ready</span></label><label className="check-row"><input type="checkbox" checked={Boolean(evidence.salary_evidence_ready)} onChange={(event) => setEvidence({ ...evidence, salary_evidence_ready: event.target.checked ? 1 : 0 })} /><span>Salary evidence ready</span></label></div><Button onClick={saveEvidence}>Save monthly evidence</Button></section>
      {message ? <div className="notice">{message}</div> : null}
    </PageFrame>
  );
}

function CirclePage({ me }: { me: MeData }) {
  const [posts, setPosts] = useState<CirclePost[]>([]);
  const [kind, setKind] = useState<"ask" | "offer" | "pass">("ask");
  const [exchangeType, setExchangeType] = useState("favour");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [area, setArea] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    try {
      const result = await api<{ posts: CirclePost[] }>("/api/circle/posts");
      setPosts(result.posts);
    } catch {
      setMessage("Circle couldn’t load yet.");
    }
  }
  useEffect(() => { void load(); }, []);

  async function publish(event: FormEvent) {
    event.preventDefault();
    setMessage("");
    try {
      await postJson("/api/circle/posts", { kind, exchangeType, title, body, area });
      setTitle(""); setBody(""); setArea("");
      setMessage("Posted ✓");
      await load();
    } catch (error) {
      if (error instanceof ApiError && error.code === "contact_details_not_allowed") setMessage("Keep phone numbers and email out of public posts. Connect details come later, only by mutual consent.");
      else setMessage("Check the fields and try again.");
    }
  }

  return (
    <PageFrame me={me} active="Circle">
      <section className="page-heading"><span className="eyebrow">CIRCLE</span><h1>Students helping students, without the noise.</h1><p>Ask · Offer · Pass it on. No open DMs and no exact address in public posts.</p></section>
      <form className="circle-compose" onSubmit={publish}>
        <div className="segmented">{(["ask", "offer", "pass"] as const).map((value) => <button type="button" className={kind === value ? "selected" : ""} onClick={() => setKind(value)} key={value}>{value === "pass" ? "Pass it on" : value[0].toUpperCase() + value.slice(1)}</button>)}</div>
        <div className="compose-grid"><select value={exchangeType} onChange={(event) => setExchangeType(event.target.value)}><option value="favour">Favour</option><option value="free">Free</option><option value="borrow">Borrow</option><option value="swap">Swap</option><option value="paid">€</option></select><input placeholder="Area, e.g. Amsterdam Oost" value={area} onChange={(event) => setArea(event.target.value)} /></div>
        <input placeholder={kind === "pass" ? "e.g. My bike needs a new home" : kind === "offer" ? "e.g. One extra plate of pasta" : "e.g. Can someone check on my cat?"} value={title} onChange={(event) => setTitle(event.target.value)} maxLength={100} />
        <textarea placeholder="Keep it short. Don’t add phone, email or a street address." value={body} onChange={(event) => setBody(event.target.value)} maxLength={500} rows={4} />
        <div className="form-footer"><span className="save-status">{message}</span><Button type="submit">Publish</Button></div>
      </form>
      <section className="circle-feed">{posts.length ? posts.map((post) => <article className="circle-card" key={post.id}><div className="circle-meta"><span className="context-label">{post.kind === "pass" ? "PASS IT ON" : post.kind.toUpperCase()}</span><span className="count-pill">{post.exchange_type === "paid" ? "€" : post.exchange_type}</span></div><h3>{post.title}</h3><p>{post.body}</p><div className="circle-byline"><span>{post.author_name || "Student"}{post.author_university ? ` · ${post.author_university}` : ""}</span><span>{post.area || "Area shared after matching"}</span></div></article>) : <div className="empty-state"><h3>Quiet is good at the start.</h3><p>The first useful post will appear here — not an empty social feed full of filler.</p></div>}</section>
    </PageFrame>
  );
}

function ProfilePage({ me }: { me: MeData }) {
  const [message, setMessage] = useState("");
  async function signOut() {
    try {
      await api("/api/auth/logout", { method: "POST", body: "{}" });
      window.location.assign("/");
    } catch {
      setMessage("Couldn’t sign out yet. Try again.");
    }
  }
  return (
    <main className="app-shell"><AppHeader me={me} /><div className="app-content"><section className="page-heading"><span className="eyebrow">PROFILE</span><h1>{me.user.first_name || me.user.full_name || "Your account"}</h1><p>{me.user.email}</p></section><section className="profile-grid"><AppLink href="/app/onboarding" className="soft-card"><span className="context-label">SETUP</span><h3>Update your move</h3><p>City, study context, arrival date and housing status.</p><span className="text-link">Update setup →</span></AppLink><div className="soft-card"><span className="context-label">PRIVACY</span><h3>Small data footprint</h3><p>No BSN number, passport number or exact address is part of the v2 profile.</p></div><div className="soft-card"><span className="context-label">SHARING</span><h3>Trusted supporter</h3><p>Read-only sharing returns after v2 stabilisation. It will not become a second account.</p></div></section><div className="profile-actions"><Button kind="secondary" onClick={signOut}>Sign out</Button>{message ? <span>{message}</span> : null}</div></div></main>
  );
}

function OnboardingPage({ me, refresh }: { me: MeData; refresh: () => Promise<void> }) {
  const profile = me.profile;
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState<OnboardingDraft>({
    city: profile?.city || "",
    arrivalDate: profile?.arrival_date || "",
    university: profile?.university || "",
    studentType: (profile?.student_type as OnboardingDraft["studentType"]) || "bachelor",
    citizenshipGroup: profile?.citizenship_group || "eu_eea_swiss",
    housingStatus: profile?.housing_status || "searching",
  });

  function next() {
    setError("");
    if (step === 0 && (!draft.city.trim() || !draft.arrivalDate)) return setError("Add your city and arrival date to continue.");
    if (step === 1 && !draft.university.trim()) return setError("Add your university or school to continue.");
    if (step < ONBOARDING_STEPS - 1) setStep(step + 1);
  }

  async function finish() {
    setSaving(true); setError("");
    try {
      await postJson("/api/onboarding", draft);
      await refresh();
      go("/app");
    } catch {
      setError("We couldn’t save your setup yet. Your answers are still here — try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="onboarding-shell"><div className="onboarding-top"><AppLink href="/app" className="brand"><span className="brand-mark">L</span><span>LandingNL</span></AppLink><span className="count-pill">{step + 1}/{ONBOARDING_STEPS}</span></div><div className="progress"><span style={{ width: `${((step + 1) / ONBOARDING_STEPS) * 100}%` }} /></div>
      <section className="onboarding-card">
        {step === 0 ? <><span className="eyebrow">YOUR MOVE</span><h1>Where are you landing?</h1><p>Two details are enough to put arrival tasks in the right order.</p><label><span>City</span><input autoFocus placeholder="e.g. Amsterdam" value={draft.city} onChange={(event) => setDraft({ ...draft, city: event.target.value })} /></label><label><span>Arrival date</span><input type="date" value={draft.arrivalDate} onChange={(event) => setDraft({ ...draft, arrivalDate: event.target.value })} /></label></> : null}
        {step === 1 ? <><span className="eyebrow">YOUR STUDY</span><h1>What’s your study context?</h1><p>We use this to keep work and registration guidance relevant — not to build a public profile.</p><label><span>University / school</span><input autoFocus placeholder="e.g. University of Amsterdam" value={draft.university} onChange={(event) => setDraft({ ...draft, university: event.target.value })} /></label><label><span>Student type</span><select value={draft.studentType} onChange={(event) => setDraft({ ...draft, studentType: event.target.value as OnboardingDraft["studentType"] })}><option value="bachelor">Bachelor’s</option><option value="master">Master’s</option><option value="exchange">Exchange</option><option value="other">Other</option></select></label><fieldset><legend>Citizenship group</legend><div className="choice-grid"><button type="button" className={draft.citizenshipGroup === "eu_eea_swiss" ? "choice selected" : "choice"} onClick={() => setDraft({ ...draft, citizenshipGroup: "eu_eea_swiss" })}>EU / EEA / Swiss</button><button type="button" className={draft.citizenshipGroup === "non_eu" ? "choice selected" : "choice"} onClick={() => setDraft({ ...draft, citizenshipGroup: "non_eu" })}>Non-EU</button></div></fieldset></> : null}
        {step === 2 ? <><span className="eyebrow">HOUSING</span><h1>Do you already have a place?</h1><p>We only need the status. LandingNL does not need your street address.</p><div className="housing-choices"><button type="button" className={draft.housingStatus === "secured" ? "housing-choice selected" : "housing-choice"} onClick={() => setDraft({ ...draft, housingStatus: "secured" })}><strong>I have a place</strong><span>I can use it for my landing plan.</span></button><button type="button" className={draft.housingStatus === "searching" ? "housing-choice selected" : "housing-choice"} onClick={() => setDraft({ ...draft, housingStatus: "searching" })}><strong>I’m still searching</strong><span>Housing stays my first priority.</span></button></div></> : null}
        {error ? <div className="notice error">{error}</div> : null}
        <div className="onboarding-actions">{step > 0 ? <Button kind="quiet" onClick={() => setStep(step - 1)}>← Back</Button> : <span />}{step < ONBOARDING_STEPS - 1 ? <Button onClick={next}>Next →</Button> : <Button disabled={saving} onClick={finish}>{saving ? "Saving…" : "Build my plan →"}</Button>}</div>
      </section>
      <p className="privacy-note">Only what changes your plan. No passport number · no BSN number · no exact address.</p>
    </main>
  );
}

function AuthenticatedApp({ path, me, refresh }: { path: string; me: MeData; refresh: () => Promise<void> }) {
  if (!me.profile && path !== "/app/onboarding") {
    go("/app/onboarding");
    return null;
  }
  if (path === "/app/onboarding") return <OnboardingPage me={me} refresh={refresh} />;
  if (path === "/app/plan") return <PlanPage me={me} refresh={refresh} />;
  if (path === "/app/money") return <MoneyPage me={me} refresh={refresh} />;
  if (path === "/app/work") return <WorkPage me={me} refresh={refresh} />;
  if (path === "/app/circle") return <CirclePage me={me} />;
  if (path === "/app/profile") return <ProfilePage me={me} />;
  return <HomePage me={me} />;
}

function ProductApp({ path }: { path: string }) {
  const [me, setMe] = useState<MeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);

  async function refresh() {
    try {
      const data = await api<MeData>("/api/me");
      setMe(data);
      setUnauthorized(false);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) setUnauthorized(true);
      else throw error;
    }
  }

  useEffect(() => {
    setLoading(true);
    refresh().catch(() => undefined).finally(() => setLoading(false));
  }, []);

  if (loading) return <main className="center-shell"><div className="loading-card"><span className="eyebrow">LANDINGNL</span><h2>Opening your plan…</h2></div></main>;
  if (unauthorized || !me) return <SignIn path={path} />;
  return <AuthenticatedApp path={path} me={me} refresh={refresh} />;
}

export function App() {
  const path = usePath();
  if (!path.startsWith("/app")) return <Marketing />;
  return <ProductApp path={path} />;
}
