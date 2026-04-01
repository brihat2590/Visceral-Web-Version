type TradeConfirmationPayload = {
  side: "BUY" | "SELL";
  symbol: string;
  quantity: number;
};

export async function maybeSendTradeConfirmationNotification(
  payload: TradeConfirmationPayload
) {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return;
  }

  if (Notification.permission !== "granted") {
    return;
  }

  const sideLabel = payload.side === "BUY" ? "Buy" : "Sell";
  const safeSymbol = payload.symbol.trim().toUpperCase();

  new Notification(`${sideLabel} confirmed`, {
    body: `${payload.quantity} ${safeSymbol} placed successfully.`,
    tag: `trade-${payload.side.toLowerCase()}-${safeSymbol}`,
  });
}
