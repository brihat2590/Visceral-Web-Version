"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { TrendingUp, TrendingDown, ChevronRight, RefreshCw } from "lucide-react";

// Libs & Hooks
import { getWatchList } from "@/api/watchlist";
import { useAuth } from "@/hooks/useAuth";
import { getDisplaySymbol } from "@/lib/displaySymbol";
import { formatPrice } from "@/lib/formatPrice";
import VisceralLoader from "@/components/Loader";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://127.0.0.1:8000";
// How long before we give up on the backend and show an error
const HOME_FETCH_TIMEOUT_MS = 15_000;

type WatchlistItem = {
  symbol: string;
  market: string;
  company_name?: string;
};

export default function HomeScreen() {
  const router = useRouter();
  const { user, authloading } = useAuth();

  // ── Start loading=true immediately so there's never a flash ──────────────
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [watchlistLoading, setWatchlistLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Still waiting for auth — keep spinner showing
    if (authloading) return;

    // Auth resolved but no user
    if (!user?.id) {
      setLoading(false);
      return;
    }

    // Cancel any previous in-flight request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    // Timeout guard — aborts after HOME_FETCH_TIMEOUT_MS
    const timeout = setTimeout(() => {
      controller.abort();
    }, HOME_FETCH_TIMEOUT_MS);

    setLoading(true);
    setError(null);

    fetch(`${BASE_URL}/home?user_id=${user.id}`, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`Server error ${res.status}`);
        return res.json();
      })
      .then((json) => {
        setData(json);
        setError(null);
      })
      .catch((err) => {
        if (err.name === "AbortError") {
          setError("Dashboard is taking longer than expected. Please try again.");
        } else {
          setError(err?.message ?? "Failed to load dashboard.");
        }
      })
      .finally(() => {
        clearTimeout(timeout);
        setLoading(false);
      });

    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, [authloading, user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    const fetchWatchlist = async () => {
      try {
        setWatchlistLoading(true);
        const res = await getWatchList(user.id);
        const items: WatchlistItem[] = res.watchlist.map((w: any) => ({
          symbol: w.symbol,
          market: w.market,
          company_name: w.company_name,
        }));
        setWatchlist(items);
      } catch (e) {
        console.error("Failed to fetch watchlist", e);
      } finally {
        setWatchlistLoading(false);
      }
    };
    fetchWatchlist();
  }, [user?.id]);

  // ── Full-screen loader ────────────────────────────────────────────────────
  if (authloading || loading) {
    return (
      <div className="flex min-h-screen bg-black items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <VisceralLoader />
          <p className="text-neutral-500 text-xs tracking-widest uppercase animate-pulse">
            Opening Dashboard
          </p>
        </div>
      </div>
    );
  }

  // ── Error state — graceful, with retry ───────────────────────────────────
  if (error || !data) {
    return (
      <div className="flex min-h-screen bg-black items-center justify-center px-6">
        <div className="text-center space-y-6 max-w-sm">
          {/* Icon */}
          <div className="w-12 h-12 rounded-full border border-neutral-800 bg-neutral-900 flex items-center justify-center mx-auto">
            <RefreshCw size={20} className="text-neutral-500" />
          </div>

          {/* Message */}
          <div className="space-y-2">
            <p className="text-white text-sm font-medium">
              {error ?? "Dashboard unavailable"}
            </p>
            <p className="text-neutral-500 text-xs leading-relaxed">
              The server may be slow or temporarily unreachable.
            </p>
          </div>

          {/* Retry button */}
          <button
            onClick={() => {
              setError(null);
              setData(null);
              setLoading(true);

              abortRef.current?.abort();
              const controller = new AbortController();
              abortRef.current = controller;
              const timeout = setTimeout(() => controller.abort(), HOME_FETCH_TIMEOUT_MS);

              fetch(`${BASE_URL}/home?user_id=${user?.id}`, { signal: controller.signal })
                .then((res) => {
                  if (!res.ok) throw new Error(`Server error ${res.status}`);
                  return res.json();
                })
                .then((json) => { setData(json); setError(null); })
                .catch((err) => {
                  setError(
                    err.name === "AbortError"
                      ? "Dashboard is taking longer than expected. Please try again."
                      : err?.message ?? "Failed to load dashboard."
                  );
                })
                .finally(() => { clearTimeout(timeout); setLoading(false); });
            }}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white text-black text-sm font-semibold hover:bg-zinc-200 active:scale-95 transition-all"
          >
            <RefreshCw size={14} />
            Try again
          </button>

          {/* Back link */}
          <button
            onClick={() => router.push("/login")}
            className="block text-neutral-600 text-xs hover:text-neutral-400 transition-colors mx-auto"
          >
            Back to login
          </button>
        </div>
      </div>
    );
  }

  // ── Main dashboard ────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-black text-white px-5 pt-10 pb-20 max-w-2xl md:max-w-4xl mx-auto">
      <BalanceCard data={data} />

      {data?.almanack?.system_analysis && (
        <AlmanackSection
          analysis={data.almanack.system_analysis}
          expanded={expanded}
          onToggle={() => setExpanded(!expanded)}
        />
      )}

      <WatchlistSection
        watchlist={watchlist}
        loading={watchlistLoading}
        onItemClick={(symbol, market) =>
          router.push(`/stock-details/${symbol}?market=${market}`)
        }
      />

      <HoldingsSection
        holdings={data.holdings}
        onHoldingClick={(symbol, market) => router.push(`/stock-details/${symbol}?market=${market}`)}
      />
    </div>
  );
}

/* ═══════════════════════ COMPONENT SECTIONS ═══════════════════════ */

function BalanceCard({ data }: { data: any }) {
  return (
    <section className="card-base rounded-3xl p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="section-label">Total Paper Balance</h2>
      </div>
      <div className="text-4xl font-light tracking-tight">
        ${data.available_balance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
      </div>
      <div className="divider-line my-6" />
      <div className="flex justify-between">
        <MiniStat
          label="Total Gain"
          value={`${data.total_return.percentage > 0 ? "+" : ""}${data.total_return.percentage.toFixed(2)}%`}
          positive={data.total_return.percentage >= 0}
        />
        <MiniStat
          label="1D Change"
          value={`${data.single_day_return.percentage > 0 ? "+" : ""}${data.single_day_return.percentage.toFixed(2)}%`}
          positive={data.single_day_return.percentage >= 0}
        />
      </div>
    </section>
  );
}

function AlmanackSection({
  analysis,
  expanded,
  onToggle,
}: {
  analysis: string;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <button onClick={onToggle} className="w-full mt-8 text-left group">
      <div className={`card-base rounded-2xl p-6 transition-all duration-300 ${
        expanded
          ? "border-emerald-500/30 bg-gradient-to-br from-black via-black to-emerald-950/10"
          : "hover:border-neutral-700"
      }`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-label">Almanack Analysis</h2>
          <div className={`text-neutral-500 transition-transform duration-300 ${expanded ? "rotate-180" : ""}`}>
            <ChevronRight size={16} />
          </div>
        </div>
        <div className="divider-line mb-4" />
        {expanded ? (
          <div className="animate-in fade-in duration-300 space-y-4">
            <p className="text-neutral-100 text-sm leading-8 font-light">{analysis}</p>
            <p className="text-neutral-600 text-xs italic">Tap to collapse</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-neutral-300 text-sm leading-6 line-clamp-3 font-light">{analysis}</p>
            <p className="text-neutral-500 text-xs group-hover:text-neutral-300 transition-colors flex items-center gap-1">
              Tap to expand →
            </p>
          </div>
        )}
      </div>
    </button>
  );
}

function WatchlistSection({
  watchlist,
  loading,
  onItemClick,
}: {
  watchlist: WatchlistItem[];
  loading: boolean;
  onItemClick: (symbol: string, market: string) => void;
}) {
  return (
    <section className="mt-10">
      <div className="flex justify-between items-center mb-4">
        <h2 className="section-label">Watchlist</h2>
        <button className="text-neutral-600 text-[10px] hover:text-neutral-400 transition-colors">
          SEE ALL
        </button>
      </div>
      {loading ? (
        <div className="flex items-center justify-center py-6 gap-3">
          <VisceralLoader />
          <span className="text-neutral-500 text-xs tracking-wider">Loading watchlist...</span>
        </div>
      ) : watchlist.length === 0 ? (
        <p className="text-neutral-700 text-sm italic py-4">No items in watchlist yet.</p>
      ) : (
        <div className="flex overflow-x-auto gap-3 pb-2 scrollbar-hide -mx-5 px-5">
          {watchlist.map((item, idx) => (
            <WatchlistCard
              key={`${item.symbol}-${idx}`}
              item={item}
              onClick={() => onItemClick(item.symbol, item.market)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function HoldingsSection({
  holdings,
  onHoldingClick,
}: {
  holdings: any[];
  onHoldingClick: (symbol: string, market: string) => void;
}) {
  return (
    <section className="mt-10">
      <h2 className="section-label mb-4">Your Holdings</h2>
      {holdings.length === 0 ? (
        <div className="py-10 border border-dashed border-neutral-800 rounded-2xl text-center">
          <p className="text-neutral-600 text-sm italic">No assets acquired yet.</p>
        </div>
      ) : (
        <div className="flex flex-col">
          {holdings.map((holding: any) => {
            const market = typeof holding.region === "string" ? holding.region.toUpperCase() : "US";
            return (
              <HoldingRow
                key={holding.symbol}
                holding={holding}
                onClick={() => onHoldingClick(holding.symbol, market)}
              />
            );
          })}
        </div>
      )}
    </section>
  );
}

/* ═══════════════════════ SUB-COMPONENTS ═══════════════════════ */

function MiniStat({
  label,
  value,
  positive,
}: {
  label: string;
  value: string;
  positive: boolean;
}) {
  return (
    <div>
      <p className="text-neutral-500 text-[9px] font-bold tracking-widest uppercase">{label}</p>
      <div className={`text-lg font-medium mt-1 flex items-center gap-1 ${positive ? "text-emerald-400" : "text-rose-500"}`}>
        {positive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
        {value}
      </div>
    </div>
  );
}

function WatchlistCard({
  item,
  onClick,
}: {
  item: WatchlistItem;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="card-base flex-shrink-0 w-32 p-4 rounded-2xl hover:bg-neutral-800 transition-all text-left"
    >
      <div className="text-white font-bold text-lg">
        {getDisplaySymbol(item.symbol, item.market)}
      </div>
      {item.company_name && (
        <div className="text-neutral-500 text-xs mt-1 line-clamp-2 leading-tight">
          {item.company_name}
        </div>
      )}
      <div className="text-neutral-600 text-[9px] mt-2 uppercase tracking-tighter">
        {item.market}
      </div>
    </button>
  );
}

function HoldingRow({
  holding,
  onClick,
}: {
  holding: any;
  onClick: () => void;
}) {
  const pnl = holding.unrealized_pnl ?? 0;
  const pnlPercentage = holding.unrealized_pnl_pct ?? 0;
  const market = typeof holding.region === "string" ? holding.region.toUpperCase() : "US";
  const displaySymbol = getDisplaySymbol(holding.symbol, market);
  const value = holding.current_value ?? holding.avg_price ?? 0;
  const isPositive = pnl >= 0;

  return (
    <button
      onClick={onClick}
      className="flex justify-between items-center py-5 border-b border-neutral-900 group text-left hover:px-2 transition-all"
    >
      <div className="flex-1">
        <div className="text-white text-base font-semibold tracking-tight">{displaySymbol}</div>
        {holding.company_name && (
          <div className="text-neutral-500 text-xs mt-0.5 truncate max-w-[180px]">
            {holding.company_name}
          </div>
        )}
        <div className="text-neutral-600 text-[10px] mt-1">{holding.quantity} Units</div>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <div className="text-white font-medium text-base">{formatPrice(value, market)}</div>
          <div className={`inline-block mt-1 px-1.5 py-0.5 rounded text-[11px] font-bold ${
            isPositive ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
          }`}>
            {pnlPercentage >= 0 ? "+" : ""}{pnlPercentage.toFixed(2)}%
          </div>
        </div>
        <ChevronRight size={16} className="text-neutral-800 group-hover:text-neutral-500 transition-colors" />
      </div>
    </button>
  );
}