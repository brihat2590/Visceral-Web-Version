import { createClient } from "./supabase/client";
const supabase=createClient();

export async function shouldShowFinancialGuide(userId: string) {
  if (!userId) return false;

  const { data, error } = await supabase
    .from("users")
    .select("guide")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;

  return data?.guide === true;
}

export async function markFinancialGuideSeen(userId: string) {
  if (!userId) return;

  const { error } = await supabase
    .from("users")
    .update({ guide: false })
    .eq("id", userId);

  if (error) throw error;
}