"use client";

import { useState } from "react";

const message = `Hello,

I am a student studying in the Netherlands and I am keeping my employment documentation organised for my own administrative and, where applicable, student-finance records.

Could you please ensure that I receive a signed employment contract and a monthly payslip? Where your payroll system supports it, it would also be helpful if the payslip clearly states the number of paid hours worked in that month.

I will retain my contract, monthly payslips and salary-payment records for my own records.

Thank you.`;

export default function EmployerPackActions() {
  const [copied, setCopied] = useState(false);

  async function copyMessage() {
    await navigator.clipboard.writeText(message);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  const mailto = `mailto:?subject=${encodeURIComponent("Student employment documentation")}&body=${encodeURIComponent(message)}`;

  return (
    <div className="stack">
      <button className="primary" type="button" onClick={copyMessage}>{copied ? "Copied ✓" : "Copy employer message →"}</button>
      <a className="pill" href={mailto}>Open in email</a>
    </div>
  );
}
