"use client";

import {
  type ReactElement,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";

import {
  cacheSecurityLogo,
  getCachedSecurityLogo,
  prefetchSecurityLogos,
} from "@/lib/security-logo-cache";
import {
  refreshMarketsSnapshot,
  useMarketsRealtimeState,
} from "@/lib/realtime/markets-realtime";
import { createClient } from "@/lib/supabase/client";
import { MarketStock } from "@/types/stock";
import StockRow from "@/components/StockRow";
import TutorialHighlightTarget from "@/components/tutorial-highlight-target";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MARKET_REALTIME_TABLE =
  process.env.NEXT_PUBLIC_MARKETS_REALTIME_TABLE?.trim() || "market_prices";
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL?.trim() || "";
const MARKET_CACHE_KEY = "market_screen_board_cache_v1";
const MARKET_MANUAL_REFRESH_COOLDOWN_MS = 1000 * 30;
const MARKET_LOGO_HYDRATION_COOLDOWN_MS = 1000 * 20;
const SEARCH_DEBOUNCE_MS = 300;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SessionWindow = { start: number; end: number };

type MarketStatusPhase =
  | "ALWAYS_OPEN"
  | "OPEN"
  | "PRE"
  | "POST"
  | "BREAK"
  | "CLOSED"
  | "WEEKEND";

type MarketSessionConfig = {
  timeZone: string;
  shortTz: string;
  regularWindows: SessionWindow[];
  preWindow?: SessionWindow;
  postWindow?: SessionWindow;
  alwaysOpen?: boolean;
};

type MarketStatusInfo = {
  phase: MarketStatusPhase;
  phaseLabel: string;
  title: string;
  detail: string;
  usePercentageChange: boolean;
  timeZone: string;
  shortTz: string;
};

type MajorMarket = { code: string; label: string };

type MarketCacheEnvelope = {
  savedAt: number;
  payload: {
    stocks: MarketStock[];
    activeRegions: string[];
    serverAnchorMs: number | null;
  };
};

type MarketStockSection = {
  code: string;
  label: string;
  status: MarketStatusInfo;
  data: MarketStock[];
  totalCount: number;
};

type MarketRowCacheEntry = {
  itemRef: MarketStock;
  element: ReactElement;
};

// Search API response shape
type SearchResult = {
  symbol: string;
  market: string;
  price: number;
  currency: string;
  marketCap: number;
};

// ---------------------------------------------------------------------------
// Module-level cache
// ---------------------------------------------------------------------------

let marketCacheMemory: MarketCacheEnvelope | null | undefined;
let marketCacheReadPromise: Promise<MarketCacheEnvelope | null> | null = null;
const EMPTY_MARKET_ROWS: MarketStock[] = [];

// ---------------------------------------------------------------------------
// Static data
// ---------------------------------------------------------------------------

const DAY_ORDER = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

const DAY_LABEL: Record<(typeof DAY_ORDER)[number], string> = {
  Sun: "Sunday",
  Mon: "Monday",
  Tue: "Tuesday",
  Wed: "Wednesday",
  Thu: "Thursday",
  Fri: "Friday",
  Sat: "Saturday",
};

const GLOBAL_MARKETS_TAB = "MARKETS";

const MARKET_SESSION_CONFIGS: Record<string, MarketSessionConfig> = {
  US: {
    timeZone: "America/New_York",
    shortTz: "ET",
    preWindow: { start: 4 * 60, end: 9 * 60 + 30 },
    regularWindows: [{ start: 9 * 60 + 30, end: 16 * 60 }],
    postWindow: { start: 16 * 60, end: 20 * 60 },
  },
  INDIA: {
    timeZone: "Asia/Kolkata",
    shortTz: "IST",
    preWindow: { start: 9 * 60, end: 9 * 60 + 15 },
    regularWindows: [{ start: 9 * 60 + 15, end: 15 * 60 + 30 }],
    postWindow: { start: 15 * 60 + 30, end: 16 * 60 },
  },
  LONDON: {
    timeZone: "Europe/London",
    shortTz: "GMT/BST",
    preWindow: { start: 7 * 60, end: 8 * 60 },
    regularWindows: [{ start: 8 * 60, end: 16 * 60 + 30 }],
    postWindow: { start: 16 * 60 + 30, end: 17 * 60 + 30 },
  },
  CHINA: {
    timeZone: "Asia/Shanghai",
    shortTz: "CST",
    preWindow: { start: 9 * 60 + 15, end: 9 * 60 + 30 },
    regularWindows: [
      { start: 9 * 60 + 30, end: 11 * 60 + 30 },
      { start: 13 * 60, end: 15 * 60 },
    ],
    postWindow: { start: 15 * 60, end: 15 * 60 + 30 },
  },
  CRYPTO: {
    timeZone: "UTC",
    shortTz: "UTC",
    regularWindows: [{ start: 0, end: 24 * 60 }],
    alwaysOpen: true,
  },
  CANADA: {
    timeZone: "America/Toronto",
    shortTz: "ET",
    preWindow: { start: 7 * 60, end: 9 * 60 + 30 },
    regularWindows: [{ start: 9 * 60 + 30, end: 16 * 60 }],
    postWindow: { start: 16 * 60, end: 17 * 60 + 30 },
  },
  GERMANY: {
    timeZone: "Europe/Berlin",
    shortTz: "CET/CEST",
    preWindow: { start: 8 * 60, end: 9 * 60 },
    regularWindows: [{ start: 9 * 60, end: 17 * 60 + 30 }],
  },
  FRANCE: {
    timeZone: "Europe/Paris",
    shortTz: "CET/CEST",
    preWindow: { start: 8 * 60, end: 9 * 60 },
    regularWindows: [{ start: 9 * 60, end: 17 * 60 + 30 }],
  },
  JAPAN: {
    timeZone: "Asia/Tokyo",
    shortTz: "JST",
    preWindow: { start: 8 * 60, end: 9 * 60 },
    regularWindows: [
      { start: 9 * 60, end: 11 * 60 + 30 },
      { start: 12 * 60 + 30, end: 15 * 60 },
    ],
  },
  HONG_KONG: {
    timeZone: "Asia/Hong_Kong",
    shortTz: "HKT",
    preWindow: { start: 9 * 60, end: 9 * 60 + 30 },
    regularWindows: [
      { start: 9 * 60 + 30, end: 12 * 60 },
      { start: 13 * 60, end: 16 * 60 },
    ],
  },
  KOREA: {
    timeZone: "Asia/Seoul",
    shortTz: "KST",
    preWindow: { start: 8 * 60 + 30, end: 9 * 60 },
    regularWindows: [{ start: 9 * 60, end: 15 * 60 + 30 }],
  },
  AUSTRALIA: {
    timeZone: "Australia/Sydney",
    shortTz: "AET",
    preWindow: { start: 9 * 60 + 30, end: 10 * 60 },
    regularWindows: [{ start: 10 * 60, end: 16 * 60 }],
  },
  SINGAPORE: {
    timeZone: "Asia/Singapore",
    shortTz: "SGT",
    preWindow: { start: 8 * 60 + 30, end: 9 * 60 },
    regularWindows: [
      { start: 9 * 60, end: 12 * 60 },
      { start: 13 * 60, end: 17 * 60 },
    ],
  },
};

const MAJOR_GLOBAL_MARKETS: MajorMarket[] = [
  { code: "US", label: "US" },
  { code: "CANADA", label: "Canada" },
  { code: "LONDON", label: "LONDON" },
  { code: "GERMANY", label: "Germany" },
  { code: "FRANCE", label: "France" },
  { code: "INDIA", label: "India" },
  { code: "JAPAN", label: "Japan" },
  { code: "HONG_KONG", label: "Hong Kong" },
  { code: "CHINA", label: "China" },
  { code: "KOREA", label: "Korea" },
  { code: "AUSTRALIA", label: "Australia" },
  { code: "SINGAPORE", label: "Singapore" },
  { code: "CRYPTO", label: "Crypto" },
];

const MARKET_ALIAS_BY_CODE: Record<string, string> = {
  UK: "LONDON",
  UNITED_KINGDOM: "LONDON",
  LSE: "LONDON",
  LONDON_STOCK_EXCHANGE: "LONDON",
  USA: "US",
  UNITED_STATES: "US",
  NYSE: "US",
  NASDAQ: "US",
  NSE: "INDIA",
  BSE: "INDIA",
  HK: "HONG_KONG",
  HKEX: "HONG_KONG",
  SOUTH_KOREA: "KOREA",
  KRX: "KOREA",
  AUS: "AUSTRALIA",
};

const MAJOR_MARKET_INDEX = new Map(
  MAJOR_GLOBAL_MARKETS.map((item, index) => [item.code, index]),
);
const MAJOR_MARKET_LABEL = new Map(
  MAJOR_GLOBAL_MARKETS.map((item) => [item.code, item.label]),
);

// ---------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------

function normalizeMarketCode(value: unknown) {
  if (typeof value !== "string") return "US";
  const normalized = value.trim().toUpperCase().replace(/[\s-]+/g, "_");
  if (!normalized) return "US";
  if (normalized === GLOBAL_MARKETS_TAB) return "US";
  return MARKET_ALIAS_BY_CODE[normalized] ?? normalized;
}

function getMarketDisplayLabel(code: string) {
  const normalized = normalizeMarketCode(code);
  return MAJOR_MARKET_LABEL.get(normalized) ?? normalized.replace(/_/g, " ");
}

function getMarketStockKey(item: Pick<MarketStock, "market" | "symbol">) {
  return `${normalizeMarketCode(item.market)}:${item.symbol}`;
}

function normalizeLogoUrl(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}

function hasMissingLogos(items: MarketStock[]) {
  return items.some((item) => !normalizeLogoUrl(item.logo_url));
}

function sanitizeCompanyName(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed || /^unknown$/i.test(trimmed)) return undefined;
  return trimmed;
}

function extractActiveRegions(payload: any): string[] {
  const source = [
    ...(Array.isArray(payload?.active_regions) ? payload.active_regions : []),
    ...(Array.isArray(payload?.active_markets) ? payload.active_markets : []),
    ...(Array.isArray(payload?.regions_active) ? payload.regions_active : []),
    ...(Array.isArray(payload?.markets_active) ? payload.markets_active : []),
  ];
  const unique = new Set<string>();
  for (const region of source) {
    const normalized = normalizeMarketCode(region);
    if (normalized) unique.add(normalized);
  }
  return Array.from(unique);
}

function sortStocksAlphabetically(items: MarketStock[]) {
  return [...items].sort((a, b) =>
    a.symbol.localeCompare(b.symbol, "en", { sensitivity: "base" }),
  );
}

function areMarketRegionListsEqual(left: string[], right: string[]) {
  if (left.length !== right.length) return false;
  for (let i = 0; i < left.length; i++) {
    if (left[i] !== right[i]) return false;
  }
  return true;
}

function parseDateMs(value: unknown): number | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const trimmed = value.trim();
  const hasTimezone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(trimmed);
  const ms = Date.parse(hasTimezone ? trimmed : `${trimmed}Z`);
  return Number.isFinite(ms) ? ms : null;
}

function getZonedDateTimeParts(now: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const parts = formatter.formatToParts(now);
  const values: Record<string, string> = {};
  for (const part of parts) {
    if (part.type !== "literal") values[part.type] = part.value;
  }
  const weekday = values.weekday as (typeof DAY_ORDER)[number] | undefined;
  return {
    weekday: weekday ?? "Mon",
    year: Number(values.year ?? 1970),
    month: Number(values.month ?? 1),
    day: Number(values.day ?? 1),
    hour: Number(values.hour ?? 0),
    minute: Number(values.minute ?? 0),
  };
}

function isWeekend(weekday: string) {
  return weekday === "Sat" || weekday === "Sun";
}

function isInWindow(minutes: number, window: SessionWindow) {
  return minutes >= window.start && minutes < window.end;
}

function getNextTradingDayOffset(currentWeekday: string): number {
  const startIndex = DAY_ORDER.findIndex((d) => d === currentWeekday);
  if (startIndex < 0) return 1;
  for (let step = 1; step <= 7; step++) {
    const day = DAY_ORDER[(startIndex + step) % DAY_ORDER.length];
    if (day !== "Sat" && day !== "Sun") return step;
  }
  return 1;
}

function convertMarketMinutesToLocalDate(
  now: Date,
  marketTimeZone: string,
  targetMinutes: number,
  dayOffset = 0,
) {
  const zoned = getZonedDateTimeParts(now, marketTimeZone);
  const marketNowAsLocal = new Date(
    zoned.year,
    zoned.month - 1,
    zoned.day,
    zoned.hour,
    zoned.minute,
    0,
    0,
  );
  const offsetMs = now.getTime() - marketNowAsLocal.getTime();
  const targetAsLocal = new Date(marketNowAsLocal);
  targetAsLocal.setDate(targetAsLocal.getDate() + dayOffset);
  targetAsLocal.setHours(Math.floor(targetMinutes / 60), targetMinutes % 60, 0, 0);
  return new Date(targetAsLocal.getTime() + offsetMs);
}

function formatAsUserLocalTime(date: Date) {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function resolveServerNowMs(payload: any, _stocks: MarketStock[]): number | null {
  return (
    parseDateMs(payload?.server_now) ??
    parseDateMs(payload?.server_time) ??
    parseDateMs(payload?.now_utc) ??
    Date.now()
  );
}

function getMarketStatus(market: string, now: Date): MarketStatusInfo {
  const config = MARKET_SESSION_CONFIGS[market] ?? MARKET_SESSION_CONFIGS.US;

  if (config.alwaysOpen) {
    return {
      phase: "ALWAYS_OPEN",
      phaseLabel: "24/7",
      title: `${market} market is active`,
      detail: "Always open. Percentage change reflects live movement.",
      usePercentageChange: true,
      timeZone: config.timeZone,
      shortTz: config.shortTz,
    };
  }

  const clock = getZonedDateTimeParts(now, config.timeZone);
  const weekdayLabel = DAY_LABEL[clock.weekday] ?? clock.weekday;
  const nowMinutes = clock.hour * 60 + clock.minute;
  const regularOpenMinutes = config.regularWindows[0].start;
  const regularCloseMinutes =
    config.regularWindows[config.regularWindows.length - 1].end;

  if (isWeekend(clock.weekday)) {
    const nextOpenOffset = getNextTradingDayOffset(clock.weekday);
    const nextOpenLocal = formatAsUserLocalTime(
      convertMarketMinutesToLocalDate(now, config.timeZone, regularOpenMinutes, nextOpenOffset),
    );
    return {
      phase: "WEEKEND",
      phaseLabel: weekdayLabel.toUpperCase(),
      title: `${market} market is closed`,
      detail: `It is ${weekdayLabel}. Regular session opens ${nextOpenLocal} your local time.`,
      usePercentageChange: false,
      timeZone: config.timeZone,
      shortTz: config.shortTz,
    };
  }

  if (config.preWindow && isInWindow(nowMinutes, config.preWindow)) {
    const openLocal = formatAsUserLocalTime(
      convertMarketMinutesToLocalDate(now, config.timeZone, regularOpenMinutes),
    );
    return {
      phase: "PRE",
      phaseLabel: "PRE MARKET",
      title: `${market} pre-market is active`,
      detail: `Regular session opens ${openLocal} your local time.`,
      usePercentageChange: false,
      timeZone: config.timeZone,
      shortTz: config.shortTz,
    };
  }

  for (let idx = 0; idx < config.regularWindows.length; idx++) {
    const window = config.regularWindows[idx];
    if (!isInWindow(nowMinutes, window)) continue;
    const nextWindow = config.regularWindows[idx + 1];
    if (nextWindow) {
      const breakLocal = formatAsUserLocalTime(
        convertMarketMinutesToLocalDate(now, config.timeZone, window.end),
      );
      const resumeLocal = formatAsUserLocalTime(
        convertMarketMinutesToLocalDate(now, config.timeZone, nextWindow.start),
      );
      return {
        phase: "OPEN",
        phaseLabel: "MARKET OPEN",
        title: `${market} regular session is active`,
        detail: `Live session now. Break at ${breakLocal}, resumes at ${resumeLocal} (your local time).`,
        usePercentageChange: true,
        timeZone: config.timeZone,
        shortTz: config.shortTz,
      };
    }
    const closeLocal = formatAsUserLocalTime(
      convertMarketMinutesToLocalDate(now, config.timeZone, regularCloseMinutes),
    );
    return {
      phase: "OPEN",
      phaseLabel: "MARKET OPEN",
      title: `${market} regular session is active`,
      detail: `Live session now. Closes at ${closeLocal} your local time.`,
      usePercentageChange: true,
      timeZone: config.timeZone,
      shortTz: config.shortTz,
    };
  }

  for (let idx = 0; idx < config.regularWindows.length - 1; idx++) {
    const currentWindow = config.regularWindows[idx];
    const nextWindow = config.regularWindows[idx + 1];
    if (nowMinutes >= currentWindow.end && nowMinutes < nextWindow.start) {
      const resumeLocal = formatAsUserLocalTime(
        convertMarketMinutesToLocalDate(now, config.timeZone, nextWindow.start),
      );
      return {
        phase: "BREAK",
        phaseLabel: "SESSION BREAK",
        title: `${market} session break`,
        detail: `Regular session resumes at ${resumeLocal} your local time.`,
        usePercentageChange: false,
        timeZone: config.timeZone,
        shortTz: config.shortTz,
      };
    }
  }

  if (config.postWindow && isInWindow(nowMinutes, config.postWindow)) {
    const nextOpenOffset = getNextTradingDayOffset(clock.weekday);
    const nextOpenLocal = formatAsUserLocalTime(
      convertMarketMinutesToLocalDate(now, config.timeZone, regularOpenMinutes, nextOpenOffset),
    );
    return {
      phase: "POST",
      phaseLabel: "POST MARKET",
      title: `${market} post-market is active`,
      detail: `Regular session opens ${nextOpenLocal} your local time.`,
      usePercentageChange: false,
      timeZone: config.timeZone,
      shortTz: config.shortTz,
    };
  }

  if (nowMinutes < regularOpenMinutes) {
    const openLocal = formatAsUserLocalTime(
      convertMarketMinutesToLocalDate(now, config.timeZone, regularOpenMinutes),
    );
    const preMarketText = config.preWindow
      ? ` Pre-market starts ${formatAsUserLocalTime(
          convertMarketMinutesToLocalDate(now, config.timeZone, config.preWindow.start),
        )}.`
      : "";
    return {
      phase: "CLOSED",
      phaseLabel: "CLOSED",
      title: `${market} market is closed`,
      detail: `Regular session opens ${openLocal} your local time.${preMarketText}`,
      usePercentageChange: false,
      timeZone: config.timeZone,
      shortTz: config.shortTz,
    };
  }

  const nextOpenOffset = getNextTradingDayOffset(clock.weekday);
  const nextOpenLocal = formatAsUserLocalTime(
    convertMarketMinutesToLocalDate(now, config.timeZone, regularOpenMinutes, nextOpenOffset),
  );
  return {
    phase: "CLOSED",
    phaseLabel: "CLOSED",
    title: `${market} market is closed`,
    detail: `Regular session opens ${nextOpenLocal} your local time.`,
    usePercentageChange: false,
    timeZone: config.timeZone,
    shortTz: config.shortTz,
  };
}

function applyFeedMarketStatus(
  market: string,
  status: MarketStatusInfo,
  backendActiveRegions: Set<string>,
): MarketStatusInfo {
  if (status.phase === "ALWAYS_OPEN" || backendActiveRegions.size === 0) return status;
  const normalizedMarket = normalizeMarketCode(market);
  const feedSaysOpen = backendActiveRegions.has(normalizedMarket);
  if (feedSaysOpen && status.phase !== "OPEN") {
    return {
      ...status,
      phase: "OPEN",
      phaseLabel: "MARKET OPEN",
      title: `${normalizedMarket} regular session is active`,
      detail: "Live feed marks this market as open. Times are shown in your local timezone.",
      usePercentageChange: true,
    };
  }
  if (!feedSaysOpen && status.phase === "OPEN") {
    return {
      ...status,
      phase: "CLOSED",
      phaseLabel: "CLOSED",
      title: `${normalizedMarket} market is closed`,
      detail: "Live feed marks this market as closed right now.",
      usePercentageChange: false,
    };
  }
  return status;
}

function isActiveMarketPhase(phase: MarketStatusPhase) {
  return phase === "OPEN" || phase === "ALWAYS_OPEN";
}

function isTransitionalMarketPhase(phase: MarketStatusPhase) {
  return phase === "PRE" || phase === "POST" || phase === "BREAK";
}

function getPhasePillText(phase: MarketStatusPhase) {
  if (phase === "ALWAYS_OPEN") return "24/7";
  if (phase === "OPEN") return "OPEN";
  if (phase === "PRE") return "PRE";
  if (phase === "POST") return "POST";
  if (phase === "BREAK") return "BREAK";
  if (phase === "WEEKEND") return "WEEKEND";
  return "CLOSED";
}

function hashPreviewSeed(value: string) {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function pickPreviewStocks(rows: MarketStock[], marketCode: string, limit = 4) {
  if (rows.length <= limit) return rows;
  return [...rows]
    .sort((l, r) => {
      const lRank = hashPreviewSeed(`${marketCode}:${l.symbol}`);
      const rRank = hashPreviewSeed(`${marketCode}:${r.symbol}`);
      if (lRank !== rRank) return lRank - rRank;
      return l.symbol.localeCompare(r.symbol, "en", { sensitivity: "base" });
    })
    .slice(0, limit);
}

function normalizeMarketStock(item: any, fallbackMarket: string): MarketStock | null {
  if (typeof item?.symbol !== "string") return null;
  const symbol = item.symbol.trim().toUpperCase();
  if (!symbol) return null;
  const marketCandidate =
    typeof item.market === "string"
      ? item.market
      : typeof item.region === "string"
      ? item.region
      : fallbackMarket;
  const market = normalizeMarketCode(marketCandidate);
  const displayPriceCandidate = Number(item.display_price ?? item.base_price);
  const percentageCandidate = Number(item.percentage_change);
  const yesterdayCandidate = Number(item.yesterday_price_change);
  if (!Number.isFinite(displayPriceCandidate)) return null;
  return {
    symbol,
    company_name: sanitizeCompanyName(item.company_name),
    name: sanitizeCompanyName(item.name),
    logo_url:
      typeof item.logo_url === "string" && item.logo_url.trim()
        ? item.logo_url.trim()
        : undefined,
    market,
    display_price: Number(displayPriceCandidate.toFixed(2)),
    percentage_change: Number.isFinite(percentageCandidate)
      ? Number(percentageCandidate.toFixed(2))
      : 0,
    yesterday_price_change: Number.isFinite(yesterdayCandidate)
      ? Number(yesterdayCandidate.toFixed(2))
      : 0,
    updated_at: typeof item.updated_at === "string" ? item.updated_at : undefined,
  };
}

function areStocksEqual(a: MarketStock, b: MarketStock) {
  return (
    a.symbol === b.symbol &&
    a.market === b.market &&
    a.display_price === b.display_price &&
    a.percentage_change === b.percentage_change &&
    a.yesterday_price_change === b.yesterday_price_change &&
    a.company_name === b.company_name &&
    a.name === b.name &&
    a.logo_url === b.logo_url &&
    a.updated_at === b.updated_at
  );
}

function reconcileStocks(previous: MarketStock[], next: MarketStock[]) {
  const previousByKey = new Map<string, MarketStock>();
  for (const item of previous) previousByKey.set(`${item.market}:${item.symbol}`, item);
  let changed = previous.length !== next.length;
  const merged = next.map((item) => {
    const key = `${item.market}:${item.symbol}`;
    const prev = previousByKey.get(key);
    if (!prev) { changed = true; return item; }
    if (areStocksEqual(prev, item)) return prev;
    changed = true;
    return item;
  });
  return changed ? merged : previous;
}

function extractStocks(payload: any, fallbackMarket: string): MarketStock[] {
  const source = Array.isArray(payload?.stocks)
    ? payload.stocks
    : Array.isArray(payload)
    ? payload
    : [];
  return sortStocksAlphabetically(
    source
      .map((item: any) => normalizeMarketStock(item, fallbackMarket))
      .filter((item: MarketStock | null): item is MarketStock => !!item),
  );
}

function buildMarketSeedFromPayload(payload: any, fallbackMarket: string) {
  const stocks = extractStocks(payload, fallbackMarket);
  return {
    stocks,
    activeRegions: extractActiveRegions(payload),
    serverAnchorMs: resolveServerNowMs(payload, stocks),
  };
}

function mergeStocksWithExistingLogos(
  nextStocks: MarketStock[],
  previousStocks: MarketStock[],
) {
  if (!nextStocks.length || !previousStocks.length) return nextStocks;
  const existingLogoByKey = new Map<string, string>();
  for (const row of previousStocks) {
    const logo = normalizeLogoUrl(row.logo_url);
    if (!logo) continue;
    const key = `${normalizeMarketCode(row.market)}:${row.symbol}`;
    if (!existingLogoByKey.has(key)) existingLogoByKey.set(key, logo);
  }
  if (!existingLogoByKey.size) return nextStocks;
  let changed = false;
  const merged = nextStocks.map((row) => {
    if (normalizeLogoUrl(row.logo_url)) return row;
    const key = `${normalizeMarketCode(row.market)}:${row.symbol}`;
    const cachedLogo = existingLogoByKey.get(key);
    if (!cachedLogo) return row;
    changed = true;
    return { ...row, logo_url: cachedLogo };
  });
  return changed ? merged : nextStocks;
}

// ---------------------------------------------------------------------------
// localStorage cache
// ---------------------------------------------------------------------------

async function readMarketCache(): Promise<MarketCacheEnvelope | null> {
  if (marketCacheMemory !== undefined) return marketCacheMemory;
  if (marketCacheReadPromise) return marketCacheReadPromise;
  marketCacheReadPromise = (async () => {
    try {
      const raw =
        typeof window !== "undefined" ? localStorage.getItem(MARKET_CACHE_KEY) : null;
      if (!raw) { marketCacheMemory = null; return null; }
      const parsed = JSON.parse(raw) as Partial<MarketCacheEnvelope>;
      if (!parsed || typeof parsed !== "object") { marketCacheMemory = null; return null; }
      if (typeof parsed.savedAt !== "number") { marketCacheMemory = null; return null; }
      if (!parsed.payload || typeof parsed.payload !== "object") { marketCacheMemory = null; return null; }
      const p = parsed.payload as MarketCacheEnvelope["payload"];
      const envelope: MarketCacheEnvelope = {
        savedAt: parsed.savedAt,
        payload: {
          stocks: Array.isArray(p.stocks) ? p.stocks : [],
          activeRegions: Array.isArray(p.activeRegions) ? p.activeRegions : [],
          serverAnchorMs: typeof p.serverAnchorMs === "number" ? p.serverAnchorMs : null,
        },
      };
      marketCacheMemory = envelope;
      return envelope;
    } catch {
      marketCacheMemory = null;
      return null;
    } finally {
      marketCacheReadPromise = null;
    }
  })();
  return marketCacheReadPromise;
}

async function writeMarketCache(payload: MarketCacheEnvelope["payload"]) {
  try {
    const envelope: MarketCacheEnvelope = { savedAt: Date.now(), payload };
    marketCacheMemory = envelope;
    if (typeof window !== "undefined")
      localStorage.setItem(MARKET_CACHE_KEY, JSON.stringify(envelope));
  } catch { /* ignore */ }
}

function getMarketCacheSeed() {
  if (!marketCacheMemory) return null;
  const cacheAgeMs = Math.max(0, Date.now() - marketCacheMemory.savedAt);
  return {
    stocks: marketCacheMemory.payload.stocks,
    activeRegions: marketCacheMemory.payload.activeRegions,
    serverAnchorMs:
      typeof marketCacheMemory.payload.serverAnchorMs === "number"
        ? marketCacheMemory.payload.serverAnchorMs + cacheAgeMs
        : null,
  };
}

async function fetchFromMarketTable() {
  const supabase=createClient();
  const { data, error } = await supabase
    .from(MARKET_REALTIME_TABLE)
    .select(
      "symbol,region,base_price,display_price,percentage_change,yesterday_price_change,updated_at",
    )
    .order("updated_at", { ascending: false })
    .limit(800);
  if (error) throw error;
  const rows = Array.isArray(data) ? data : [];
  const regions = Array.from(
    new Set(
      rows
        .map((row: any) => {
          const hasRegion = typeof row?.region === "string" && row.region.trim();
          const hasMarket = typeof row?.market === "string" && row.market.trim();
          if (!hasRegion && !hasMarket) return "";
          return normalizeMarketCode(row?.region ?? row?.market);
        })
        .filter((r): r is string => !!r),
    ),
  );
  return { stocks: rows, active_regions: regions };
}

// ---------------------------------------------------------------------------
// Search API
// ---------------------------------------------------------------------------

async function fetchSearchResults(
  query: string,
  signal: AbortSignal,
): Promise<SearchResult[]> {
  const url = `${process.env.NEXT_PUBLIC_BASE_URL}/search?q=${encodeURIComponent(query.trim())}`;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`Search failed: ${res.status}`);
  const json = await res.json();
  // API may return a single object or an array — normalise to array
  const items: SearchResult[] = Array.isArray(json) ? json : [json];
  return items.filter(
    (item) => typeof item?.symbol === "string" && item.symbol.trim(),
  );
}

// ---------------------------------------------------------------------------
// Formatters
// ---------------------------------------------------------------------------

function formatPrice(price: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  } catch {
    return `${currency} ${price.toFixed(2)}`;
  }
}

function formatMarketCap(cap: number) {
  if (cap >= 1e12) return `${(cap / 1e12).toFixed(2)}T`;
  if (cap >= 1e9) return `${(cap / 1e9).toFixed(2)}B`;
  if (cap >= 1e6) return `${(cap / 1e6).toFixed(2)}M`;
  return cap.toLocaleString();
}

// ---------------------------------------------------------------------------
// Inline search hook
// ---------------------------------------------------------------------------

function useInlineSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearSearch = useCallback(() => {
    setQuery("");
    setResults([]);
    setSearchError(null);
    setIsOpen(false);
    abortRef.current?.abort();
  }, []);

  useEffect(() => {
    const trimmed = query.trim();

    if (!trimmed) {
      setResults([]);
      setSearchError(null);
      setIsOpen(false);
      setSearchLoading(false);
      return;
    }

    // Debounce
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setSearchLoading(true);
      setSearchError(null);
      setIsOpen(true);

      try {
        const data = await fetchSearchResults(trimmed, controller.signal);
        if (controller.signal.aborted) return;
        setResults(data);
      } catch (err: any) {
        if (err?.name === "AbortError") return;
        setSearchError("Search failed. Please try again.");
        setResults([]);
      } finally {
        if (!controller.signal.aborted) setSearchLoading(false);
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return {
    query,
    setQuery,
    results,
    searchLoading,
    searchError,
    isOpen,
    setIsOpen,
    clearSearch,
  };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function MarketScreen() {
  const defaultMarket = "US";
  const router = useRouter();

  // Mount-enter animation
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // Page visibility focus
  const [isFocused, setIsFocused] = useState(true);
  useEffect(() => {
    const onVisibility = () => setIsFocused(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  // Search state
  const {
    query,
    setQuery,
    results,
    searchLoading,
    searchError,
    isOpen: searchOpen,
    setIsOpen: setSearchOpen,
    clearSearch,
  } = useInlineSearch();

  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Close search dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [setSearchOpen]);

  const handleSearchResultClick = useCallback(
    (result: SearchResult) => {
      clearSearch();
      router.push(
        `/stock-details/${result.symbol}?market=${normalizeMarketCode(result.market)}`,
      );
    },
    [clearSearch, router],
  );

  const marketsRealtime = useMarketsRealtimeState();

  const initialRealtimeSeedRef = useRef<{
    stocks: MarketStock[];
    activeRegions: string[];
    serverAnchorMs: number | null;
  } | null>(null);

  if (!initialRealtimeSeedRef.current && marketsRealtime.data) {
    initialRealtimeSeedRef.current = buildMarketSeedFromPayload(
      marketsRealtime.data,
      defaultMarket,
    );
  }

  const seededCache = getMarketCacheSeed();
  const initialSeed = seededCache ?? initialRealtimeSeedRef.current;

  const [stocks, setStocks] = useState<MarketStock[]>(() => initialSeed?.stocks ?? []);
  const [activeRegions, setActiveRegions] = useState<string[]>(
    () => initialSeed?.activeRegions ?? [],
  );
  const [marketLoading, setMarketLoading] = useState(
    () => !marketsRealtime.data && (initialSeed?.stocks.length ?? 0) === 0,
  );
  const [manualRefreshing, setManualRefreshing] = useState(false);
  const [manualRefreshReady, setManualRefreshReady] = useState(true);
  const [readyToApplyHeavyUpdates, setReadyToApplyHeavyUpdates] = useState(false);
  const [serverAnchorMs, setServerAnchorMs] = useState<number | null>(
    () => initialSeed?.serverAnchorMs ?? null,
  );
  const [clockTick, setClockTick] = useState(0);
  const [showTimelineModal, setShowTimelineModal] = useState(false);
  const [selectedRegionCode, setSelectedRegionCode] = useState<string | null>(null);

  const stocksRef = useRef<MarketStock[]>([]);
  const perfAnchorRef = useRef<number>(performance.now());
  const hasStockRowsRef = useRef(false);
  const marketLogoHydrationRequestIdRef = useRef(0);
  const marketLogoHydrationAbortRef = useRef<AbortController | null>(null);
  const marketLastLogoHydrationAtRef = useRef(0);
  const deferredSnapshotRef = useRef<{
    payload: any;
    options?: { persist?: boolean };
  } | null>(null);
  const manualRefreshUnlockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tableFallbackInFlightRef = useRef(false);
  const lastTableFallbackAtRef = useRef(0);
  const marketSessionOpenStateRef = useRef<Record<string, boolean>>({});
  const marketCacheHydratedRef = useRef(false);
  const marketSectionRowsCacheRef = useRef<Map<string, MarketStock[]>>(new Map());
  const marketRowElementCacheRef = useRef<Map<string, MarketRowCacheEntry>>(new Map());

  useEffect(() => {
    stocksRef.current = stocks;
    hasStockRowsRef.current = stocks.length > 0;
  }, [stocks]);

  useEffect(() => {
    return () => {
      if (manualRefreshUnlockTimerRef.current)
        clearTimeout(manualRefreshUnlockTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!isFocused) { setReadyToApplyHeavyUpdates(false); return; }
    let active = true;
    setReadyToApplyHeavyUpdates(false);
    const schedule =
      typeof window.requestIdleCallback === "function"
        ? (cb: () => void) => window.requestIdleCallback(cb)
        : (cb: () => void) => setTimeout(cb, 0);
    schedule(() => { if (active) setReadyToApplyHeavyUpdates(true); });
    return () => { active = false; };
  }, [isFocused]);

  useEffect(() => {
    if (!isFocused) return;
    const timer = setInterval(() => setClockTick((p) => p + 1), 30_000);
    return () => clearInterval(timer);
  }, [isFocused]);

  const handleManualRefresh = useCallback(async () => {
    if (manualRefreshing || !manualRefreshReady) return;
    setManualRefreshing(true);
    try {
      await refreshMarketsSnapshot();
    } finally {
      setManualRefreshing(false);
      setManualRefreshReady(false);
      if (manualRefreshUnlockTimerRef.current)
        clearTimeout(manualRefreshUnlockTimerRef.current);
      manualRefreshUnlockTimerRef.current = setTimeout(() => {
        setManualRefreshReady(true);
        manualRefreshUnlockTimerRef.current = null;
      }, MARKET_MANUAL_REFRESH_COOLDOWN_MS);
    }
  }, [manualRefreshReady, manualRefreshing]);

  const hydrateMissingLogos = useCallback(
    async (items: MarketStock[], signal?: AbortSignal) => {
      const firstPass = await Promise.all(
        items.map(async (item) => {
          if (normalizeLogoUrl(item.logo_url)) return item;
          const cachedLogo = await getCachedSecurityLogo(
            item.symbol.trim().toUpperCase(),
            normalizeMarketCode(item.market),
          );
          return cachedLogo ? { ...item, logo_url: cachedLogo } : item;
        }),
      );
      const keysToFetch = new Map<string, { symbol: string; market: string }>();
      for (const item of firstPass) {
        if (normalizeLogoUrl(item.logo_url)) continue;
        const symbol = item.symbol.trim().toUpperCase();
        if (!symbol) continue;
        const marketCode = normalizeMarketCode(item.market);
        const cacheKey = `${marketCode}:${symbol}`;
        if (!keysToFetch.has(cacheKey)) keysToFetch.set(cacheKey, { symbol, market: marketCode });
      }
      if (keysToFetch.size > 0) {
        await prefetchSecurityLogos(Array.from(keysToFetch.values()), {
          signal, batchSize: 20, maxItems: 360,
        });
      }
      return Promise.all(
        firstPass.map(async (item) => {
          if (normalizeLogoUrl(item.logo_url)) return item;
          const symbol = item.symbol.trim().toUpperCase();
          if (!symbol) return item;
          const cachedLogo = await getCachedSecurityLogo(symbol, normalizeMarketCode(item.market));
          return cachedLogo ? { ...item, logo_url: cachedLogo } : item;
        }),
      );
    },
    [],
  );

  const applyMarketsSnapshot = useCallback(
    (payload: any, options?: { persist?: boolean }) => {
      const normalized = extractStocks(payload, defaultMarket);
      const mergedWithCachedLogos = mergeStocksWithExistingLogos(normalized, stocksRef.current);
      const rowsWithLogos = mergedWithCachedLogos.filter((row) =>
        Boolean(normalizeLogoUrl(row.logo_url)),
      );
      if (rowsWithLogos.length > 0) {
        void Promise.all(
          rowsWithLogos.slice(0, 360).map(async (row) => {
            const safeLogoUrl = normalizeLogoUrl(row.logo_url);
            if (safeLogoUrl) await cacheSecurityLogo(row.symbol, row.market, safeLogoUrl);
          }),
        );
      }
      const activeRegionsFromResponse = extractActiveRegions(payload);
      const serverNowMs = resolveServerNowMs(payload, mergedWithCachedLogos);
      if (serverNowMs !== null) {
        perfAnchorRef.current = performance.now();
        setServerAnchorMs(serverNowMs);
      }
      setActiveRegions((prev) =>
        areMarketRegionListsEqual(prev, activeRegionsFromResponse)
          ? prev
          : activeRegionsFromResponse,
      );
      setStocks((prev) => reconcileStocks(prev, mergedWithCachedLogos));
      setMarketLoading(false);
      if (options?.persist !== false) {
        void writeMarketCache({
          stocks: mergedWithCachedLogos,
          activeRegions: activeRegionsFromResponse,
          serverAnchorMs: serverNowMs,
        });
      }
      if (!hasMissingLogos(mergedWithCachedLogos)) return;
      const now = Date.now();
      if (now - marketLastLogoHydrationAtRef.current < MARKET_LOGO_HYDRATION_COOLDOWN_MS) return;
      marketLastLogoHydrationAtRef.current = now;
      const logoHydrationRequestId = ++marketLogoHydrationRequestIdRef.current;
      marketLogoHydrationAbortRef.current?.abort();
      const controller = new AbortController();
      marketLogoHydrationAbortRef.current = controller;
      void (async () => {
        try {
          const hydrated = await hydrateMissingLogos(mergedWithCachedLogos, controller.signal);
          if (controller.signal.aborted) return;
          if (marketLogoHydrationRequestIdRef.current !== logoHydrationRequestId) return;
          setStocks((prev) => reconcileStocks(prev, hydrated));
          void writeMarketCache({
            stocks: hydrated,
            activeRegions: activeRegionsFromResponse,
            serverAnchorMs: serverNowMs,
          });
        } catch { /* keep snapshot stable */ }
      })();
    },
    [defaultMarket, hydrateMissingLogos],
  );

  const applySnapshotWhenReady = useCallback(
    (payload: any, options?: { persist?: boolean }) => {
      if (!isFocused || !readyToApplyHeavyUpdates) {
        deferredSnapshotRef.current = { payload, options };
        return;
      }
      applyMarketsSnapshot(payload, options);
    },
    [applyMarketsSnapshot, isFocused, readyToApplyHeavyUpdates],
  );

  useEffect(() => {
    if (!isFocused || !readyToApplyHeavyUpdates) return;
    const pending = deferredSnapshotRef.current;
    if (!pending) return;
    deferredSnapshotRef.current = null;
    applyMarketsSnapshot(pending.payload, pending.options);
  }, [applyMarketsSnapshot, isFocused, readyToApplyHeavyUpdates]);

  useEffect(() => {
    let active = true;
    if (!isFocused || !readyToApplyHeavyUpdates) {
      if (stocksRef.current.length === 0) setMarketLoading(true);
      return () => { active = false; };
    }
    if (stocksRef.current.length === 0) setMarketLoading(true);
    if (marketCacheHydratedRef.current) return () => { active = false; };
    marketCacheHydratedRef.current = true;
    void (async () => {
      const cached = await readMarketCache();
      if (!active || !cached) return;
      applySnapshotWhenReady(
        { stocks: cached.payload.stocks, active_regions: cached.payload.activeRegions },
        { persist: false },
      );
      if (typeof cached.payload.serverAnchorMs === "number") {
        const cacheAgeMs = Math.max(0, Date.now() - cached.savedAt);
        perfAnchorRef.current = performance.now();
        setServerAnchorMs(cached.payload.serverAnchorMs + cacheAgeMs);
      }
    })();
    return () => {
      active = false;
      marketLogoHydrationAbortRef.current?.abort();
      marketLogoHydrationAbortRef.current = null;
    };
  }, [applySnapshotWhenReady, isFocused, readyToApplyHeavyUpdates]);

  useEffect(() => {
    if (!marketsRealtime.data) {
      if (!hasStockRowsRef.current && marketsRealtime.status === "connecting")
        setMarketLoading(true);
      return;
    }
    applySnapshotWhenReady(marketsRealtime.data);
  }, [applySnapshotWhenReady, marketsRealtime.data, marketsRealtime.status]);

  useEffect(() => {
    if (marketsRealtime.data) return;
    if (marketsRealtime.status === "live" || marketsRealtime.status === "connecting") return;
    const now = Date.now();
    if (tableFallbackInFlightRef.current || now - lastTableFallbackAtRef.current < 15_000) return;
    let active = true;
    tableFallbackInFlightRef.current = true;
    lastTableFallbackAtRef.current = now;
    void (async () => {
      try {
        const tablePayload = await fetchFromMarketTable();
        if (active) applySnapshotWhenReady(tablePayload);
      } catch {
        if (active && !hasStockRowsRef.current) setMarketLoading(false);
      } finally {
        tableFallbackInFlightRef.current = false;
      }
    })();
    return () => { active = false; };
  }, [applySnapshotWhenReady, marketsRealtime.data, marketsRealtime.status]);

  const serverNow = useMemo(() => {
    if (serverAnchorMs === null) return null;
    void clockTick;
    const elapsedMs = performance.now() - perfAnchorRef.current;
    return new Date(serverAnchorMs + elapsedMs);
  }, [clockTick, serverAnchorMs]);

  const shouldRenderMarketBoard =
    stocks.length > 0 || (isFocused && readyToApplyHeavyUpdates);

  const renderStocks = useMemo(
    () => (shouldRenderMarketBoard ? stocks : EMPTY_MARKET_ROWS),
    [shouldRenderMarketBoard, stocks],
  );
  const renderActiveRegions = useMemo(
    () => (shouldRenderMarketBoard ? activeRegions : []),
    [activeRegions, shouldRenderMarketBoard],
  );

  useEffect(() => {
    const validKeys = new Set(renderStocks.map(getMarketStockKey));
    const cache = marketRowElementCacheRef.current;
    for (const key of cache.keys()) {
      if (!validKeys.has(key)) cache.delete(key);
    }
  }, [renderStocks]);

  useEffect(() => {
    if (!shouldRenderMarketBoard) return;
    const now = serverNow ?? new Date();
    const nextOpenState: Record<string, boolean> = {};
    let hasTransition = false;
    const backendActiveRegions = new Set(
      renderActiveRegions.map((r) => normalizeMarketCode(r)),
    );
    for (const mkt of MAJOR_GLOBAL_MARKETS) {
      const phase = applyFeedMarketStatus(
        mkt.code,
        getMarketStatus(mkt.code, now),
        backendActiveRegions,
      ).phase;
      const isOpen = phase === "OPEN" || phase === "ALWAYS_OPEN";
      nextOpenState[mkt.code] = isOpen;
      const previous = marketSessionOpenStateRef.current[mkt.code];
      if (typeof previous === "boolean" && previous !== isOpen) hasTransition = true;
    }
    marketSessionOpenStateRef.current = nextOpenState;
    if (hasTransition) void refreshMarketsSnapshot();
  }, [clockTick, renderActiveRegions, serverNow, shouldRenderMarketBoard]);

  const showYesterdayChange = false;

  const backendActiveMarketCodeSet = useMemo(
    () => new Set(renderActiveRegions.map((r) => normalizeMarketCode(r))),
    [renderActiveRegions],
  );

  const globalMarketStatuses = useMemo(() => {
    const now = serverNow ?? new Date();
    return MAJOR_GLOBAL_MARKETS.map((mkt) => ({
      marketConfig: mkt,
      status: applyFeedMarketStatus(
        mkt.code,
        getMarketStatus(mkt.code, now),
        backendActiveMarketCodeSet,
      ),
    }));
  }, [backendActiveMarketCodeSet, serverNow]);

  const calculatedActiveMarketCodeSet = useMemo(() => {
    const now = serverNow ?? new Date();
    const activeCodes = new Set<string>();
    for (const stock of renderStocks) {
      const marketCode = normalizeMarketCode(stock.market);
      if (!(marketCode in MARKET_SESSION_CONFIGS)) { activeCodes.add(marketCode); continue; }
      const status = applyFeedMarketStatus(
        marketCode,
        getMarketStatus(marketCode, now),
        backendActiveMarketCodeSet,
      );
      if (isActiveMarketPhase(status.phase)) activeCodes.add(marketCode);
    }
    return activeCodes;
  }, [backendActiveMarketCodeSet, renderStocks, serverNow]);

  const activeMarketCodeSet = useMemo(() => {
    if (!backendActiveMarketCodeSet.size) return calculatedActiveMarketCodeSet;
    const merged = new Set(backendActiveMarketCodeSet);
    for (const code of calculatedActiveMarketCodeSet) merged.add(code);
    return merged;
  }, [backendActiveMarketCodeSet, calculatedActiveMarketCodeSet]);

  const visibleStocks = useMemo(
    () =>
      renderStocks.filter((s) =>
        activeMarketCodeSet.has(normalizeMarketCode(s.market)),
      ),
    [activeMarketCodeSet, renderStocks],
  );

  const marketPills = useMemo(() => {
    const now = serverNow ?? new Date();
    const focusCodes = new Set<string>(
      MAJOR_GLOBAL_MARKETS.map((m) => normalizeMarketCode(m.code)),
    );
    for (const code of activeMarketCodeSet) focusCodes.add(normalizeMarketCode(code));
    for (const stock of renderStocks) focusCodes.add(normalizeMarketCode(stock.market));
    const phaseRank = (phase: MarketStatusPhase) => {
      if (isActiveMarketPhase(phase)) return 0;
      if (phase === "PRE") return 1;
      if (isTransitionalMarketPhase(phase)) return 2;
      return 3;
    };
    return Array.from(focusCodes)
      .map((code) => ({
        code,
        label: getMarketDisplayLabel(code),
        status: applyFeedMarketStatus(
          code,
          getMarketStatus(code, now),
          backendActiveMarketCodeSet,
        ),
      }))
      .sort((a, b) => {
        const rankDiff = phaseRank(a.status.phase) - phaseRank(b.status.phase);
        if (rankDiff !== 0) return rankDiff;
        const aOrder = MAJOR_MARKET_INDEX.get(a.code) ?? Number.MAX_SAFE_INTEGER;
        const bOrder = MAJOR_MARKET_INDEX.get(b.code) ?? Number.MAX_SAFE_INTEGER;
        if (aOrder !== bOrder) return aOrder - bOrder;
        return a.code.localeCompare(b.code, "en", { sensitivity: "base" });
      });
  }, [activeMarketCodeSet, backendActiveMarketCodeSet, renderStocks, serverNow]);

  const hasRowsButInactive = renderStocks.length > 0 && visibleStocks.length === 0;

  const stockSections = useMemo<MarketStockSection[]>(() => {
    if (!visibleStocks.length) {
      marketSectionRowsCacheRef.current.clear();
      return [];
    }
    const byMarket = new Map<string, MarketStock[]>();
    for (const stock of visibleStocks) {
      const code = normalizeMarketCode(stock.market);
      const existing = byMarket.get(code);
      if (existing) existing.push(stock);
      else byMarket.set(code, [stock]);
    }
    const now = serverNow ?? new Date();
    const nextSectionCodes = new Set<string>();
    const sections = Array.from(byMarket.entries()).map(([code, rows]) => {
      nextSectionCodes.add(code);
      const previousRows = marketSectionRowsCacheRef.current.get(code);
      let stableRows = rows;
      if (
        previousRows &&
        previousRows.length === rows.length &&
        previousRows.every((item, idx) => item === rows[idx])
      ) {
        stableRows = previousRows;
      } else {
        marketSectionRowsCacheRef.current.set(code, rows);
      }
      return {
        code,
        label: getMarketDisplayLabel(code),
        status: applyFeedMarketStatus(
          code,
          getMarketStatus(code, now),
          backendActiveMarketCodeSet,
        ),
        data: stableRows,
        totalCount: stableRows.length,
      };
    });
    sections.sort((a, b) => {
      const aOrder = MAJOR_MARKET_INDEX.get(a.code) ?? Number.MAX_SAFE_INTEGER;
      const bOrder = MAJOR_MARKET_INDEX.get(b.code) ?? Number.MAX_SAFE_INTEGER;
      if (aOrder !== bOrder) return aOrder - bOrder;
      return a.code.localeCompare(b.code, "en", { sensitivity: "base" });
    });
    for (const cachedCode of marketSectionRowsCacheRef.current.keys()) {
      if (!nextSectionCodes.has(cachedCode))
        marketSectionRowsCacheRef.current.delete(cachedCode);
    }
    return sections;
  }, [backendActiveMarketCodeSet, serverNow, visibleStocks]);

  const previewSections = useMemo(
    () =>
      stockSections.map((s) => ({
        ...s,
        previewStocks: pickPreviewStocks(s.data, s.code, 4),
      })),
    [stockSections],
  );

  const selectedRegionSection = useMemo(
    () => stockSections.find((s) => s.code === selectedRegionCode) ?? null,
    [selectedRegionCode, stockSections],
  );

  useEffect(() => {
    if (!selectedRegionCode) return;
    if (!stockSections.some((s) => s.code === selectedRegionCode))
      setSelectedRegionCode(null);
  }, [selectedRegionCode, stockSections]);

  const openRegionModal = useCallback((code: string) => setSelectedRegionCode(code), []);
  const closeRegionModal = useCallback(() => setSelectedRegionCode(null), []);

  const handleStockPress = useCallback(
    (symbol: string, stockMarket: string) => {
      setSelectedRegionCode(null);
      router.push(
        `/stock-details/${symbol}?market=${normalizeMarketCode(stockMarket)}`,
      );
    },
    [router],
  );

  useEffect(() => {
    marketRowElementCacheRef.current.clear();
  }, [handleStockPress, showYesterdayChange]);

  const getCachedMarketRowElement = useCallback(
    (item: MarketStock) => {
      const key = getMarketStockKey(item);
      const existing = marketRowElementCacheRef.current.get(key);
      if (existing && existing.itemRef === item) return existing.element;
      const nextElement = (
        <StockRow
          item={item}
          showYesterdayChange={showYesterdayChange}
          onPress={() => handleStockPress(item.symbol, item.market)}
        />
      );
      marketRowElementCacheRef.current.set(key, { itemRef: item, element: nextElement });
      return nextElement;
    },
    [handleStockPress, showYesterdayChange],
  );

  const pressable =
    "transition-transform duration-100 active:scale-[0.97] cursor-pointer select-none";

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div
      className="flex flex-col flex-1 bg-black px-5 pt-6 min-h-screen transition-all duration-500 ease-out"
      style={{
        opacity: mounted ? 1 : 0,
        transform: mounted ? "translateY(0px)" : "translateY(8px)",
      }}
    >
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="mt-2 flex flex-row items-start justify-between">
        <div className="flex-1 pr-3">
          <h1 className="text-white text-[30px] font-semibold tracking-tight leading-tight">
            Markets
          </h1>
          <p className="text-neutral-500 text-[12px] mt-1">
            Grouped by region across global exchanges.
          </p>
        </div>

        <TutorialHighlightTarget targetId="markets.timeline_button">
          <button
            onClick={() => setShowTimelineModal(true)}
            className="h-11 w-11 rounded-full border border-neutral-700 bg-neutral-900/80
              flex items-center justify-center
              transition-transform duration-100 active:scale-95 hover:border-neutral-500"
            aria-label="Open global market timeline"
          >
            <ClockIcon />
          </button>
        </TutorialHighlightTarget>
      </div>

      {/* ── Search bar with inline dropdown ──────────────────────────────── */}
      <TutorialHighlightTarget targetId="markets.search_bar">
        <div ref={searchContainerRef} className="mt-4 relative">
          {/* Input row */}
          <div
            className={`rounded-full border bg-neutral-900/80 px-5 py-3 flex flex-row items-center gap-2
              transition-colors duration-150
              ${query ? "border-neutral-600" : "border-neutral-800 hover:border-neutral-700"}`}
          >
            {searchLoading ? (
              /* mini spinner while loading */
              <svg
                className="animate-spin h-4 w-4 text-neutral-400 shrink-0"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            ) : (
              <SearchIcon />
            )}

            <input
              ref={searchInputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => { if (query.trim()) setSearchOpen(true); }}
              placeholder="Search by ticker or company name…"
              className="flex-1 bg-transparent text-neutral-200 text-[14px] placeholder:text-neutral-500
                outline-none border-none caret-white"
              autoComplete="off"
              spellCheck={false}
            />

            {/* Clear button */}
            {query && (
              <button
                onClick={() => { clearSearch(); searchInputRef.current?.focus(); }}
                className="shrink-0 text-neutral-500 hover:text-neutral-300 transition-colors duration-100"
                aria-label="Clear search"
              >
                <XIcon />
              </button>
            )}
          </div>

          {/* Dropdown results */}
          {searchOpen && query.trim() && (
            <div
              className="absolute top-full left-0 right-0 mt-2 z-40
                rounded-2xl border border-neutral-700 bg-[#0f0f0f]
                shadow-2xl overflow-hidden"
            >
              {/* Error state */}
              {searchError && (
                <div className="px-4 py-3 text-red-400 text-[13px]">{searchError}</div>
              )}

              {/* Loading skeleton rows */}
              {searchLoading && !searchError && (
                <div className="flex flex-col divide-y divide-neutral-800">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="px-4 py-3 flex items-center gap-3 animate-pulse">
                      <div className="h-8 w-8 rounded-full bg-neutral-800 shrink-0" />
                      <div className="flex flex-col gap-1.5 flex-1">
                        <div className="h-3 w-16 rounded bg-neutral-800" />
                        <div className="h-2.5 w-24 rounded bg-neutral-800/60" />
                      </div>
                      <div className="h-3 w-12 rounded bg-neutral-800" />
                    </div>
                  ))}
                </div>
              )}

              {/* Results list */}
              {!searchLoading && !searchError && results.length > 0 && (
                <ul className="divide-y divide-neutral-800/60 max-h-72 overflow-y-auto">
                  {results.map((result) => (
                    <li key={`${result.market}:${result.symbol}`}>
                      <button
                        onClick={() => handleSearchResultClick(result)}
                        className="w-full px-4 py-3 flex items-center gap-3
                          hover:bg-neutral-800/60 active:bg-neutral-700/60
                          transition-colors duration-100 text-left"
                      >
                        {/* Symbol badge */}
                        <div
                          className="h-9 w-9 rounded-full bg-neutral-800 border border-neutral-700
                            flex items-center justify-center shrink-0"
                        >
                          <span className="text-white text-[10px] font-bold leading-none">
                            {result.symbol.slice(0, 3)}
                          </span>
                        </div>

                        {/* Symbol + market */}
                        <div className="flex flex-col flex-1 min-w-0">
                          <span className="text-white text-[13px] font-semibold tracking-wide">
                            {result.symbol}
                          </span>
                          <span className="text-neutral-500 text-[11px] truncate">
                            {getMarketDisplayLabel(result.market)} · {result.currency}
                          </span>
                        </div>

                        {/* Price + market cap */}
                        <div className="flex flex-col items-end shrink-0">
                          <span className="text-white text-[13px] font-semibold tabular-nums">
                            {formatPrice(result.price, result.currency)}
                          </span>
                          {result.marketCap > 0 && (
                            <span className="text-neutral-500 text-[10px] tabular-nums">
                              {formatMarketCap(result.marketCap)}
                            </span>
                          )}
                        </div>

                        {/* Chevron */}
                        <ChevronRightIcon />
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {/* Empty state */}
              {!searchLoading && !searchError && results.length === 0 && (
                <div className="px-4 py-5 flex flex-col items-center gap-1">
                  <span className="text-neutral-400 text-[13px] font-medium">No results found</span>
                  <span className="text-neutral-600 text-[11px]">
                    Try a different ticker or company name
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </TutorialHighlightTarget>

      {/* ── Market status pills ──────────────────────────────────────────── */}
      <TutorialHighlightTarget targetId="markets.active_market_pills">
        {shouldRenderMarketBoard && marketPills.length > 0 ? (
          <div className="mt-3 flex flex-row flex-wrap">
            {marketPills.map((pill) => {
              const isActive = isActiveMarketPhase(pill.status.phase);
              const isPre = pill.status.phase === "PRE";
              const containerCn = isActive
                ? "mr-2 mb-2 rounded-full border border-emerald-500/45 bg-emerald-500/15 px-2.5 py-1 flex flex-row items-center"
                : isPre
                ? "mr-2 mb-2 rounded-full border border-amber-500/45 bg-amber-500/15 px-2.5 py-1 flex flex-row items-center"
                : "mr-2 mb-2 rounded-full border border-neutral-700 bg-neutral-900 px-2.5 py-1 flex flex-row items-center";
              const dotCn = isActive
                ? "h-1.5 w-1.5 rounded-full bg-emerald-300 mr-1.5 shrink-0"
                : isPre
                ? "h-1.5 w-1.5 rounded-full bg-amber-300 mr-1.5 shrink-0"
                : "h-1.5 w-1.5 rounded-full bg-neutral-400 mr-1.5 shrink-0";
              const labelCn = isActive
                ? "text-emerald-100 text-[10px] font-semibold tracking-[0.2px]"
                : isPre
                ? "text-amber-100 text-[10px] font-semibold tracking-[0.2px]"
                : "text-neutral-200 text-[10px] font-semibold tracking-[0.2px]";
              const phaseCn = isActive
                ? "ml-1 text-[9px] font-semibold text-emerald-200"
                : isPre
                ? "ml-1 text-[9px] font-semibold text-amber-200"
                : "ml-1 text-[9px] font-semibold text-neutral-400";

              return (
                <div key={`market-pill-${pill.code}`} className={containerCn}>
                  <div className={dotCn} />
                  <span className={labelCn}>{pill.label}</span>
                  <span className={phaseCn}>{getPhasePillText(pill.status.phase)}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="mt-3 h-2" />
        )}
      </TutorialHighlightTarget>

      {/* ── Main board ───────────────────────────────────────────────────── */}
      {shouldRenderMarketBoard ? (
        <div className="flex flex-col flex-1 overflow-y-auto pb-28">
          <div className="flex justify-end mt-1">
            <button
              onClick={() => void handleManualRefresh()}
              disabled={!manualRefreshReady || manualRefreshing}
              className="text-neutral-400 text-[11px] px-3 py-1.5 rounded-full border
                border-neutral-700 transition-all duration-100 active:scale-95
                hover:border-neutral-500 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {manualRefreshing ? "Refreshing…" : "↻ Refresh"}
            </button>
          </div>

          {stockSections.length > 0 ? (
            <>
              <div className="mt-2 flex flex-row flex-wrap">
                {stockSections.map((section) => (
                  <button
                    key={`market-region-btn-${section.code}`}
                    onClick={() => openRegionModal(section.code)}
                    className={`mr-2 mb-2 rounded-full border border-neutral-700 bg-neutral-900
                      px-3 py-1.5 ${pressable}`}
                  >
                    <span className="text-neutral-200 text-[11px] font-semibold">
                      {section.label} ({section.totalCount})
                    </span>
                  </button>
                ))}
              </div>

              <div className="mt-2 flex flex-col">
                {previewSections.map((section) => (
                  <div
                    key={`market-preview-${section.code}`}
                    className="mb-3 rounded-2xl border border-neutral-700 bg-neutral-900 px-3.5 py-3"
                  >
                    <div className="flex flex-row items-center justify-between">
                      <span className="text-white text-[13px] font-semibold tracking-[0.8px]">
                        {section.label}
                      </span>
                      <button
                        onClick={() => openRegionModal(section.code)}
                        className={`rounded-full border border-neutral-700 bg-black/30 px-3 py-1 ${pressable}`}
                      >
                        <span className="text-neutral-200 text-[11px] font-semibold">See all</span>
                      </button>
                    </div>

                    <div className="mt-3 flex flex-row flex-wrap">
                      {section.previewStocks.map((stock) => (
                        <button
                          key={`market-preview-chip-${section.code}-${getMarketStockKey(stock)}`}
                          onClick={() => handleStockPress(stock.symbol, stock.market)}
                          className="mr-2 mb-2 rounded-full border border-neutral-700 bg-black/20 px-3 py-2
                            transition-transform duration-100 active:scale-[0.96]"
                        >
                          <span className="text-neutral-100 text-[11px] font-semibold">
                            {stock.symbol}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="mt-16 flex flex-col items-center px-6">
              <span className="text-neutral-400 text-lg font-semibold text-center">
                {marketLoading
                  ? "Refreshing market…"
                  : hasRowsButInactive
                  ? "Markets are currently inactive"
                  : "No market rows available"}
              </span>
              <span className="text-neutral-600 text-sm mt-2 text-center">
                {marketLoading
                  ? "Fetching the latest board."
                  : hasRowsButInactive
                  ? "Only active regions are shown. Check timeline for open times."
                  : "Waiting for market data."}
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-2">
          <svg
            className="animate-spin h-6 w-6 text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <span className="text-neutral-500 text-[13px]">Loading market board…</span>
        </div>
      )}

      {shouldRenderMarketBoard && manualRefreshReady && (
        <div className="pointer-events-none absolute left-0 right-0 flex justify-center bottom-4">
          <span className="text-neutral-500 text-[11px]">Click refresh to update</span>
        </div>
      )}

      {/* ── Region detail bottom sheet ───────────────────────────────────── */}
      {selectedRegionSection !== null && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/70" onClick={closeRegionModal} />
          <div className="relative max-h-[86vh] rounded-t-3xl border border-neutral-700 bg-[#090909] px-4 pt-4 pb-6 flex flex-col">
            <div className="flex flex-row items-center justify-between">
              <div>
                <span className="text-white text-[16px] font-semibold">
                  {selectedRegionSection.label}
                </span>
                <p className="text-neutral-500 text-[12px] mt-1">
                  {selectedRegionSection.totalCount} stocks
                </p>
              </div>
              <button
                onClick={closeRegionModal}
                className="h-9 w-9 rounded-full border border-neutral-700 bg-neutral-900
                  flex items-center justify-center transition-transform duration-100 active:scale-90"
                aria-label="Close"
              >
                <XIcon />
              </button>
            </div>
            <div className="mt-3 overflow-y-auto">
              {selectedRegionSection.data.map((item) => (
                <div key={`market-region-row-${getMarketStockKey(item)}`} className="mb-1.5">
                  {getCachedMarketRowElement(item)}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Timeline modal ───────────────────────────────────────────────── */}
      {showTimelineModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/70" onClick={() => setShowTimelineModal(false)} />
          <div className="relative mx-5 w-full max-w-md rounded-3xl border border-neutral-700 bg-[#090909] px-4 py-4">
            <div className="flex flex-row items-center justify-between mb-2">
              <span className="text-white text-[16px] font-semibold">Global Market Timeline</span>
              <button
                onClick={() => setShowTimelineModal(false)}
                className="h-9 w-9 rounded-full border border-neutral-700 bg-neutral-900
                  flex items-center justify-center transition-transform duration-100 active:scale-90"
                aria-label="Close"
              >
                <XIcon />
              </button>
            </div>
            <p className="text-neutral-500 text-[12px] mb-3">
              Click outside to close. Status is shown in your local time.
            </p>
            <div className="max-h-[420px] overflow-y-auto flex flex-col">
              {globalMarketStatuses.map(({ marketConfig, status }, index) => {
                const active = isActiveMarketPhase(status.phase);
                const transition = isTransitionalMarketPhase(status.phase);
                return (
                  <div
                    key={`market-timeline-${marketConfig.code}`}
                    className={`rounded-2xl border px-3.5 py-3
                      ${index === globalMarketStatuses.length - 1 ? "" : "mb-2.5"}
                      ${active
                        ? "border-emerald-500/45 bg-emerald-500/10"
                        : transition
                        ? "border-amber-500/45 bg-amber-500/10"
                        : "border-neutral-700 bg-neutral-900"
                      }`}
                  >
                    <div className="flex flex-row items-center justify-between">
                      <span className="text-white text-[13px] font-semibold tracking-[0.8px]">
                        {marketConfig.label}
                      </span>
                      <span
                        className={`text-[11px] font-semibold tracking-[0.8px] ${
                          active ? "text-emerald-300" : transition ? "text-amber-300" : "text-neutral-300"
                        }`}
                      >
                        {getPhasePillText(status.phase)}
                      </span>
                    </div>
                    <p className="text-neutral-400 text-[11px] mt-1.5">{status.detail}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Inline SVG icons — no icon-library dependency
// ---------------------------------------------------------------------------

function XIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={16} height={16} viewBox="0 0 24 24"
      fill="none" stroke="#E5E5E5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={18} height={18} viewBox="0 0 24 24"
      fill="none" stroke="#E5E5E5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={16} height={16} viewBox="0 0 24 24"
      fill="none" stroke="#7A7A7A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      className="shrink-0">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={14} height={14} viewBox="0 0 24 24"
      fill="none" stroke="#525252" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      className="shrink-0">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}