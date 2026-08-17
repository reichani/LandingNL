"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const cvSchema = z.object({
  name: z.string().max(120),
  city: z.string().max(120),
  education: z.string().max(240),
  languages: z.string().max(500),
  strengths: z.string().max(800),
  availability: z.string().max(500),
  experience: z.string().max(1200),
});

export type CVInput = z.infer<typeof cvSchema>;

export async function saveCV(input: CVInput) {
  const parsed = cvSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Please check the CV fields." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Sign in to save your CV." };

  const { error } = await supabase.from("student_cvs").upsert({
    user_id: user.id,
    ...parsed.data,
    updated_at: new Date().toISOString(),
  });
  if (error) return { ok: false as const, error: "Could not save the CV yet." };

  await supabase.from("journey_tasks").upsert({
    user_id: user.id,
    task_key: "cv",
    status: "completed",
    completed_at: new Date().toISOString(),
  }, { onConflict: "user_id,task_key" });

  revalidatePath("/");
  revalidatePath("/plan");
  revalidatePath("/work");
  return { ok: true as const };
}
