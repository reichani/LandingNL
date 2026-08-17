"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  employerName: z.string().trim().min(1).max(200),
  roleTitle: z.string().trim().min(1).max(160),
  status: z.enum(["planned","applied","interview","offer","rejected","withdrawn"]),
});

export async function addApplication(formData: FormData) {
  const parsed = schema.safeParse({
    employerName: formData.get("employer_name"),
    roleTitle: formData.get("role_title"),
    status: formData.get("status"),
  });
  if (!parsed.success) return;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("job_applications").insert({
    user_id: user.id,
    employer_name: parsed.data.employerName,
    role_title: parsed.data.roleTitle,
    status: parsed.data.status,
    applied_at: parsed.data.status === "applied" ? new Date().toISOString().slice(0, 10) : null,
  });

  revalidatePath("/work/applications");
  revalidatePath("/work");
}
