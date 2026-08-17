"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  contractId: z.string().uuid().optional().or(z.literal("")),
  employerName: z.string().trim().min(1).max(200),
  roleTitle: z.string().trim().max(160),
  contractType: z.string().trim().min(1).max(80),
  startDate: z.string().date(),
  weeklyHours: z.coerce.number().min(0).max(80),
  grossHourlyWage: z.coerce.number().min(0).max(1000),
  workLocation: z.string().trim().max(200),
  payFrequency: z.string().trim().max(80),
  employeeSigned: z.boolean(),
  employerSigned: z.boolean(),
});

function currentMonthKey() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString().slice(0, 10);
}

export async function saveContract(formData: FormData) {
  const parsed = schema.safeParse({
    contractId: formData.get("contract_id") ?? "",
    employerName: formData.get("employer_name"),
    roleTitle: formData.get("role_title") ?? "",
    contractType: formData.get("contract_type"),
    startDate: formData.get("start_date"),
    weeklyHours: formData.get("weekly_hours"),
    grossHourlyWage: formData.get("gross_hourly_wage"),
    workLocation: formData.get("work_location") ?? "",
    payFrequency: formData.get("pay_frequency") ?? "",
    employeeSigned: formData.get("employee_signed") === "on",
    employerSigned: formData.get("employer_signed") === "on",
  });
  if (!parsed.success) return;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const value = parsed.data;
  const payload = {
    user_id: user.id,
    employer_name: value.employerName,
    role_title: value.roleTitle || null,
    contract_type: value.contractType,
    start_date: value.startDate,
    contracted_hours_weekly: value.weeklyHours,
    gross_hourly_wage_eur: value.grossHourlyWage,
    work_location: value.workLocation || null,
    pay_frequency: value.payFrequency || null,
    employee_signed: value.employeeSigned,
    employer_signed: value.employerSigned,
    updated_at: new Date().toISOString(),
  };

  if (value.contractId) {
    await supabase.from("employment_contracts").update(payload).eq("id", value.contractId).eq("user_id", user.id);
  } else {
    await supabase.from("employment_contracts").insert(payload);
  }

  const ready = Boolean(value.employerName && value.contractType && value.startDate && value.weeklyHours > 0 && value.grossHourlyWage > 0 && value.employeeSigned && value.employerSigned);
  if (ready) {
    await supabase.from("journey_tasks").upsert({
      user_id: user.id,
      task_key: "contract",
      status: "completed",
      completed_at: new Date().toISOString(),
    }, { onConflict: "user_id,task_key" });

    await supabase.from("work_evidence").upsert({
      user_id: user.id,
      month: currentMonthKey(),
      evidence_type: "contract",
      status: "ready",
      reference: value.employerName,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id,month,evidence_type" });
  }

  revalidatePath("/work/contract");
  revalidatePath("/work");
  revalidatePath("/plan");
  revalidatePath("/");
}
