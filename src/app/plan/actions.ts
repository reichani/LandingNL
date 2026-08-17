"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const taskSchema = z.enum(["municipality", "bsn", "digid", "cv", "contract", "duo"]);

export async function completeJourneyTask(formData: FormData) {
  const parsed = taskSchema.safeParse(formData.get("task_key"));
  if (!parsed.success) return;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("journey_tasks").upsert({
    user_id: user.id,
    task_key: parsed.data,
    status: "completed",
    completed_at: new Date().toISOString(),
  }, { onConflict: "user_id,task_key" });

  revalidatePath("/");
  revalidatePath("/plan");
  revalidatePath("/wallet");
}
