"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  status: z.enum(["searching", "secured"]),
  monthlyRent: z.coerce.number().min(0).max(20000).optional(),
  registrable: z.enum(["yes", "no", "unknown"]),
  contractStatus: z.enum(["none", "reviewing", "signed"]),
  moveInDate: z.string().optional(),
  commuteMinutes: z.coerce.number().min(0).max(300).optional(),
});

export async function saveHousing(formData: FormData) {
  const parsed = schema.safeParse({
    status: formData.get("status"),
    monthlyRent: formData.get("monthly_rent") || undefined,
    registrable: formData.get("registrable"),
    contractStatus: formData.get("contract_status"),
    moveInDate: formData.get("move_in_date") || undefined,
    commuteMinutes: formData.get("commute_minutes") || undefined,
  });
  if (!parsed.success) throw new Error("Please check the housing fields and try again.");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Sign in to save housing readiness.");

  const value = parsed.data;
  const { error } = await supabase.from("housing_profiles").upsert({
    user_id: user.id,
    housing_status: value.status,
    monthly_rent_eur: value.monthlyRent ?? null,
    address_registrable: value.registrable === "unknown" ? null : value.registrable === "yes",
    contract_status: value.contractStatus,
    move_in_date: value.moveInDate || null,
    commute_minutes: value.commuteMinutes ?? null,
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id" });

  if (error) {
    console.error("housing_save_failed", { code: error.code, message: error.message });
    throw new Error("Housing readiness could not be saved. Please try again.");
  }

  revalidatePath("/");
  revalidatePath("/plan");
  revalidatePath("/money");
  revalidatePath("/housing");
}
