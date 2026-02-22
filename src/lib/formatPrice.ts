// utils/formatPrice.ts
import { MARKET_CURRENCY } from "./currency";

export function formatPrice(
  latest: number,
  market: string
): string {
  const symbol = MARKET_CURRENCY[market] ?? "";

  return `${symbol}${latest.toFixed(2)}`;
}