"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const documentSchema = z.enum(["passport", "housing_proof", "appointment_confirmation", "bsn_confirmation", "employment_contract", "payslip", "salary_evidence"]);

export async function toggleDocumentReady(formData: FormData) {
  const parsed = documentSchema.safeParse(formData.get("document_key"));
  if (!parsed.success) throw new Error("Unknown document readiness item.");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Sign in to update document readiness.");

  const { data: current, error: readError } = await supabase
    .from("document_readiness")
    .select("status")
    .eq("user_id", user.id)
    .eq("document_key", parsed.data)
    .maybeSingle();

  if (readError) {
    console.error("document_readiness_read_failed", { code: readError.code, message: readError.message });
    throw new Error("Document readiness could not be loaded. Please try again.");
  }

  const nextStatus = current?.status === "ready" ? "waiting" : "ready";
  const { error } = await supabase.from("document_readiness").upsert({
    user_id: user.id,
    document_key: parsed.data,
    status: nextStatus,
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id,document_key" });

  if (error) {
    console.error("document_readiness_save_failed", { code: error.code, message: error.message });
    throw new Error("Document readiness could not be saved. Please try again.");
  }

  revalidatePath("/wallet");
  revalidatePath("/");
}
