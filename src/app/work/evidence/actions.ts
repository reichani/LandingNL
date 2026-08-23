"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const evidenceSchema = z.enum(["payslip", "salary_bank"]);

function currentMonthKey() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString().slice(0, 10);
}

export async function markEvidenceReady(formData: FormData) {
  const parsed = evidenceSchema.safeParse(formData.get("evidence_type"));
  if (!parsed.success) throw new Error("Unknown evidence type.");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Sign in to update work evidence.");

  const { error } = await supabase.from("work_evidence").upsert({
    user_id: user.id,
    month: currentMonthKey(),
    evidence_type: parsed.data,
    status: "ready",
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id,month,evidence_type" });

  if (error) {
    console.error("work_evidence_save_failed", { code: error.code, message: error.message, type: parsed.data });
    throw new Error("Work evidence could not be saved. Please try again.");
  }

  revalidatePath("/work");
  revalidatePath("/work/evidence");
}
