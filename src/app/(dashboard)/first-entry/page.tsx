"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, TrendingUp, TrendingDown, ChevronRight } from "lucide-react";

// Libs & Hooks (Assuming these are migrated to web)
import { getWatchList } from "@/api/watchlist";
import { useAuth } from "@/hooks/useAuth";
import { getDisplaySymbol } from "@/lib/displaySymbol";
import { formatPrice } from "@/lib/formatPrice";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://127.0.0.1:8000";

type WatchlistItem = {
  symbol: string;
  market: string;
  company_name?: string;
};

export default function HomeScreen() {
  const router = useRouter();
  const { user, authloading } = useAuth();
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [watchlistLoading, setWatchlistLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);
    fetch(`${BASE_URL}/home?user_id=${user.id}`)
      .then((res) => res.json())
      .then(setData)
      .catch(err => console.error("Home fetch error:", err))
      .finally(() => setLoading(false));
  }, [user?.id]);

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

  if (authloading || loading || !data) {
    return (
      <div className="flex min-h-screen bg-black items-center justify-center">
        <Loader2 className="w-8 h-8 text-white animate-spin opacity-50" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white px-5 pt-10 pb-20 max-w-2xl mx-auto">
      
      {/* 💳 Balance Card */}
      <section 
        className="rounded-3xl p-6 border border-neutral-800 shadow-2xl transition-all"
        style={{ background: 'linear-gradient(135deg, #080808 0%, #121212 100%)' }}
      >
        <header className="flex justify-between items-center">
          <h2 className="text-neutral-500 text-[10px] font-bold tracking-[2px] uppercase">
            Total Paper Balance
          </h2>
        </header>

        <div className="text-4xl font-light mt-3 tracking-tight">
          ${data.available_balance.toLocaleString("en-IN", {
            minimumFractionDigits: 2,
          })}
        </div>

        <div className="h-[1px] bg-neutral-800/50 my-6" />

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

      {/* 🧠 Almanack Analysis */}
      {data?.almanack?.system_analysis && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full mt-8 text-left group"
        >
          <div className="bg-gradient-to-br from-black to-neutral-900 border border-neutral-800 rounded-2xl p-5 hover:border-neutral-700 transition-colors">
            <h2 className="text-neutral-500 text-[10px] font-bold tracking-[2px] mb-3 uppercase">
              Almanack Analysis
            </h2>

            <div className={`grid transition-all duration-300 ease-in-out ${expanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
               <div className="overflow-hidden">
                  <p className="text-neutral-200 text-base leading-7">
                    {data.almanack.system_analysis}
                  </p>
               </div>
            </div>

            {!expanded && (
              <>
                <p className="text-neutral-200 text-base leading-7 line-clamp-3">
                  {data.almanack.system_analysis}
                </p>
                <p className="text-neutral-500 text-xs mt-2 group-hover:text-neutral-300">
                  Tap to expand
                </p>
              </>
            )}
          </div>
        </button>
      )}

      {/* 👁️ Watchlist */}
      <section className="mt-10">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-neutral-500 text-[10px] font-bold tracking-[2px] uppercase">
            Watchlist
          </h2>
          <button className="text-neutral-600 text-[10px] hover:text-neutral-400">SEE ALL</button>
        </div>
        
        {watchlistLoading ? (
          <div className="flex py-4 justify-center"><Loader2 className="w-4 h-4 animate-spin text-neutral-600" /></div>
        ) : (
          <div className="flex overflow-x-auto gap-3 pb-2 scrollbar-hide -mx-5 px-5">
            {watchlist.map((item, idx) => (
              <button
                key={`${item.symbol}-${idx}`}
                onClick={() => router.push(`/stock-details/${item.symbol}?market=${item.market}`)}
                className="flex-shrink-0 w-32 p-4 rounded-2xl bg-neutral-900/50 border border-neutral-800 hover:bg-neutral-800 transition-colors text-left"
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
            ))}
          </div>
        )}
      </section>

      {/* 📊 Holdings */}
      <section className="mt-10">
        <h2 className="text-neutral-500 text-[10px] font-bold tracking-[2px] mb-4 uppercase">
          Your Holdings
        </h2>
        
        {data.holdings.length === 0 ? (
          <div className="py-10 border border-dashed border-neutral-800 rounded-2xl text-center">
            <p className="text-neutral-600 text-sm italic">No assets acquired yet.</p>
          </div>
        ) : (
          <div className="flex flex-col">
            {data.holdings.map((item: any) => (
              <HoldingRow key={item.symbol} holding={item} onClick={() => router.push(`/stock-details/${item.symbol}`)} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

/* ───────── Sub-Components ───────── */

function MiniStat({ label, value, positive }: { label: string; value: string; positive: boolean }) {
  return (
    <div>
      <p className="text-neutral-500 text-[9px] font-bold tracking-widest uppercase">
        {label}
      </p>
      <div className={`text-lg font-medium mt-1 flex items-center gap-1 ${positive ? "text-emerald-400" : "text-rose-500"}`}>
        {positive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
        {value}
      </div>
    </div>
  );
}

function HoldingRow({ holding, onClick }: { holding: any, onClick: () => void }) {
  const pnl = holding.unrealized_pnl ?? 0;
  const pnlPercentage = holding.unrealized_pnl_pct ?? 0;
  const market = typeof holding.region === "string" ? holding.region.toUpperCase() : "US";
  const displaySymbol = getDisplaySymbol(holding.symbol, market);
  const value = holding.current_value ?? holding.avg_price ?? 0;

  return (
    <button 
      onClick={onClick}
      className="flex justify-between items-center py-5 border-b border-neutral-900 group text-left hover:px-2 transition-all"
    >
      <div className="flex-1">
        <div className="text-white text-base font-semibold tracking-tight">
          {displaySymbol}
        </div>
        {holding.company_name && (
          <div className="text-neutral-500 text-xs mt-0.5 truncate max-w-[180px]">
            {holding.company_name}
          </div>
        )}
        <div className="text-neutral-600 text-[10px] mt-1">
          {holding.quantity} Units
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right">
          <div className="text-white font-medium text-base">
            {formatPrice(value, market)}
          </div>
          <div className={`inline-block mt-1 px-1.5 py-0.5 rounded text-[11px] font-bold ${pnl >= 0 ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"}`}>
            {pnlPercentage >= 0 ? "+" : ""}{pnlPercentage.toFixed(2)}%
          </div>
        </div>
        <ChevronRight size={16} className="text-neutral-800 group-hover:text-neutral-500 transition-colors" />
      </div>
    </button>
  );
}