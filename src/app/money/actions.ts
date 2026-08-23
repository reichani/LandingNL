"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  category: z.enum(["food", "phone_insurance", "transport", "other"]),
  amount: z.coerce.number().min(0).max(10000),
});

const labels: Record<z.infer<typeof schema>["category"], string> = {
  food: "Food & daily life",
  phone_insurance: "Phone & insurance",
  transport: "Transport",
  other: "Other monthly costs",
};

export async function saveBudgetItem(formData: FormData) {
  const parsed = schema.safeParse({
    category: formData.get("category"),
    amount: formData.get("amount"),
  });
  if (!parsed.success) throw new Error("Please check the budget amount and try again.");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Sign in to save your budget.");

  const { category, amount } = parsed.data;
  const { error } = await supabase.from("budget_items").upsert({
    user_id: user.id,
    category,
    label: labels[category],
    monthly_amount_eur: amount,
    source: "user",
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id,category" });

  if (error) {
    console.error("budget_item_save_failed", { code: error.code, message: error.message });
    throw new Error("Your budget could not be saved. Please try again.");
  }

  revalidatePath("/money");
  revalidatePath("/");
}
