"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const cvSchema = z.object({
  name: z.string().trim().min(1).max(120),
  city: z.string().trim().max(120),
  education: z.string().trim().min(1).max(240),
  languages: z.string().trim().min(1).max(500),
  strengths: z.string().trim().min(1).max(800),
  availability: z.string().trim().min(1).max(500),
  experience: z.string().trim().max(1200),
});

export type CVInput = z.infer<typeof cvSchema>;

export async function saveCV(input: CVInput) {
  const parsed = cvSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: "Add your name, education, languages, strengths and availability before saving the CV." };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Sign in to save your CV." };

  const { error } = await supabase.from("student_cvs").upsert({
    user_id: user.id,
    ...parsed.data,
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id" });
  if (error) {
    console.error("student_cv_save_failed", { code: error.code, message: error.message });
    return { ok: false as const, error: "Could not save the CV yet." };
  }

  const { error: milestoneError } = await supabase.from("journey_tasks").upsert({
    user_id: user.id,
    task_key: "cv",
    status: "completed",
    completed_at: new Date().toISOString(),
  }, { onConflict: "user_id,task_key" });

  if (milestoneError) {
    console.error("student_cv_milestone_save_failed", { code: milestoneError.code, message: milestoneError.message });
    return { ok: false as const, error: "Your CV was saved, but the Plan milestone could not update. Please try again." };
  }

  revalidatePath("/");
  revalidatePath("/plan");
  revalidatePath("/work");
  return { ok: true as const };
}
