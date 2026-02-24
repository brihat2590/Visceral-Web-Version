/**
 * Browser-compatible version of Security Logo Cache
 * Replaces AsyncStorage with window.localStorage
 */
import {
    inferMarketRegionFromSymbol,
    normalizeMarketRegion,
  } from "@/lib/market-region";
  
  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://127.0.0.1:8000";
  const COINCAP_CRYPTO_ICON_BASE_URL = "https://assets.coincap.io/assets/icons";
  const FINNHUB_STATIC_LOGO_BASE_URL =
    "https://static2.finnhub.io/file/publicdatany/finnhubimage/stock_logo";
  const SECURITY_LOGO_CACHE_KEY = "security_logo_cache_v2";
  const SECURITY_LOGO_CACHE_LEGACY_KEY = "security_logo_cache_v1";
  const SECURITY_LOGO_CACHE_VERSION = 2;
  const SECURITY_LOGO_MISS_TTL_MS = 1000 * 60 * 4;
  const SECURITY_LOGO_MISS_RETRY_INTERVAL_MS = 1000 * 20;
  const SECURITY_LOGO_PERSIST_DEBOUNCE_MS = 700;
  const SECURITY_LOGO_MAX_CACHE_ENTRIES = 4500;
  const BROKEN_LOGO_URL_TTL_MS = 1000 * 60 * 20;
  const BROKEN_LOGO_MAX_ENTRIES = 3000;
  const STATIC_LOGO_SYMBOL_ALIASES: Record<string, string[]> = {
    "BRK.B": ["BRK-B"],
    "BRK-B": ["BRK.B"],
    META: ["FB"],
  };
  const CRYPTO_LOGO_SYMBOL_ALIASES: Record<string, string[]> = {
    XBT: ["BTC"],
  };
  
  type SecurityLogoCacheEntry = {
    url: string;
    updatedAt: number;
    lastAccessAt: number;
  };
  
  type SecurityLogoCacheV1Payload = Record<string, { url: string; updatedAt: number }>;
  
  type SecurityLogoCacheV2Payload = {
    version: number;
    savedAt: number;
    entries: Record<
      string,
      {
        url: string;
        updatedAt: number;
        lastAccessAt?: number;
      }
    >;
  };
  
  type LogoFetchResult =
    | {
        kind: "hit";
        url: string;
        resolvedSymbol: string;
      }
    | { kind: "not_found" }
    | { kind: "aborted" }
    | { kind: "error" };
  
  type MissCacheEntry = {
    expiresAt: number;
    lastAttemptAt: number;
  };
  
  export type SecurityLogoLookup = {
    symbol: string;
    market: string;
  };
  
  let cacheHydrated = false;
  let hydratePromise: Promise<void> | null = null;
  let persistPromise: Promise<void> | null = null;
  let persistTimer: ReturnType<typeof setTimeout> | null = null;
  let cacheDirty = false;
  
  const securityLogoHitCache = new Map<string, SecurityLogoCacheEntry>();
  const securityLogoMissCache = new Map<string, MissCacheEntry>();
  const inFlightLogoRequests = new Map<string, Promise<string | null>>();
  const brokenLogoUrlRegistry = new Map<string, number>();
  
  // Helper for Browser storage access
  const isServer = typeof window === "undefined";
  
  function normalizeSymbol(value: unknown): string {
    if (typeof value !== "string") return "";
    return value.trim().toUpperCase();
  }
  
  function normalizeMarket(value: unknown): string {
    return normalizeMarketRegion(value, "US");
  }
  
  function normalizeLogoUrl(value: unknown): string | null {
    if (typeof value !== "string") return null;
    const trimmed = value.trim();
    return trimmed || null;
  }
  
  function pruneBrokenLogoRegistry() {
    const now = Date.now();
  
    for (const [url, markedAt] of brokenLogoUrlRegistry.entries()) {
      if (now - markedAt > BROKEN_LOGO_URL_TTL_MS) {
        brokenLogoUrlRegistry.delete(url);
      }
    }
  
    if (brokenLogoUrlRegistry.size <= BROKEN_LOGO_MAX_ENTRIES) {
      return;
    }
  
    const overflow = brokenLogoUrlRegistry.size - BROKEN_LOGO_MAX_ENTRIES;
    const ranked = Array.from(brokenLogoUrlRegistry.entries()).sort((a, b) => a[1] - b[1]);
    for (let index = 0; index < overflow; index += 1) {
      const url = ranked[index]?.[0];
      if (!url) continue;
      brokenLogoUrlRegistry.delete(url);
    }
  }
  
  function markBrokenLogoUrl(url: string) {
    const normalizedLogoUrl = normalizeLogoUrl(url);
    if (!normalizedLogoUrl) return;
    brokenLogoUrlRegistry.set(normalizedLogoUrl, Date.now());
    pruneBrokenLogoRegistry();
  }
  
  function isBrokenLogoUrl(url: string): boolean {
    const normalizedLogoUrl = normalizeLogoUrl(url);
    if (!normalizedLogoUrl) return false;
  
    const markedAt = brokenLogoUrlRegistry.get(normalizedLogoUrl);
    if (!markedAt) return false;
    if (Date.now() - markedAt > BROKEN_LOGO_URL_TTL_MS) {
      brokenLogoUrlRegistry.delete(normalizedLogoUrl);
      return false;
    }
    return true;
  }
  
  function getCacheKey(symbol: string, market: string): string {
    return `${normalizeMarket(market)}:${normalizeSymbol(symbol)}`;
  }
  
  function getRootSymbol(symbol: string): string {
    const normalized = normalizeSymbol(symbol);
    if (!normalized) return "";
  
    const tokens = normalized.split(/[._\-/:]/).filter(Boolean);
    if (tokens.length < 2) return "";
    return tokens[0] ?? "";
  }
  
  function getSymbolCandidates(symbol: string, market: string): string[] {
    const normalizedSymbol = normalizeSymbol(symbol);
    if (!normalizedSymbol) return [];
  
    const normalizedMarket = normalizeMarket(market);
    const candidates = new Set<string>([normalizedSymbol]);
  
    const root = getRootSymbol(normalizedSymbol);
    if (root && root !== normalizedSymbol) {
      candidates.add(root);
    }
  
    if (normalizedMarket === "CRYPTO") {
      const usdPairBase = normalizedSymbol.replace(/-USD$/i, "");
      if (usdPairBase && usdPairBase !== normalizedSymbol) {
        candidates.add(usdPairBase);
      }
    }
  
    return Array.from(candidates);
  }
  
  function getMarketCandidates(symbol: string, market: string): string[] {
    const normalizedMarket = normalizeMarket(market);
    const inferredMarket = normalizeMarket(inferMarketRegionFromSymbol(symbol));
    const markets = new Set<string>([normalizedMarket, inferredMarket]);
  
    if (normalizeSymbol(symbol).endsWith("-USD")) {
      markets.add("CRYPTO");
    }
  
    return Array.from(markets).filter(Boolean);
  }
  
  function getLookupKeys(symbol: string, market: string): string[] {
    const normalizedMarket = normalizeMarket(market);
    const symbols = getSymbolCandidates(symbol, normalizedMarket);
    return symbols.map((symbolCandidate) => getCacheKey(symbolCandidate, normalizedMarket));
  }
  
  function isCryptoLikeLookup(symbol: string, market: string): boolean {
    const normalizedSymbol = normalizeSymbol(symbol);
    const normalizedMarket = normalizeMarket(market);
    return normalizedMarket === "CRYPTO" || normalizedSymbol.endsWith("-USD");
  }
  
  function getStaticLogoSymbolCandidates(symbol: string): string[] {
    const normalizedSymbol = normalizeSymbol(symbol);
    if (!normalizedSymbol) return [];
  
    const candidates = new Set<string>([normalizedSymbol]);
    const rootSymbol = getRootSymbol(normalizedSymbol);
  
    if (rootSymbol && rootSymbol !== normalizedSymbol) {
      candidates.add(rootSymbol);
    }
  
    if (normalizedSymbol.includes(".")) {
      candidates.add(normalizedSymbol.replace(/\./g, "-"));
    }
    if (normalizedSymbol.includes("-")) {
      candidates.add(normalizedSymbol.replace(/-/g, "."));
    }
  
    const aliases = STATIC_LOGO_SYMBOL_ALIASES[normalizedSymbol] ?? [];
    for (const alias of aliases) {
      const normalizedAlias = normalizeSymbol(alias);
      if (normalizedAlias) {
        candidates.add(normalizedAlias);
      }
    }
  
    return Array.from(candidates);
  }
  
  function getCryptoLogoSymbolCandidates(symbol: string): string[] {
    const normalizedSymbol = normalizeSymbol(symbol);
    if (!normalizedSymbol) return [];
  
    const candidates = new Set<string>();
    const tokens = normalizedSymbol.split(/[./:_-]/).filter(Boolean);
    const rootSymbol = getRootSymbol(normalizedSymbol);
  
    candidates.add(normalizedSymbol);
    if (rootSymbol && rootSymbol !== normalizedSymbol) {
      candidates.add(rootSymbol);
    }
    if (tokens.length > 0) {
      const firstToken = tokens[0] ?? "";
      if (firstToken) {
        candidates.add(firstToken);
      }
    }
  
    if (normalizedSymbol.endsWith("-USD")) {
      const usdPairBase = normalizedSymbol.replace(/-USD$/i, "");
      if (usdPairBase) {
        candidates.add(usdPairBase);
      }
    }
  
    const withQuoteSuffixRemoved = normalizedSymbol.replace(/(USDT|USD|USDC)$/i, "");
    if (withQuoteSuffixRemoved && withQuoteSuffixRemoved !== normalizedSymbol) {
      candidates.add(withQuoteSuffixRemoved);
    }
  
    const aliasesToCheck = Array.from(candidates);
    for (const candidate of aliasesToCheck) {
      const aliases = CRYPTO_LOGO_SYMBOL_ALIASES[candidate] ?? [];
      for (const alias of aliases) {
        const normalizedAlias = normalizeSymbol(alias);
        if (normalizedAlias) {
          candidates.add(normalizedAlias);
        }
      }
    }
  
    return Array.from(candidates).filter(Boolean);
  }
  
  function isAbortError(error: unknown): boolean {
    if (!error) return false;
    if (typeof error === "object" && "name" in error && (error as any).name === "AbortError") {
      return true;
    }
  
    const message = String((error as any)?.message ?? error).toLowerCase();
    return message.includes("abort");
  }
  
  function cleanupExpiredMisses() {
    const now = Date.now();
    for (const [key, missEntry] of securityLogoMissCache.entries()) {
      if (missEntry.expiresAt <= now) {
        securityLogoMissCache.delete(key);
      }
    }
  }
  
  function hasFreshMiss(key: string, markRetryAttempt: boolean = false): boolean {
    const missEntry = securityLogoMissCache.get(key);
    if (!missEntry) return false;
  
    const now = Date.now();
    if (missEntry.expiresAt <= now) {
      securityLogoMissCache.delete(key);
      return false;
    }
  
    const lastAttemptAt =
      Number.isFinite(missEntry.lastAttemptAt) && missEntry.lastAttemptAt > 0
        ? missEntry.lastAttemptAt
        : now;
    if (now - lastAttemptAt < SECURITY_LOGO_MISS_RETRY_INTERVAL_MS) {
      return true;
    }
  
    if (markRetryAttempt) {
      missEntry.lastAttemptAt = now;
    }
  
    return false;
  }
  
  function pruneHitCacheIfNeeded() {
    if (securityLogoHitCache.size <= SECURITY_LOGO_MAX_CACHE_ENTRIES) {
      return;
    }
  
    const overflow = securityLogoHitCache.size - SECURITY_LOGO_MAX_CACHE_ENTRIES;
    const ranked = Array.from(securityLogoHitCache.entries()).sort((a, b) => {
      const leftScore = Math.min(a[1].lastAccessAt || a[1].updatedAt, a[1].updatedAt);
      const rightScore = Math.min(b[1].lastAccessAt || b[1].updatedAt, b[1].updatedAt);
      return leftScore - rightScore;
    });
  
    for (let index = 0; index < overflow; index += 1) {
      const key = ranked[index]?.[0];
      if (!key) continue;
      securityLogoHitCache.delete(key);
    }
  
    cacheDirty = true;
  }
  
  function toV2Payload(): SecurityLogoCacheV2Payload {
    const entries: SecurityLogoCacheV2Payload["entries"] = {};
  
    for (const [key, entry] of securityLogoHitCache.entries()) {
      entries[key] = {
        url: entry.url,
        updatedAt: entry.updatedAt,
        lastAccessAt: entry.lastAccessAt,
      };
    }
  
    return {
      version: SECURITY_LOGO_CACHE_VERSION,
      savedAt: Date.now(),
      entries,
    };
  }
  
  function schedulePersist() {
    cacheDirty = true;
    if (persistTimer) return;
  
    persistTimer = setTimeout(() => {
      persistTimer = null;
      void persistCacheNow();
    }, SECURITY_LOGO_PERSIST_DEBOUNCE_MS);
  }
  
  async function persistCacheNow(): Promise<void> {
    if (isServer || !cacheDirty) return;
    if (persistPromise) return persistPromise;
  
    persistPromise = (async () => {
      try {
        pruneHitCacheIfNeeded();
        const payload = toV2Payload();
        localStorage.setItem(SECURITY_LOGO_CACHE_KEY, JSON.stringify(payload));
        cacheDirty = false;
      } catch {
        // Ignore persistence failures
      }
    })();
  
    try {
      await persistPromise;
    } finally {
      persistPromise = null;
    }
  }
  
  function hydrateFromParsedPayload(parsed: unknown) {
    if (!parsed || typeof parsed !== "object") {
      return;
    }
  
    const asV2 = parsed as Partial<SecurityLogoCacheV2Payload>;
    if (asV2.entries && typeof asV2.entries === "object") {
      for (const [key, entry] of Object.entries(asV2.entries)) {
        if (!entry || typeof entry !== "object") continue;
  
        const url = normalizeLogoUrl((entry as any).url);
        const updatedAt = Number((entry as any).updatedAt);
        const lastAccessAt = Number((entry as any).lastAccessAt);
        if (!url || !Number.isFinite(updatedAt)) continue;
  
        securityLogoHitCache.set(key, {
          url,
          updatedAt,
          lastAccessAt: Number.isFinite(lastAccessAt) ? lastAccessAt : updatedAt,
        });
      }
  
      return;
    }
  
    const asV1 = parsed as SecurityLogoCacheV1Payload;
    for (const [key, entry] of Object.entries(asV1)) {
      if (!entry || typeof entry !== "object") continue;
  
      const url = normalizeLogoUrl((entry as any).url);
      const updatedAt = Number((entry as any).updatedAt);
      if (!url || !Number.isFinite(updatedAt)) continue;
  
      securityLogoHitCache.set(key, {
        url,
        updatedAt,
        lastAccessAt: updatedAt,
      });
    }
  }
  
  async function ensureCacheHydrated(): Promise<void> {
    if (isServer || cacheHydrated) return;
    if (hydratePromise) return hydratePromise;
  
    hydratePromise = (async () => {
      try {
        const raw =
          localStorage.getItem(SECURITY_LOGO_CACHE_KEY) ??
          localStorage.getItem(SECURITY_LOGO_CACHE_LEGACY_KEY);
        if (!raw) {
          cacheHydrated = true;
          return;
        }
  
        const parsed = JSON.parse(raw) as unknown;
        hydrateFromParsedPayload(parsed);
        pruneHitCacheIfNeeded();
        if (securityLogoHitCache.size > 0) {
          schedulePersist();
        }
      } catch {
        securityLogoHitCache.clear();
      } finally {
        cacheHydrated = true;
        hydratePromise = null;
      }
    })();
  
    return hydratePromise;
  }
  
  function getCachedUrlForLookup(symbol: string, market: string): string | null {
    const lookupKeys = getLookupKeys(symbol, market);
    const now = Date.now();
    let removedBrokenEntry = false;
  
    for (const key of lookupKeys) {
      const cachedEntry = securityLogoHitCache.get(key);
      if (!cachedEntry) continue;
      if (isBrokenLogoUrl(cachedEntry.url)) {
        securityLogoHitCache.delete(key);
        securityLogoMissCache.delete(key);
        removedBrokenEntry = true;
        continue;
      }
  
      cachedEntry.lastAccessAt = now;
      return cachedEntry.url;
    }
  
    if (removedBrokenEntry) {
      schedulePersist();
    }
  
    return null;
  }
  
  function writeHitCacheForLookup(symbol: string, market: string, logoUrl: string) {
    const normalizedLogoUrl = normalizeLogoUrl(logoUrl);
    if (!normalizedLogoUrl) return;
    if (isBrokenLogoUrl(normalizedLogoUrl)) return;
  
    const now = Date.now();
    const lookupKeys = getLookupKeys(symbol, market);
    if (lookupKeys.length === 0) return;
  
    for (const key of lookupKeys) {
      securityLogoHitCache.set(key, {
        url: normalizedLogoUrl,
        updatedAt: now,
        lastAccessAt: now,
      });
      securityLogoMissCache.delete(key);
    }
  
    pruneHitCacheIfNeeded();
    schedulePersist();
  }
  
  async function fetchCryptoLogoFallback(
    symbol: string,
    market: string,
    signal?: AbortSignal,
  ): Promise<LogoFetchResult> {
    if (!isCryptoLikeLookup(symbol, market)) {
      return { kind: "not_found" };
    }
  
    const symbolCandidates = getCryptoLogoSymbolCandidates(symbol);
    let sawTransientError = false;
  
    for (const symbolCandidate of symbolCandidates) {
      if (signal?.aborted) {
        return { kind: "aborted" };
      }
  
      const logoUrl = `${COINCAP_CRYPTO_ICON_BASE_URL}/${symbolCandidate.toLowerCase()}@2x.png`;
      if (isBrokenLogoUrl(logoUrl)) {
        continue;
      }
  
      try {
        const response = await fetch(logoUrl, {
          method: "HEAD",
          signal,
          headers: {
            "Cache-Control": "no-cache, no-store, max-age=0",
            Pragma: "no-cache",
          },
        });
  
        if (response.status === 404) {
          continue;
        }
  
        if (!response.ok) {
          sawTransientError = true;
          continue;
        }
  
        return {
          kind: "hit",
          url: logoUrl,
          resolvedSymbol: symbolCandidate,
        };
      } catch (error) {
        if (isAbortError(error)) {
          return { kind: "aborted" };
        }
        sawTransientError = true;
      }
    }
  
    return sawTransientError ? { kind: "error" } : { kind: "not_found" };
  }
  
  async function fetchStaticLogoFallback(
    symbol: string,
    market: string,
    signal?: AbortSignal,
  ): Promise<LogoFetchResult> {
    if (isCryptoLikeLookup(symbol, market)) {
      return { kind: "not_found" };
    }
  
    const symbolCandidates = getStaticLogoSymbolCandidates(symbol);
    let sawTransientError = false;
  
    for (const symbolCandidate of symbolCandidates) {
      if (signal?.aborted) {
        return { kind: "aborted" };
      }
  
      const logoUrl = `${FINNHUB_STATIC_LOGO_BASE_URL}/${encodeURIComponent(symbolCandidate)}.png`;
      if (isBrokenLogoUrl(logoUrl)) {
        continue;
      }
  
      try {
        const response = await fetch(logoUrl, {
          method: "HEAD",
          signal,
          headers: {
            "Cache-Control": "no-cache, no-store, max-age=0",
            Pragma: "no-cache",
          },
        });
  
        if (response.status === 404) {
          continue;
        }
  
        if (!response.ok) {
          sawTransientError = true;
          continue;
        }
  
        return {
          kind: "hit",
          url: logoUrl,
          resolvedSymbol: symbolCandidate,
        };
      } catch (error) {
        if (isAbortError(error)) {
          return { kind: "aborted" };
        }
        sawTransientError = true;
      }
    }
  
    return sawTransientError ? { kind: "error" } : { kind: "not_found" };
  }
  
  async function fetchLogoFromApi(symbol: string, market: string, signal?: AbortSignal): Promise<LogoFetchResult> {
    const normalizedSymbol = normalizeSymbol(symbol);
    const normalizedMarket = normalizeMarket(market);
    if (!normalizedSymbol) {
      return { kind: "not_found" };
    }
  
    const symbolCandidates = getSymbolCandidates(normalizedSymbol, normalizedMarket);
    const marketCandidates = getMarketCandidates(normalizedSymbol, normalizedMarket);
  
    let sawTransientError = false;
  
    for (const marketCandidate of marketCandidates) {
      for (const symbolCandidate of symbolCandidates) {
        const attempts: { symbol: string; market?: string; region?: string }[] = [
          { symbol: symbolCandidate, market: marketCandidate },
          { symbol: symbolCandidate, region: marketCandidate },
          { symbol: symbolCandidate },
        ];
  
        for (const attempt of attempts) {
          if (signal?.aborted) {
            return { kind: "aborted" };
          }
  
          try {
            const params = new URLSearchParams({ symbol: attempt.symbol });
            if (attempt.market) params.set("market", attempt.market);
            if (attempt.region) params.set("region", attempt.region);
  
            const response = await fetch(`${BASE_URL}/logo?${params.toString()}`, {
              signal,
              headers: {
                "Cache-Control": "no-cache, no-store, max-age=0",
                Pragma: "no-cache",
              },
            });
  
            if (response.status === 404) {
              continue;
            }
  
            if (!response.ok) {
              sawTransientError = true;
              continue;
            }
  
            const payload = (await response.json().catch(() => null)) as
              | { logo_url?: unknown }
              | null;
            const logoUrl = normalizeLogoUrl(payload?.logo_url);
            if (!logoUrl) {
              sawTransientError = true;
              continue;
            }
            if (isBrokenLogoUrl(logoUrl)) {
              continue;
            }
  
            return {
              kind: "hit",
              url: logoUrl,
              resolvedSymbol: symbolCandidate,
            };
          } catch (error) {
            if (isAbortError(error)) {
              return { kind: "aborted" };
            }
            sawTransientError = true;
          }
        }
      }
    }
  
    const cryptoFallback = await fetchCryptoLogoFallback(
      normalizedSymbol,
      normalizedMarket,
      signal,
    );
    if (cryptoFallback.kind === "hit") {
      return cryptoFallback;
    }
    if (cryptoFallback.kind === "aborted") {
      return cryptoFallback;
    }
    if (cryptoFallback.kind === "error") {
      return cryptoFallback;
    }
  
    const staticFallback = await fetchStaticLogoFallback(
      normalizedSymbol,
      normalizedMarket,
      signal,
    );
    if (staticFallback.kind === "hit") {
      return staticFallback;
    }
    if (staticFallback.kind === "aborted") {
      return staticFallback;
    }
    if (staticFallback.kind === "error") {
      return staticFallback;
    }
  
    return sawTransientError ? { kind: "error" } : { kind: "not_found" };
  }
  
  function bindInFlightPromise(lookupKeys: string[], promise: Promise<string | null>) {
    for (const key of lookupKeys) {
      if (!inFlightLogoRequests.has(key)) {
        inFlightLogoRequests.set(key, promise);
      }
    }
  }
  
  function unbindInFlightPromise(lookupKeys: string[], promise: Promise<string | null>) {
    for (const key of lookupKeys) {
      if (inFlightLogoRequests.get(key) === promise) {
        inFlightLogoRequests.delete(key);
      }
    }
  }
  
  function getExistingInFlightPromise(lookupKeys: string[]): Promise<string | null> | null {
    for (const key of lookupKeys) {
      const existing = inFlightLogoRequests.get(key);
      if (existing) {
        return existing;
      }
    }
  
    return null;
  }
  
  export async function getCachedSecurityLogo(symbol: string, market: string): Promise<string | null> {
    await ensureCacheHydrated();
    cleanupExpiredMisses();
  
    const safeSymbol = normalizeSymbol(symbol);
    const safeMarket = normalizeMarket(market);
    if (!safeSymbol) return null;
  
    return getCachedUrlForLookup(safeSymbol, safeMarket);
  }
  
  export async function cacheSecurityLogo(symbol: string, market: string, logoUrl: string): Promise<void> {
    await ensureCacheHydrated();
  
    const safeSymbol = normalizeSymbol(symbol);
    const safeMarket = normalizeMarket(market);
    if (!safeSymbol) return;
  
    writeHitCacheForLookup(safeSymbol, safeMarket, logoUrl);
  }
  
  export async function markSecurityLogoUrlBroken(
    symbol: string,
    market: string,
    logoUrl: string,
  ): Promise<void> {
    const normalizedLogoUrl = normalizeLogoUrl(logoUrl);
    if (!normalizedLogoUrl) return;
  
    markBrokenLogoUrl(normalizedLogoUrl);
    await ensureCacheHydrated();
  
    const safeSymbol = normalizeSymbol(symbol);
    const safeMarket = normalizeMarket(market);
    if (!safeSymbol) return;
  
    const lookupKeys = getLookupKeys(safeSymbol, safeMarket);
    let cacheChanged = false;
  
    for (const key of lookupKeys) {
      const cachedEntry = securityLogoHitCache.get(key);
      if (cachedEntry && cachedEntry.url === normalizedLogoUrl) {
        securityLogoHitCache.delete(key);
        cacheChanged = true;
      }
      securityLogoMissCache.delete(key);
    }
  
    if (cacheChanged) {
      schedulePersist();
    }
  }
  
  export async function getOrFetchSecurityLogo(
    symbol: string,
    market: string,
    signal?: AbortSignal,
  ): Promise<string | null> {
    await ensureCacheHydrated();
    cleanupExpiredMisses();
  
    const safeSymbol = normalizeSymbol(symbol);
    const safeMarket = normalizeMarket(market);
    if (!safeSymbol) return null;
  
    const cachedUrl = getCachedUrlForLookup(safeSymbol, safeMarket);
    if (cachedUrl) {
      return cachedUrl;
    }
  
    const canonicalKey = getCacheKey(safeSymbol, safeMarket);
    if (hasFreshMiss(canonicalKey, true)) {
      return null;
    }
  
    const lookupKeys = getLookupKeys(safeSymbol, safeMarket);
    const existingRequest = getExistingInFlightPromise(lookupKeys);
    if (existingRequest) {
      return existingRequest;
    }
  
    const requestPromise = (async () => {
      const firstAttempt = await fetchLogoFromApi(safeSymbol, safeMarket, signal);
      const result =
        firstAttempt.kind === "error"
          ? await fetchLogoFromApi(safeSymbol, safeMarket, signal)
          : firstAttempt;
  
      if (result.kind === "hit") {
        writeHitCacheForLookup(safeSymbol, safeMarket, result.url);
        writeHitCacheForLookup(result.resolvedSymbol, safeMarket, result.url);
        return result.url;
      }
  
      if (result.kind === "not_found") {
        const now = Date.now();
        securityLogoMissCache.set(canonicalKey, {
          expiresAt: now + SECURITY_LOGO_MISS_TTL_MS,
          lastAttemptAt: now,
        });
        return null;
      }
  
      return null;
    })();
  
    bindInFlightPromise(lookupKeys, requestPromise);
  
    try {
      return await requestPromise;
    } finally {
      unbindInFlightPromise(lookupKeys, requestPromise);
    }
  }
  
  export async function prefetchSecurityLogos(
    lookups: SecurityLogoLookup[],
    options?: {
      signal?: AbortSignal;
      batchSize?: number;
      maxItems?: number;
    },
  ): Promise<void> {
    await ensureCacheHydrated();
    cleanupExpiredMisses();
  
    const signal = options?.signal;
    const batchSize = Math.max(1, Number(options?.batchSize) || 10);
    const maxItems = Number(options?.maxItems);
  
    const uniqueLookups = new Map<string, SecurityLogoLookup>();
  
    for (const lookup of lookups) {
      const safeSymbol = normalizeSymbol(lookup.symbol);
      const safeMarket = normalizeMarket(lookup.market);
      if (!safeSymbol) continue;
  
      const canonicalKey = getCacheKey(safeSymbol, safeMarket);
      if (uniqueLookups.has(canonicalKey)) continue;
      if (getCachedUrlForLookup(safeSymbol, safeMarket)) continue;
      if (hasFreshMiss(canonicalKey)) continue;
  
      uniqueLookups.set(canonicalKey, {
        symbol: safeSymbol,
        market: safeMarket,
      });
    }
  
    const queue = Array.from(uniqueLookups.values());
    const limitedQueue =
      Number.isFinite(maxItems) && maxItems > 0 ? queue.slice(0, maxItems) : queue;
  
    for (let index = 0; index < limitedQueue.length; index += batchSize) {
      if (signal?.aborted) break;
  
      const batch = limitedQueue.slice(index, index + batchSize);
      await Promise.all(
        batch.map(async (lookup) => {
          await getOrFetchSecurityLogo(lookup.symbol, lookup.market, signal);
        }),
      );
    }
  }