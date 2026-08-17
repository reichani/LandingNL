"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const documentSchema = z.enum(["passport", "housing_proof", "appointment_confirmation", "bsn_confirmation", "employment_contract", "payslip", "salary_evidence"]);

export async function toggleDocumentReady(formData: FormData) {
  const parsed = documentSchema.safeParse(formData.get("document_key"));
  if (!parsed.success) return;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data: current } = await supabase
    .from("document_readiness")
    .select("status")
    .eq("user_id", user.id)
    .eq("document_key", parsed.data)
    .maybeSingle();

  const nextStatus = current?.status === "ready" ? "waiting" : "ready";
  await supabase.from("document_readiness").upsert({
    user_id: user.id,
    document_key: parsed.data,
    status: nextStatus,
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id,document_key" });

  revalidatePath("/wallet");
  revalidatePath("/");
}
