import Link from "next/link";
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
  "Required identity / right-to-work documentation for your situation",
  "BSN when required for payroll onboarding",
  "Address details required by payroll",
  "Bank account for salary",
  "Payroll-tax information / loonheffingen where applicable",
];

export default function EmployerPackPage() {
  return (
    <main className="shell">
      <Link className="text-link" href="/work">← Work journey</Link>
      <div style={{ height: 20 }} />
      <span className="eyebrow">WORK · EMPLOYER PACK</span>
      <h1 className="title">Make the job evidence-ready.</h1>
      <p className="subtitle">A practical checklist the student can share with payroll or HR. It does not tell the employer that the student qualifies for DUO.</p>

      <section className="focus stack">
        <span className="pill">SHARE WITH EMPLOYER</span>
        <h2 style={{ margin: 0 }}>Employment documentation to keep clear</h2>
        {employerChecklist.map((item) => <div key={item}>✓ {item}</div>)}
        <EmployerPackActions />
      </section>

      <div style={{ height: 16 }} />
      <section className="card stack">
        <h2 style={{ margin: 0 }}>Student payroll onboarding</h2>
        {studentChecklist.map((item) => <div className="row" key={item}><span>{item}</span><span className="muted">Prepare if applicable</span></div>)}
      </section>

      <div style={{ height: 16 }} />
      <section className="card stack">
        <h2 style={{ margin: 0 }}>What the message says</h2>
        <p style={{ margin: 0 }}>It asks for a signed contract, monthly payslip and — where payroll supports it — visible paid hours. It deliberately avoids claims about nationality-specific eligibility or a guaranteed funding outcome.</p>
        <p className="muted" style={{ margin: 0, fontSize: 12 }}>LandingNL organizes evidence. Official authorities and the employer remain responsible for their own legal and eligibility decisions.</p>
      </section>
    </main>
  );
}
