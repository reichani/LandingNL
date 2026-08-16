"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const onboardingSchema = z.object({
  city: z.string().min(2).max(80),
  university: z.string().min(2).max(160),
  citizenship: z.string().min(2).max(80),
  arrivalDate: z.string().date(),
  housing: z.enum(["secured", "searching"]),
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;

export async function saveOnboarding(input: OnboardingInput) {
  const parsed = onboardingSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Please check your answers." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Please sign in to save your plan." };

  const { city, university, citizenship, arrivalDate, housing } = parsed.data;
  const { error: profileError } = await supabase.from("profiles").upsert({
    id: user.id,
    city,
    university,
    citizenship_country: citizenship,
    arrival_date: arrivalDate,
    updated_at: new Date().toISOString(),
  });
  if (profileError) return { ok: false as const, error: "Could not save your profile yet." };

  const { error: housingError } = await supabase.from("housing_profiles").upsert({
    user_id: user.id,
    housing_status: housing,
    updated_at: new Date().toISOString(),
  });
  if (housingError) return { ok: false as const, error: "Could not save your housing status yet." };

  await supabase.from("consents").upsert({
    user_id: user.id,
    consent_key: "product_analytics",
    granted: true,
    policy_version: "2026-08-v1",
  }, { onConflict: "user_id,consent_key,policy_version" });

  redirect("/");
}
