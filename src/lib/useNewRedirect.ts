"use server";

import { create } from "domain";
import { createClient } from "./supabase/server";

export type UserOnboardingState = {
  intent: string | null;
  experience: string | null;
};

export type OnboardingRedirectPath =
  | "/intent-setting"
  | "/market-experience"
  | "/first-entry";

function normalizeOnboardingValue(value: unknown) {
  if (typeof value !== "string") return "pending";
  const trimmed = value.trim();
  return trimmed || "pending";
}

async function ensureUserRow(
  supabase: ReturnType<typeof createClient>,
  user: {
    id: string;
    email?: string | null;
    user_metadata?: Record<string, unknown> | null;
  }
) {
  const metadata = user.user_metadata ?? {};

  const payload = {
    id: user.id,
    email: user.email ?? null,
    username:
      typeof metadata.username === "string"
        ? metadata.username.trim()
        : null,
    ph_number:
      typeof metadata.ph_number === "string"
        ? metadata.ph_number.trim()
        : null,
    user_logo: null,
    intent: "pending",
    experience: "pending",
    available_balance: 100000,
    current_streak: 0,
    trader_days: 0,
    trade_history_privy: true,
    created_at: new Date().toISOString(),
  };

  const { error } =await supabase
    .from("users")
    .upsert(payload, { onConflict: "id" });

  if (error) throw error;
}

export async function getUserOnboardingState(): Promise<UserOnboardingState | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from("users")
    .select("intent, experience")
    .eq("id", user.id)
    .maybeSingle();

  if (error) throw error;

  if (!data) {
    await ensureUserRow(supabase, user);
    return { intent: "pending", experience: "pending" };
  }

  return {
    intent: normalizeOnboardingValue(data.intent),
    experience: normalizeOnboardingValue(data.experience),
  };
}

export function getOnboardingRedirectPath(
  onboarding: UserOnboardingState | null
): OnboardingRedirectPath {
  if (!onboarding) return "/intent-setting";
  if (normalizeOnboardingValue(onboarding.intent) === "pending") {
    return "/intent-setting";
  }
  if (normalizeOnboardingValue(onboarding.experience) === "pending") {
    return "/market-experience";
  }
  return "/first-entry";
}