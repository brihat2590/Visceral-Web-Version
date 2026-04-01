import { createClient } from "@/lib/supabase/client";

export async function addToAlmanack(userId: string, reflection: string) {
  const today = new Date().toISOString().split("T")[0];
  const supabase = createClient();

  const { error } = await supabase
    .from("almanack")
    .upsert(
      [
        {
          user_id: userId,
          user_reflection: reflection,
          market_date: today,
        },
      ],
      {
        onConflict: "user_id,market_date",
        ignoreDuplicates: false,
      }
    );

  return !error;
}