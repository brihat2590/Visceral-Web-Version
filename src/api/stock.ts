import { normalizeMarketRegion } from "@/lib/market-region";
import { StockDetail } from "../types/stock";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL 
const MARKETS_CACHE_KEY_PREFIX = "markets_payload_cache_v1";
const DEFAULT_MARKETS_CACHE_TTL_MS = 1000 * 60 * 60 * 12;
const STOCK_DETAILS_CACHE_KEY_PREFIX = "single_stock_payload_cache_v1";
const DEFAULT_STOCK_DETAILS_CACHE_TTL_MS = 1000 * 60 * 4;
const STOCK_DETAILS_CACHE_PERSIST_DEBOUNCE_MS = 320;

// Helper to handle SSR (Localstorage is only on client)
const isServer = typeof window === "undefined";

type FetchMarketsOptions = {
  forceFresh?: boolean;
  preferCache?: boolean;
  maxAgeMs?: number;
  fallbackToCacheOnError?: boolean;
};

type FetchStockDetailsOptions = {
  forceFresh?: boolean;
  preferCache?: boolean;
  maxAgeMs?: number;
  region?: string;
};

type MarketsPayload = {
  stocks: any[];
  server_now: string | null;
  [key: string]: any;
};

type MarketsCacheEnvelope = {
  savedAt: number;
  payload: MarketsPayload;
};

type StockDetailsCacheEnvelope = {
  savedAt: number;
  payload: StockDetail;
};

const marketsMemoryCache = new Map<string, MarketsCacheEnvelope | null>();
const marketsStorageReadPromise = new Map<string, Promise<MarketsCacheEnvelope | null>>();
const marketsPersistTimers = new Map<string, ReturnType<typeof setTimeout>>();
const stockDetailsMemoryCache = new Map<string, StockDetailsCacheEnvelope | null>();
const stockDetailsStorageReadPromise = new Map<string, Promise<StockDetailsCacheEnvelope | null>>();
const stockDetailsStorageReadResolved = new Set<string>();
const stockDetailsPersistTimers = new Map<string, ReturnType<typeof setTimeout>>();

// --- Normalization Helpers (Unchanged) ---

function normalizeRegion(value?: string) {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim().toUpperCase()
    : "";
}

function getMarketsCacheKey(region: string) {
  return `${MARKETS_CACHE_KEY_PREFIX}:${region || "GLOBAL"}`;
}

function normalizeTicker(value: string) {
  return value.trim().toUpperCase();
}

function normalizeRange(value: string) {
  return value.trim().toLowerCase() || "1d";
}

function normalizeStockRegion(value?: string) {
  return typeof value === "string" && value.trim()
    ? value.trim().toUpperCase()
    : "AUTO";
}

function getStockDetailsMemoryKey(ticker: string, range: string, region: string) {
  return `${ticker}:${range}:${region}`;
}

function getStockDetailsCacheKey(ticker: string, range: string, region: string) {
  return `${STOCK_DETAILS_CACHE_KEY_PREFIX}:${ticker}:${range}:${region}`;
}

function normalizeMarketsPayload(payload: any, serverNow: string | null): MarketsPayload {
  const normalizedPayload = Array.isArray(payload)
    ? { stocks: payload }
    : payload && typeof payload === "object"
    ? payload
    : { stocks: [] };

  return {
    ...normalizedPayload,
    server_now: serverNow,
  };
}

function normalizeLogoUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed || null;
}

function normalizeMarketsSymbol(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim().toUpperCase();
}

function buildMarketsLogoKey(row: any): string {
  const symbol = normalizeMarketsSymbol(row?.symbol);
  if (!symbol) return "";
  const market = normalizeMarketRegion(row?.market ?? row?.region);
  return `${market}:${symbol}`;
}

function mergeMarketsPayloadLogos(
  nextPayload: MarketsPayload,
  previousPayload?: MarketsPayload | null,
): MarketsPayload {
  if (!previousPayload) return nextPayload;

  const nextRows = Array.isArray(nextPayload.stocks) ? nextPayload.stocks : [];
  const previousRows = Array.isArray(previousPayload.stocks) ? previousPayload.stocks : [];
  if (nextRows.length === 0 || previousRows.length === 0) return nextPayload;

  const previousLogosByKey = new Map<string, string>();
  for (const row of previousRows) {
    const key = buildMarketsLogoKey(row);
    const logo = normalizeLogoUrl(row?.logo_url);
    if (!key || !logo || previousLogosByKey.has(key)) continue;
    previousLogosByKey.set(key, logo);
  }

  if (previousLogosByKey.size === 0) return nextPayload;

  let changed = false;
  const mergedRows = nextRows.map((row) => {
    if (normalizeLogoUrl(row?.logo_url)) return row;
    const key = buildMarketsLogoKey(row);
    if (!key) return row;
    const cachedLogo = previousLogosByKey.get(key);
    if (!cachedLogo) return row;
    changed = true;
    return { ...row, logo_url: cachedLogo };
  });

  if (!changed) return nextPayload;
  return { ...nextPayload, stocks: mergedRows };
}

function hasUsableMarketsPayload(payload: unknown): boolean {
  if (!payload || typeof payload !== "object") return false;
  const rows = Array.isArray((payload as any).stocks) ? (payload as any).stocks : [];
  if (rows.length > 0) return true;

  const regionKeys = ["active_regions", "active_markets", "regions_active", "markets_active"] as const;
  return regionKeys.some((key) => Array.isArray((payload as any)[key]) && (payload as any)[key].length > 0);
}

// --- Markets Cache Logic (Updated for Web) ---

async function readMarketsCache(region: string): Promise<MarketsCacheEnvelope | null> {
  if (isServer) return null;
  if (marketsMemoryCache.has(region)) return marketsMemoryCache.get(region) ?? null;

  const inFlight = marketsStorageReadPromise.get(region);
  if (inFlight) return inFlight;

  const request = (async () => {
    try {
      const raw = localStorage.getItem(getMarketsCacheKey(region));
      if (!raw) {
        marketsMemoryCache.set(region, null);
        return null;
      }
      const parsed = JSON.parse(raw) as Partial<MarketsCacheEnvelope>;
      if (!parsed || typeof parsed !== "object" || typeof parsed.savedAt !== "number") {
        marketsMemoryCache.set(region, null);
        return null;
      }

      const payload = normalizeMarketsPayload(
        parsed.payload,
        (parsed.payload as any)?.server_now ?? null,
      );
      const envelope: MarketsCacheEnvelope = { savedAt: parsed.savedAt, payload };
      marketsMemoryCache.set(region, envelope);
      return envelope;
    } catch {
      marketsMemoryCache.set(region, null);
      return null;
    }
  })();

  marketsStorageReadPromise.set(region, request);
  try {
    return await request;
  } finally {
    marketsStorageReadPromise.delete(region);
  }
}

function writeMarketsCache(region: string, payload: MarketsPayload) {
  if (isServer) return;
  const envelope: MarketsCacheEnvelope = { savedAt: Date.now(), payload };
  marketsMemoryCache.set(region, envelope);

  const existingTimer = marketsPersistTimers.get(region);
  if (existingTimer) clearTimeout(existingTimer);

  const timer = setTimeout(() => {
    marketsPersistTimers.delete(region);
    try {
      localStorage.setItem(getMarketsCacheKey(region), JSON.stringify(envelope));
    } catch (e) {
      // Keep markets flow stable
    }
  }, 250);

  marketsPersistTimers.set(region, timer);
}

// --- Stock Details Cache Logic (Updated for Web) ---

async function readStockDetailsCache(
  ticker: string,
  range: string,
  region: string,
): Promise<StockDetailsCacheEnvelope | null> {
  if (isServer) return null;
  const memoryKey = getStockDetailsMemoryKey(ticker, range, region);
  if (stockDetailsMemoryCache.has(memoryKey)) return stockDetailsMemoryCache.get(memoryKey) ?? null;

  const inFlight = stockDetailsStorageReadPromise.get(memoryKey);
  if (inFlight) return inFlight;

  if (stockDetailsStorageReadResolved.has(memoryKey)) return null;

  const request = (async (): Promise<StockDetailsCacheEnvelope | null> => {
    try {
      const raw = localStorage.getItem(getStockDetailsCacheKey(ticker, range, region));
      if (!raw) {
        stockDetailsMemoryCache.set(memoryKey, null);
        return null;
      }
      const parsed = JSON.parse(raw) as Partial<StockDetailsCacheEnvelope>;
      if (!parsed || typeof parsed !== "object" || typeof parsed.savedAt !== "number" || !parsed.payload) {
        stockDetailsMemoryCache.set(memoryKey, null);
        return null;
      }

      const envelope: StockDetailsCacheEnvelope = {
        savedAt: parsed.savedAt,
        payload: parsed.payload as StockDetail,
      };
      stockDetailsMemoryCache.set(memoryKey, envelope);
      return envelope;
    } catch {
      stockDetailsMemoryCache.set(memoryKey, null);
      return null;
    } finally {
      stockDetailsStorageReadPromise.delete(memoryKey);
      stockDetailsStorageReadResolved.add(memoryKey);
    }
  })();

  stockDetailsStorageReadPromise.set(memoryKey, request);
  return request;
}

function writeStockDetailsCache(
  ticker: string,
  range: string,
  region: string,
  payload: StockDetail,
) {
  if (isServer) return;
  const memoryKey = getStockDetailsMemoryKey(ticker, range, region);
  const envelope: StockDetailsCacheEnvelope = { savedAt: Date.now(), payload };

  stockDetailsMemoryCache.set(memoryKey, envelope);
  stockDetailsStorageReadResolved.add(memoryKey);

  const existingTimer = stockDetailsPersistTimers.get(memoryKey);
  if (existingTimer) clearTimeout(existingTimer);

  const timer = setTimeout(() => {
    stockDetailsPersistTimers.delete(memoryKey);
    try {
      localStorage.setItem(getStockDetailsCacheKey(ticker, range, region), JSON.stringify(envelope));
    } catch (e) {
      // Keep flow stable
    }
  }, STOCK_DETAILS_CACHE_PERSIST_DEBOUNCE_MS);

  stockDetailsPersistTimers.set(memoryKey, timer);
}

// --- API Methods (Unchanged URL Logic) ---

async function fetchMarketsFromApi(
  region: string,
  options: { bypassHttpCache?: boolean } = {},
  existingPayload?: MarketsPayload | null,
): Promise<MarketsPayload> {
  const query = region ? `?region=${encodeURIComponent(region)}` : "";
  const headers: Record<string, string> = {
    "Cache-Control": "no-cache, no-store, max-age=0",
    Pragma: "no-cache",
  };
  if (options.bypassHttpCache) headers["X-Refresh-Hint"] = Date.now().toString();

  const url = `${BASE_URL}/markets${query}`;
  const res = await fetch(url, { cache: "no-store", headers });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok && !hasUsableMarketsPayload(payload)) {
    throw new Error(`Failed to fetch markets (${res.status})`);
  }
  const serverDateHeader = res.headers.get("date");
  const normalized = normalizeMarketsPayload(payload, serverDateHeader ?? null);
  const merged = mergeMarketsPayloadLogos(normalized, existingPayload);
  writeMarketsCache(region, merged);
  return merged;
}

async function fetchStockDetailsFromApi(
  ticker: string,
  range: string,
  region: string,
): Promise<StockDetail> {
  const params = new URLSearchParams({ range, stream: "false" });
  if (region !== "AUTO") params.set("region", region);

  const res = await fetch(
    `${BASE_URL}/single-stock/${encodeURIComponent(ticker)}?${params.toString()}`,
  );
  const payload = (await res.json()) as StockDetail;
  if (!res.ok) throw new Error("Failed to fetch stock details");

  writeStockDetailsCache(ticker, range, region, payload);
  return payload;
}

export async function fetchStockDetails(
  ticker: string,
  range: string = "1d",
  options: FetchStockDetailsOptions = {},
): Promise<StockDetail> {
  const safeTicker = normalizeTicker(ticker);
  const safeRange = normalizeRange(range);
  const safeRegion = normalizeStockRegion(options.region);
  if (!safeTicker) throw new Error("Ticker is required.");

  const forceFresh = options.forceFresh ?? false;
  const preferCache = options.preferCache ?? true;
  const maxAgeMs = options.maxAgeMs ?? DEFAULT_STOCK_DETAILS_CACHE_TTL_MS;
  const cached = await readStockDetailsCache(safeTicker, safeRange, safeRegion);
  const cacheAgeMs = cached ? Date.now() - cached.savedAt : Number.MAX_SAFE_INTEGER;
  const hasFreshCache = !!cached && cacheAgeMs <= maxAgeMs;

  if (cached && preferCache && !forceFresh) {
    if (!hasFreshCache) {
      void fetchStockDetailsFromApi(safeTicker, safeRange, safeRegion).catch(() => {});
    }
    return cached.payload;
  }

  try {
    return await fetchStockDetailsFromApi(safeTicker, safeRange, safeRegion);
  } catch (error) {
    if (cached) return cached.payload;
    throw error;
  }
}

// --- Streaming Logic (Updated for Web EventSource) ---

export function openStockDetailsStream(
  ticker: string,
  range: string,
  onMessage: (data: any) => void,
  onError?: (error: unknown) => void
) {
  if (isServer) return () => {};
  
  const url = `${BASE_URL}/single-stock/${ticker}?range=${range}&stream=true`;
  const source = new EventSource(url);

  source.onmessage = (event) => {
    if (!event.data) return;
    try {
      const parsed = JSON.parse(event.data);
      onMessage(parsed);
    } catch (error) {
      onError?.(error);
    }
  };

  source.onerror = (event) => {
    onError?.(event);
  };

  return () => {
    source.close();
  };
}

export async function searchStock(query: string) {
  const res = await fetch(`${BASE_URL}/search?q=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error("No ticker found");
  return res.json();
}

export async function getMarketData(userId: string) {
  const res = await fetch(`${BASE_URL}/home?userId=${userId}`);
  if (!res.ok) throw new Error("Failed to fetch market data");
  return res.json();
}

export async function fetchMarkets(region?: string, options: FetchMarketsOptions = {}) {
  const normalizedRegion = normalizeRegion(region);
  const forceFresh = options.forceFresh ?? false;
  const preferCache = options.preferCache ?? true;
  const maxAgeMs = options.maxAgeMs ?? DEFAULT_MARKETS_CACHE_TTL_MS;
  const fallbackToCacheOnError = options.fallbackToCacheOnError ?? true;
  const cached = await readMarketsCache(normalizedRegion);
  const cacheAgeMs = cached ? Date.now() - cached.savedAt : Number.MAX_SAFE_INTEGER;
  const hasFreshCache = !!cached && cacheAgeMs <= maxAgeMs;

  if (cached && preferCache && !forceFresh) {
    if (!hasFreshCache) {
      void fetchMarketsFromApi(
        normalizedRegion,
        { bypassHttpCache: true },
        cached.payload,
      ).catch(() => {});
    }
    return cached.payload;
  }

  try {
    return await fetchMarketsFromApi(normalizedRegion, {
      bypassHttpCache: forceFresh,
    }, cached?.payload);
  } catch (error) {
    if (cached && fallbackToCacheOnError) return cached.payload;
    throw error;
  }
}