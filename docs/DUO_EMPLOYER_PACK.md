# LandingNL — DUO Employer Pack (EU Student)

> Operational checklist for an EU/EEA student working in the Netherlands and using employment as evidence for DUO student-finance eligibility.
>
> **Rule data must remain configurable in LandingNL.** Do not hard-code thresholds in product logic. Verify current DUO/Belastingdienst rules before public release and whenever the Rule Registry flags a change.

## 1. Employer-facing request

Please employ the student as a regular paid employee (`loondienst`) and provide a written employment agreement.

Where possible, the agreement should clearly state:

- Employee full legal name
- Employer legal name
- Employment start date
- Contract type
- Agreed weekly/monthly working hours
- Gross hourly wage
- Role/title
- Work location
- Pay frequency
- Employer and employee signatures

For DUO evidence quality, predictable part-time hours are preferable to an ambiguous zero-hours arrangement where commercially feasible.

## 2. Monthly evidence chain

LandingNL should guide the student to retain this evidence every month:

1. Employment contract and amendments
2. Actual paid-hours record / timesheet
3. Monthly payslip
4. Bank transaction showing salary receipt
5. Year-end annual statement (`jaaropgaaf`) when issued

### Payslip request to employer

**Please ensure that the monthly payslip clearly shows the number of paid hours worked during that month, where supported by your payroll system.**

## 3. Employee onboarding information

The employer/payroll provider may require, as applicable:

- Full legal name
- Date of birth
- Dutch address
- BSN
- Valid passport / national identity document for identity verification
- Payroll-tax information (`loonheffingen`)
- Employee choice regarding `loonheffingskorting`
- Bank account for salary payment

If the student has multiple employers, the student should review where `loonheffingskorting` is applied and avoid applying it incorrectly at multiple employers.

The student can also ask payroll whether the Dutch `studenten- en scholierenregeling` is applicable to their circumstances.

## 4. LandingNL work-eligibility UX

### Paid Hours Tracker

Store monthly evidence rather than relying only on scheduled weekly hours:

- Month
- Contracted hours
- Actual paid hours
- Gross pay
- Payslip received: yes/no
- Salary bank evidence received: yes/no
- Contract active: yes/no
- Evidence completeness

### Status model

LandingNL should calculate status from the current Rule Registry:

- **Safe** — current evidence meets the configured rule
- **Attention** — close to threshold or evidence incomplete
- **At risk** — current evidence does not meet the configured rule

Never represent the status as a legal determination or DUO approval.

## 5. Rule Registry fields

Maintain these as versioned admin-controlled rules:

- `duo.eu_worker.monthly_hours_threshold`
- `duo.eu_worker.income_threshold_under_21`
- `duo.eu_worker.income_threshold_21_plus`
- `duo.eu_worker.borderline_hours_floor`
- `duo.eu_worker.borderline_assessment_months`
- `duo.eu_worker.contract_start_effective_date_rule`
- `duo.eu_worker.required_evidence`
- `duo.eu_worker.source_url`
- `duo.eu_worker.effective_from`
- `duo.eu_worker.last_verified_at`

Changes should enter the Admin Review Queue and require human approval before publication.

## 6. Student journey placement

Add to **Work → DUO Work Eligibility**:

- Find a part-time job
- Check proposed contract
- Confirm start date
- Sign contract
- Complete payroll onboarding
- Start Paid Hours Tracker
- Upload/confirm payslip each month
- Confirm salary receipt evidence each month
- Flag approaching DUO threshold risk
- Prepare DUO evidence bundle

## 7. Employer message template

**Subject: Student employment documentation**

Hello,

I am an EU student studying in the Netherlands. I may use my paid employment as supporting evidence for my Dutch DUO student-finance application.

Could you please ensure that I receive a signed employment contract and a monthly payslip? Where your payroll system supports it, it would also be helpful if the payslip clearly states the number of paid hours worked in that month.

I will retain my contract, monthly payslips and salary-payment records for my own DUO documentation.

Thank you.

---

## Product/legal note

LandingNL is a workflow and evidence-management aid, not DUO, Belastingdienst, an employer/payroll provider, or a legal adviser. Eligibility decisions remain with the relevant authority. Current official rules must be verified before user-facing publication.
