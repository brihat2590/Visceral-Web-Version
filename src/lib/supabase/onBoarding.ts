import { SupabaseClient } from "@supabase/supabase-js";

export type UserOnboardingState = {
  intent: string;     // "pending" or actual value
  experience: string; // "pending" or actual value
};

export type OnboardingRedirectPath =
  | "/intent-creation"
  | "/market-experience"
  | "/first-entry";

// Mirrors normalizeOnboardingValue() in your mobile lib/useNewRedirect.ts
function normalizeOnboardingValue(value: unknown): string {
  if (typeof value === "string" && value.trim().length > 0) {
    return value.trim();
  }
  return "pending";
}

// Mirrors isPhoneUniqueConstraintError() — used in signup
export function isPhoneUniqueConstraintError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const candidate = error as Record<string, unknown>;
  const code = typeof candidate.code === "string" ? candidate.code : "";
  if (code && code !== "23505") return false;
  const serialized = [
    typeof candidate.message === "string" ? candidate.message : "",
    typeof candidate.details === "string" ? candidate.details : "",
    typeof candidate.hint === "string" ? candidate.hint : "",
  ]
    .join(" ")
    .toLowerCase();
  return (
    serialized.includes("users_ph_number_key") ||
    serialized.includes("ph_number")
  );
}

// Mirrors ensureUserRow() in your mobile lib/useNewRedirect.ts
async function ensureUserRow(
  supabase: SupabaseClient,
  user: { id: string; email?: string | null }
) {
  const { error } = await supabase.from("users").upsert(
    {
      id: user.id,
      email: user.email ?? null,
      intent: "pending",
      experience: "pending",
      available_balance: 100000,
      current_streak: 0,
      trader_days: 0,
      trade_history_privy: true,
      created_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  );
  if (error) throw error;
}

// Mirrors getUserOnboardingState() in your mobile lib/useNewRedirect.ts
export async function getUserOnboardingState(
  supabase: SupabaseClient
): Promise<UserOnboardingState> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("users")
    .select("intent, experience")
    .eq("id", user.id)
    .maybeSingle();

  if (error) throw error;

  // New user — row doesn't exist yet, create it
  if (!data) {
    await ensureUserRow(supabase, user);
    return { intent: "pending", experience: "pending" };
  }

  return {
    intent: normalizeOnboardingValue(data.intent),
    experience: normalizeOnboardingValue(data.experience),
  };
}

// Mirrors getOnboardingRedirectPath() in your mobile lib/useNewRedirect.ts
export function getOnboardingRedirectPath(
  onboarding: UserOnboardingState | null
): OnboardingRedirectPath {
  if (!onboarding) return "/intent-creation";
  if (normalizeOnboardingValue(onboarding.intent) === "pending") {
    return "/intent-creation";
  }
  if (normalizeOnboardingValue(onboarding.experience) === "pending") {
    return "/market-experience";
  }
  return "/first-entry";
}