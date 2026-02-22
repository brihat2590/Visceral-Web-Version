import { normalizeMarketRegion } from "@/lib/market-region";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BASE_URL ;
const WATCHLIST_CACHE_KEY_PREFIX = "watchlist_cache_v1";
const WATCHLIST_CACHE_TTL_MS = 1000 * 60 * 30;

// Helper to check if we are in the browser
const isClient = typeof window !== "undefined";

export type WatchlistItem = {
  symbol: string;
  added_at?: string;
  market?: string;
  region?: string;
  company_name?: string;
  name?: string;
  logo_url?: string;
};

export type WatchlistResponse = {
  count: number;
  watchlist: WatchlistItem[];
};

type WatchlistFetchOptions = {
  forceFresh?: boolean;
  preferCache?: boolean;
  maxAgeMs?: number;
  fallbackToCacheOnError?: boolean;
};

type WatchlistCacheEnvelope = {
  savedAt: number;
  payload: WatchlistResponse;
};

const watchlistMemoryCache = new Map<string, WatchlistCacheEnvelope>();
const watchlistStorageReadPromise = new Map<string, Promise<WatchlistCacheEnvelope | null>>();
const watchlistStorageReadResolved = new Set<string>();
const watchlistPersistTimers = new Map<string, ReturnType<typeof setTimeout>>();

// --- Helpers ---

function getWatchlistCacheKey(userId: string) {
  return `${WATCHLIST_CACHE_KEY_PREFIX}:${userId}`;
}

function normalizeWatchlistResponse(payload: any): WatchlistResponse {
  const watchlist = Array.isArray(payload?.watchlist) ? payload.watchlist : [];
  return {
    count:
      typeof payload?.count === "number" && Number.isFinite(payload.count)
        ? payload.count
        : watchlist.length,
    watchlist,
  };
}

function normalizeSymbol(value: unknown) {
  if (typeof value !== "string") return "";
  return value.trim().toUpperCase();
}

function normalizeMarket(value: unknown) {
  return normalizeMarketRegion(value);
}

// --- Storage Logic ---

async function readWatchlistCache(userId: string): Promise<WatchlistCacheEnvelope | null> {
  // SSR Guard
  if (!isClient) return null;

  const fromMemory = watchlistMemoryCache.get(userId);
  if (fromMemory) return fromMemory;

  if (watchlistStorageReadResolved.has(userId)) return null;

  const inFlight = watchlistStorageReadPromise.get(userId);
  if (inFlight) return inFlight;

  const request = (async () => {
    try {
      const raw = localStorage.getItem(getWatchlistCacheKey(userId));
      if (!raw) {
        watchlistStorageReadResolved.add(userId);
        return null;
      }

      const parsed = JSON.parse(raw) as Partial<WatchlistCacheEnvelope>;
      if (!parsed || typeof parsed !== "object" || typeof parsed.savedAt !== "number") {
        watchlistStorageReadResolved.add(userId);
        return null;
      }

      const envelope: WatchlistCacheEnvelope = {
        savedAt: parsed.savedAt,
        payload: normalizeWatchlistResponse(parsed.payload),
      };
      watchlistMemoryCache.set(userId, envelope);
      watchlistStorageReadResolved.add(userId);
      return envelope;
    } catch {
      watchlistStorageReadResolved.add(userId);
      return null;
    }
  })();

  watchlistStorageReadPromise.set(userId, request);
  try {
    return await request;
  } finally {
    watchlistStorageReadPromise.delete(userId);
  }
}

function writeWatchlistCache(userId: string, payload: WatchlistResponse) {
  if (!isClient) return;

  const envelope: WatchlistCacheEnvelope = {
    savedAt: Date.now(),
    payload: normalizeWatchlistResponse(payload),
  };
  watchlistMemoryCache.set(userId, envelope);
  watchlistStorageReadResolved.add(userId);

  const existingTimer = watchlistPersistTimers.get(userId);
  if (existingTimer) clearTimeout(existingTimer);

  const timer = setTimeout(() => {
    watchlistPersistTimers.delete(userId);
    try {
      localStorage.setItem(getWatchlistCacheKey(userId), JSON.stringify(envelope));
    } catch {
      // Keep app stable if storage is full/unavailable
    }
  }, 220);

  watchlistPersistTimers.set(userId, timer);
}

async function updateWatchlistCache(
  userId: string,
  updater: (current: WatchlistResponse) => WatchlistResponse,
) {
  const cached = await readWatchlistCache(userId);
  if (!cached) return;

  const next = updater(cached.payload);
  writeWatchlistCache(userId, normalizeWatchlistResponse(next));
}

// --- API Methods ---

async function fetchWatchlistFromApi(
  userId: string,
  options: { bypassHttpCache?: boolean } = {},
): Promise<WatchlistResponse> {
  const params = new URLSearchParams({ user_id: userId });
  const headers: Record<string, string> = {
    "Cache-Control": "no-cache, no-store, max-age=0",
    Pragma: "no-cache",
  };
  if (options.bypassHttpCache) {
    headers["X-Refresh-Hint"] = Date.now().toString();
  }

  const res = await fetch(`${BACKEND_URL}/watchlist?${params.toString()}`, {
    cache: "no-store",
    headers,
  });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`Failed to fetch watchlist (${res.status})`);
  }
  const normalized = normalizeWatchlistResponse(payload);
  writeWatchlistCache(userId, normalized);
  return normalized;
}

export async function addToWatchlist(
  userId: string,
  symbol: string,
  market: string
) {
  const res = await fetch(
    `${BACKEND_URL}/watchlist/add?user_id=${userId}&symbol=${symbol}&market=${market}`,
    { method: "POST" }
  );

  const payload = await res.json().catch(() => ({} as any));
  const status = typeof payload?.status === "string" ? payload.status.toUpperCase() : "";

  if (status === "ADDED" || status === "ALREADY_EXISTS") {
    const normalizedSymbol = normalizeSymbol(symbol);
    const normalizedMarket = normalizeMarket(market);

    if (normalizedSymbol) {
      await updateWatchlistCache(userId, (current) => {
        const alreadyExists = current.watchlist.some((item) => {
          const itemSymbol = normalizeSymbol(item?.symbol);
          const itemMarket = normalizeMarket(item?.market ?? item?.region);
          return itemSymbol === normalizedSymbol && itemMarket === normalizedMarket;
        });

        if (alreadyExists) return current;

        const nextWatchlist = [
          ...current.watchlist,
          {
            symbol: normalizedSymbol,
            market: normalizedMarket,
            region: normalizedMarket,
          },
        ];

        return {
          count: nextWatchlist.length,
          watchlist: nextWatchlist,
        };
      });
    }
  }
  return payload;
}

export async function removeFromWatchlist(
  userId: string,
  symbol: string,
  market: string
) {
  const res = await fetch(
    `${BACKEND_URL}/watchlist/remove?user_id=${userId}&symbol=${symbol}&market=${market}`,
    { method: "DELETE" }
  );

  const payload = await res.json().catch(() => ({} as any));
  const normalizedSymbol = normalizeSymbol(symbol);
  const normalizedMarket = normalizeMarket(market);

  if (normalizedSymbol) {
    await updateWatchlistCache(userId, (current) => {
      const nextWatchlist = current.watchlist.filter((item) => {
        const itemSymbol = normalizeSymbol(item?.symbol);
        const itemMarket = normalizeMarket(item?.market ?? item?.region);
        return !(itemSymbol === normalizedSymbol && itemMarket === normalizedMarket);
      });

      return {
        count: nextWatchlist.length,
        watchlist: nextWatchlist,
      };
    });
  }
  return payload;
}

export async function getWatchList(
  userId: string,
  options: WatchlistFetchOptions = {},
) {
  const forceFresh = options.forceFresh ?? false;
  const preferCache = options.preferCache ?? true;
  const maxAgeMs = options.maxAgeMs ?? WATCHLIST_CACHE_TTL_MS;
  const fallbackToCacheOnError = options.fallbackToCacheOnError ?? true;

  const cached = await readWatchlistCache(userId);
  const cacheAgeMs = cached ? Date.now() - cached.savedAt : Number.MAX_SAFE_INTEGER;
  const hasFreshCache = !!cached && cacheAgeMs <= maxAgeMs;

  if (cached && preferCache && !forceFresh) {
    if (!hasFreshCache) {
      void fetchWatchlistFromApi(userId, { bypassHttpCache: true }).catch(() => {});
    }
    return cached.payload;
  }

  try {
    return await fetchWatchlistFromApi(userId, { bypassHttpCache: forceFresh });
  } catch (error) {
    if (cached && fallbackToCacheOnError) {
      return cached.payload;
    }
    throw error;
  }
}