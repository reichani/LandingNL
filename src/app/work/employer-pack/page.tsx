import EmployerPackActions from "./EmployerPackActions";

const employerChecklist = [
  "Signed employment contract",
  "Clear employment start date",
  "Agreed weekly or monthly hours",
  "Gross hourly wage",
  "Monthly payslip",
  "Paid hours visible on payslip where payroll supports it",
  "Salary paid to the student bank account",
];

const studentChecklist = [
  "BSN",
  "Dutch address",
  "Passport or EU identity document",
  "Bank account for salary",
  "Payroll-tax information / loonheffingen",
];

export default function EmployerPackPage() {
  return (
    <main className="shell">
      <span className="eyebrow">WORK · EMPLOYER PACK</span>
      <h1 className="title">Make the job DUO-evidence ready.</h1>
      <p className="subtitle">A simple checklist the student can share with payroll or HR. Regulatory thresholds stay in LandingNL&apos;s Rule Registry.</p>

      <section className="focus stack">
        <span className="pill">SHARE WITH EMPLOYER</span>
        <h2 style={{ margin: 0 }}>What we need from the employment relationship</h2>
        {employerChecklist.map((item) => <div key={item}>✓ {item}</div>)}
        <EmployerPackActions />
      </section>

      <div style={{ height: 16 }} />
      <section className="card stack">
        <h2 style={{ margin: 0 }}>Student payroll onboarding</h2>
        {studentChecklist.map((item) => <div className="row" key={item}><span>{item}</span><span className="muted">Prepare</span></div>)}
      </section>

      <div style={{ height: 16 }} />
      <section className="card stack">
        <h2 style={{ margin: 0 }}>Employer message</h2>
        <p style={{ margin: 0 }}>Hello, I am an EU student studying in the Netherlands. I may use my paid employment as supporting evidence for my Dutch DUO student-finance application.</p>
        <p style={{ margin: 0 }}>Could you please ensure that I receive a signed employment contract and a monthly payslip? Where your payroll system supports it, it would also be helpful if the payslip clearly states the number of paid hours worked in that month.</p>
        <p className="muted" style={{ margin: 0, fontSize: 12 }}>LandingNL helps organize evidence. It does not determine DUO eligibility.</p>
      </section>
    </main>
  );
}
