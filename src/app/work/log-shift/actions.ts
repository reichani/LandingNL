"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  shiftDate: z.string().date(),
  paidHours: z.coerce.number().positive().max(24),
  employerName: z.string().trim().max(200).optional(),
});

export async function saveShift(formData: FormData) {
  const parsed = schema.safeParse({
    shiftDate: formData.get("shift_date"),
    paidHours: formData.get("paid_hours"),
    employerName: formData.get("employer_name") ?? "",
  });
  if (!parsed.success) return;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.from("work_shifts").insert({
    user_id: user.id,
    shift_date: parsed.data.shiftDate,
    paid_hours: parsed.data.paidHours,
    employer_name: parsed.data.employerName || null,
  });

  if (!error) {
    await supabase.from("journey_tasks").upsert({
      user_id: user.id,
      task_key: "work_hours_started",
      status: "completed",
      completed_at: new Date().toISOString(),
    }, { onConflict: "user_id,task_key" });
  }

  redirect("/work");
}
