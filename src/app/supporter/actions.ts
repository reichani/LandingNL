"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const emailSchema = z.string().email().max(254);

export async function getActiveSupporter() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Sign in before managing supporter access." };

  const { data, error } = await supabase
    .from("trusted_supporters")
    .select("supporter_email,created_at")
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  if (error) return { ok: false as const, error: "Could not load supporter access yet." };
  return {
    ok: true as const,
    supporter: data ? { email: data.supporter_email, createdAt: data.created_at } : null,
  };
}

export async function createSupporter(email: string) {
  const parsed = emailSchema.safeParse(email);
  if (!parsed.success) return { ok: false as const, error: "Enter a valid supporter email." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Sign in before sharing your progress." };

  const token = `${crypto.randomUUID()}-${crypto.randomUUID()}`;
  const { error } = await supabase.rpc("create_trusted_supporter", {
    p_email: parsed.data,
    p_token: token,
  });

  if (error) return { ok: false as const, error: "Could not create the supporter link yet." };
  return { ok: true as const, token, email: parsed.data };
}

export async function revokeSupporter() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Sign in before changing supporter access." };

  const { error } = await supabase
    .from("trusted_supporters")
    .update({ status: "revoked", revoked_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .eq("status", "active");

  if (error) return { ok: false as const, error: "Could not revoke access yet." };
  return { ok: true as const };
}
