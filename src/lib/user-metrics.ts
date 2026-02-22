import { createClient } from "./supabase/client";
const supabase=createClient();

let hasWarnedMissingLastOpenDateColumn = false;

function toLocalDateKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function fromDateKey(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  const parsed = new Date(year, month - 1, day);
  if (Number.isNaN(parsed.getTime())) return null;

  return parsed;
}

function diffCalendarDays(fromKey: string, toKey: string): number | null {
  const fromDate = fromDateKey(fromKey);
  const toDate = fromDateKey(toKey);

  if (!fromDate || !toDate) return null;

  const ms = toDate.getTime() - fromDate.getTime();
  return Math.round(ms / 86400000);
}

function includesColumnError(error: unknown, columnName: string) {
  const message = String((error as any)?.message ?? "").toLowerCase();
  return message.includes(columnName.toLowerCase()) && message.includes("column");
}

export async function syncOpenStreak(userId: string): Promise<number | null> {
  const todayKey = toLocalDateKey();

  const { data, error } = await supabase
    .from("users")
    .select("current_streak,last_open_date")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    if (includesColumnError(error, "last_open_date")) {
      if (!hasWarnedMissingLastOpenDateColumn) {
        hasWarnedMissingLastOpenDateColumn = true;
        console.warn(
          "users.last_open_date is missing. Add this column to enable cross-device streak sync."
        );
      }
      return null;
    }

    throw error;
  }

  if (!data) return null;

  const currentStreak = Math.max(Number(data.current_streak ?? 0), 0);
  const lastOpenDate =
    typeof (data as any)?.last_open_date === "string"
      ? (data as any).last_open_date
      : null;

  if (lastOpenDate === todayKey) {
    return currentStreak;
  }

  let nextStreak = 1;

  if (lastOpenDate) {
    const dayGap = diffCalendarDays(lastOpenDate, todayKey);
    nextStreak = dayGap === 1 ? currentStreak + 1 : 1;
  }

  const { error: updateError } = await supabase
    .from("users")
    .update({
      current_streak: nextStreak,
      last_open_date: todayKey,
    })
    .eq("id", userId);

  if (updateError) {
    if (includesColumnError(updateError, "last_open_date")) {
      if (!hasWarnedMissingLastOpenDateColumn) {
        hasWarnedMissingLastOpenDateColumn = true;
        console.warn(
          "users.last_open_date is missing. Add this column to enable cross-device streak sync."
        );
      }
      return null;
    }

    throw updateError;
  }

  return nextStreak;
}

export async function syncTraderDaysFromTrades(userId: string): Promise<number | null> {
  const { data, error } = await supabase
    .from("trades")
    .select("market_date")
    .eq("user_id", userId);

  if (error) {
    throw error;
  }

  const uniqueTradeDates = new Set<string>();

  for (const row of data ?? []) {
    const marketDate = typeof (row as any)?.market_date === "string" ? (row as any).market_date : "";
    if (marketDate) {
      uniqueTradeDates.add(marketDate);
    }
  }

  const traderDays = uniqueTradeDates.size;

  const { error: updateError } = await supabase
    .from("users")
    .update({ trader_days: traderDays })
    .eq("id", userId);

  if (updateError) {
    throw updateError;
  }

  return traderDays;
}