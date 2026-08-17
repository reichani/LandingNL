export type Profile = {
  city: string | null;
  university: string | null;
  student_type: string | null;
  citizenship_group: "eu_eea_swiss" | "non_eu" | null;
  arrival_date: string | null;
  housing_status: "secured" | "searching" | null;
};

export type User = {
  id: number;
  email: string;
  first_name: string | null;
  full_name: string | null;
  avatar_url: string | null;
};

export type Milestone = {
  milestone_key: string;
  status: "todo" | "completed";
};

export type BudgetItem = {
  item_key: string;
  amount_cents: number;
};

export type WorkEvidence = {
  month?: string;
  paid_hours: number;
  payslip_ready: number;
  salary_evidence_ready: number;
};

export type MeData = {
  user: User;
  profile: Profile | null;
  milestones: Milestone[];
  budget: BudgetItem[];
  work: WorkEvidence;
  applicationCount: number;
};

export type JobApplication = {
  id: number;
  employer: string;
  role: string;
  stage: string;
  created_at: string;
  updated_at: string;
};

export type CirclePost = {
  id: number;
  kind: "ask" | "offer" | "pass";
  exchange_type: "free" | "favour" | "borrow" | "swap" | "paid";
  title: string;
  body: string;
  area: string | null;
  created_at: string;
  author_name: string | null;
  author_university: string | null;
};
