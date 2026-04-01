
const BASE_URL = "/api/trade";
type TradePayload = {
  user_id: string;
  symbol: string;
  region: string;
  quantity: number;
};

async function parseResponseError(res: Response, fallback: string) {
  const raw = await res.text().catch(() => "");
  if (!raw) return fallback;

  try {
    const parsed = JSON.parse(raw) as { detail?: string; message?: string };
    if (typeof parsed.detail === "string" && parsed.detail.trim()) return parsed.detail;
    if (typeof parsed.message === "string" && parsed.message.trim()) return parsed.message;
    return fallback;
  } catch {
    return raw;
  }
}

export async function buyStock(payload: TradePayload) {
  const res = await fetch(
    `${BASE_URL}/buy?user_id=${payload.user_id}&region=${payload.region}&quantity=${payload.quantity}&symbol=${payload.symbol}`,
    {
      method: "POST",
    }
  );

  if (!res.ok) {
    throw new Error(await parseResponseError(res, "Buy failed"));
  }

  return res.json().catch(() => ({}));
}

export async function sellStock(payload: TradePayload) {
  const res = await fetch(
    `${BASE_URL}/sell?user_id=${payload.user_id}&region=${payload.region}&symbol=${payload.symbol}&quantity=${payload.quantity}`,
    {
      method: "POST",
    }
  );

  if (!res.ok) {
    throw new Error(await parseResponseError(res, "Sell failed"));
  }

  return res.json().catch(() => ({}));
}

  