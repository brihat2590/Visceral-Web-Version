export type SearchAssetType = "EQUITY" | "ETF" | "CRYPTO";

export type SearchStockResult = {
  symbol: string;
  name?: string;
  market?: string;
  quoteType?: string;
  typeDisplay?: string;
  exchange?: string;
  exchangeDisplay?: string;
  company_name?: string;
  logo_url?: string;
};

export type SearchStocksResponse = {
  query: string;
  count: number;
  results: SearchStockResult[];
};

export async function searchStocks(
  q: string,
  signal?: AbortSignal,
  assetType?: SearchAssetType
): Promise<SearchStocksResponse> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  const params = new URLSearchParams({ q });

  if (assetType) {
    params.set("type", assetType);
  }

  const res = await fetch(`${baseUrl}/search?${params.toString()}`, { signal });
  const raw = await res.text();

  let json: unknown = null;

  if (raw) {
    try {
      json = JSON.parse(raw);
    } catch {
      // Backend can return plain-text failures like "Internal Server Error".
      // Do not crash search UX on non-JSON responses.
      if (!res.ok) {
        return { query: q, count: 0, results: [] };
      }

      throw new Error(`Search response is not valid JSON (status ${res.status}).`);
    }
  }

  if (!res.ok) {
    return { query: q, count: 0, results: [] };
  }

  if (!json) {
    return { query: q, count: 0, results: [] };
  }

  let normalizedQuery = q;
  let parsedCount = 0;
  let parsedResults: SearchStockResult[] = [];

  if (Array.isArray(json)) {
    parsedResults = json as SearchStockResult[];
  } else if (typeof json === "object" && json !== null) {
    const payload = json as {
      query?: unknown;
      count?: unknown;
      results?: unknown;
    };

    if (typeof payload.query === "string") {
      normalizedQuery = payload.query;
    }

    if (Array.isArray(payload.results)) {
      parsedResults = payload.results as SearchStockResult[];
    } else if ("symbol" in payload) {
      parsedResults = [payload as SearchStockResult];
    }

    if (typeof payload.count === "number" && Number.isFinite(payload.count)) {
      parsedCount = Math.max(0, Math.trunc(payload.count));
    }
  }

  const safeResults = parsedResults.filter(
    (item): item is SearchStockResult =>
      !!item && typeof item.symbol === "string" && item.symbol.trim().length > 0,
  );

  const count = parsedCount > 0 ? parsedCount : safeResults.length;

  return {
    query: normalizedQuery,
    count,
    results: safeResults,
  };
}