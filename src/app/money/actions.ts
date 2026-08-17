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
  if (!parsed.success) return;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { category, amount } = parsed.data;
  await supabase.from("budget_items").upsert({
    user_id: user.id,
    category,
    label: labels[category],
    monthly_amount_eur: amount,
    source: "user",
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id,category" });

  revalidatePath("/money");
  revalidatePath("/");
}
