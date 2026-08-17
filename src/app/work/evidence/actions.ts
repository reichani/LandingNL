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
  if (!parsed.success) return;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("work_evidence").upsert({
    user_id: user.id,
    month: currentMonthKey(),
    evidence_type: parsed.data,
    status: "ready",
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id,month,evidence_type" });

  revalidatePath("/work");
  revalidatePath("/work/evidence");
}
