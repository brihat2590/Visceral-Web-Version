"use client";

import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  ReactElement,
} from "react";
import { createClient } from "@/lib/supabase/client";

import {
  refreshMarketsSnapshot,
  useMarketsRealtimeState,
} from "@/lib/realtime/markets-realtime";

/* ============================================================
   TYPES
============================================================ */

type SessionWindow = { start: number; end: number };

type MarketStatusPhase =
  | "ALWAYS_OPEN"
  | "OPEN"
  | "PRE"
  | "POST"
  | "BREAK"
  | "CLOSED"
  | "WEEKEND";

type MarketStock = {
  symbol: string;
  company_name?: string;
  name?: string;
  logo_url?: string;
  market: string;
  display_price: number;
  percentage_change: number;
  yesterday_price_change: number;
  updated_at?: string;
};

/* ============================================================
   CONSTANTS
============================================================ */
const supabase=createClient();
const MARKET_REALTIME_TABLE =
  process.env.NEXT_PUBLIC_MARKETS_REALTIME_TABLE?.trim() || "market_prices";

const MARKET_CACHE_KEY = "market_screen_board_cache_v1";
const MARKET_MANUAL_REFRESH_COOLDOWN_MS = 30_000;

const MAJOR_GLOBAL_MARKETS = [
  { code: "US", label: "US" },
  { code: "INDIA", label: "India" },
  { code: "LONDON", label: "London" },
  { code: "JAPAN", label: "Japan" },
  { code: "CRYPTO", label: "Crypto" },
];

const MARKET_SESSION_CONFIGS: Record<
  string,
  {
    timeZone: string;
    regularWindows: SessionWindow[];
    alwaysOpen?: boolean;
  }
> = {
  US: {
    timeZone: "America/New_York",
    regularWindows: [{ start: 9 * 60 + 30, end: 16 * 60 }],
  },
  INDIA: {
    timeZone: "Asia/Kolkata",
    regularWindows: [{ start: 9 * 60 + 15, end: 15 * 60 + 30 }],
  },
  LONDON: {
    timeZone: "Europe/London",
    regularWindows: [{ start: 8 * 60, end: 16 * 60 + 30 }],
  },
  JAPAN: {
    timeZone: "Asia/Tokyo",
    regularWindows: [{ start: 9 * 60, end: 15 * 60 }],
  },
  CRYPTO: {
    timeZone: "UTC",
    regularWindows: [{ start: 0, end: 24 * 60 }],
    alwaysOpen: true,
  },
};

/* ============================================================
   UTILITIES
============================================================ */

function normalizeMarketCode(value: unknown) {
  if (typeof value !== "string") return "US";
  return value.trim().toUpperCase();
}

function isInWindow(minutes: number, window: SessionWindow) {
  return minutes >= window.start && minutes < window.end;
}

function getZonedTime(now: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });

  const parts = formatter.formatToParts(now);
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? 0);

  return hour * 60 + minute;
}

function getMarketStatus(market: string, now: Date) {
  const config = MARKET_SESSION_CONFIGS[market] ?? MARKET_SESSION_CONFIGS.US;

  if (config.alwaysOpen) {
    return { phase: "ALWAYS_OPEN" as const };
  }

  const minutes = getZonedTime(now, config.timeZone);

  for (const window of config.regularWindows) {
    if (isInWindow(minutes, window)) {
      return { phase: "OPEN" as const };
    }
  }

  return { phase: "CLOSED" as const };
}

/* ============================================================
   CACHE
============================================================ */

function readCache() {
  try {
    const raw = localStorage.getItem(MARKET_CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeCache(payload: any) {
  try {
    localStorage.setItem(
      MARKET_CACHE_KEY,
      JSON.stringify({
        savedAt: Date.now(),
        payload,
      })
    );
  } catch {}
}

/* ============================================================
   COMPONENT
============================================================ */

export default function MarketScreen() {
  const router = useRouter();
  const marketsRealtime = useMarketsRealtimeState();

  const [stocks, setStocks] = useState<MarketStock[]>([]);
  const [activeRegions, setActiveRegions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [manualRefreshing, setManualRefreshing] = useState(false);
  const [manualReady, setManualReady] = useState(true);
  const [clockTick, setClockTick] = useState(0);
  const [showTimeline, setShowTimeline] = useState(false);

  const perfAnchorRef = useRef(performance.now());
  const serverAnchorRef = useRef<number | null>(null);

  /* =========================
     CLOCK
  ========================== */

  useEffect(() => {
    const timer = setInterval(() => {
      setClockTick((p) => p + 1);
    }, 30_000);
    return () => clearInterval(timer);
  }, []);

  /* =========================
     APPLY REALTIME
  ========================== */

  useEffect(() => {
    if (!marketsRealtime.data) return;

    const data = marketsRealtime.data.stocks ?? [];
    setStocks(data);
    setActiveRegions(marketsRealtime.data.active_regions ?? []);
    setLoading(false);

    serverAnchorRef.current = Date.now();
    perfAnchorRef.current = performance.now();

    writeCache({
      stocks: data,
      activeRegions: marketsRealtime.data.active_regions ?? [],
    });
  }, [marketsRealtime.data]);

  /* =========================
     TABLE FALLBACK
  ========================== */

  useEffect(() => {
    if (marketsRealtime.data) return;

    const load = async () => {
      const { data } = await supabase
        .from(MARKET_REALTIME_TABLE)
        .select("*")
        .limit(500);

      if (!data) return;

      setStocks(data);
      setLoading(false);
    };

    load();
  }, [marketsRealtime.data]);

  /* =========================
     MANUAL REFRESH
  ========================== */

  const handleRefresh = useCallback(async () => {
    if (!manualReady) return;

    setManualRefreshing(true);
    await refreshMarketsSnapshot();
    setManualRefreshing(false);
    setManualReady(false);

    setTimeout(() => {
      setManualReady(true);
    }, MARKET_MANUAL_REFRESH_COOLDOWN_MS);
  }, [manualReady]);

  /* =========================
     DERIVED
  ========================== */

  const serverNow = useMemo(() => {
    if (!serverAnchorRef.current) return new Date();
    const elapsed = performance.now() - perfAnchorRef.current;
    return new Date(serverAnchorRef.current + elapsed);
  }, [clockTick]);

  const marketStatuses = useMemo(() => {
    return MAJOR_GLOBAL_MARKETS.map((m) => ({
      ...m,
      status: getMarketStatus(m.code, serverNow),
    }));
  }, [serverNow]);

  /* ============================================================
     UI
  ============================================================ */

  return (
    <div className="min-h-screen bg-black px-6 pt-6 text-white">
      <div className="flex justify-between items-start">
        <div>
          <div className="text-3xl font-semibold">Markets</div>
          <div className="text-neutral-500 text-sm mt-1">
            Grouped by region across global exchanges.
          </div>
        </div>

        <button
          onClick={() => setShowTimeline(true)}
          className="border border-neutral-700 rounded-full px-4 py-2 text-sm"
        >
          Timeline
        </button>
      </div>

      {/* Search */}
      <div
        onClick={() => router.push("/dashboard/search")}
        className="mt-4 border border-neutral-800 bg-neutral-900 rounded-full px-4 py-3 cursor-pointer"
      >
        <span className="text-neutral-500 text-sm">
          Search by ticker or symbol
        </span>
      </div>

      {/* Market Pills */}
      <div className="mt-4 flex flex-wrap gap-2">
        {marketStatuses.map((m) => (
          <div
            key={m.code}
            className={`px-3 py-1 rounded-full text-xs font-semibold ${
              m.status.phase === "OPEN" || m.status.phase === "ALWAYS_OPEN"
                ? "bg-emerald-600"
                : "bg-neutral-800"
            }`}
          >
            {m.label} — {m.status.phase}
          </div>
        ))}
      </div>

      {/* Stocks */}
      {loading ? (
        <div className="mt-20 text-center text-neutral-500">
          Loading market board...
        </div>
      ) : (
        <div className="mt-6 space-y-2 pb-32">
          {stocks.map((s) => (
            <div
              key={`${s.market}:${s.symbol}`}
              onClick={() =>
                router.push(
                  `/stock-details/${s.symbol}?market=${normalizeMarketCode(
                    s.market
                  )}`
                )
              }
              className="border border-neutral-800 bg-neutral-900 p-4 rounded-xl cursor-pointer hover:bg-neutral-800"
            >
              <div className="flex justify-between">
                <div>
                  <div className="font-semibold">{s.symbol}</div>
                  <div className="text-neutral-500 text-xs">
                    {s.company_name || s.name}
                  </div>
                </div>

                <div className="text-right">
                  <div>${s.display_price.toFixed(2)}</div>
                  <div
                    className={`text-xs ${
                      s.percentage_change >= 0
                        ? "text-emerald-400"
                        : "text-red-400"
                    }`}
                  >
                    {s.percentage_change.toFixed(2)}%
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Refresh */}
      <div className="fixed bottom-6 left-0 right-0 flex justify-center">
        <button
          onClick={handleRefresh}
          disabled={!manualReady}
          className="bg-neutral-800 px-6 py-2 rounded-full text-sm"
        >
          {manualRefreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* Timeline Modal */}
      {showTimeline && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center">
          <div className="bg-neutral-900 border border-neutral-700 rounded-3xl p-6 w-[420px] max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between mb-4">
              <div className="font-semibold">Global Market Timeline</div>
              <button onClick={() => setShowTimeline(false)}>Close</button>
            </div>

            {marketStatuses.map((m) => (
              <div
                key={m.code}
                className="mb-3 p-3 border border-neutral-800 rounded-xl"
              >
                <div className="flex justify-between">
                  <div>{m.label}</div>
                  <div>{m.status.phase}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}