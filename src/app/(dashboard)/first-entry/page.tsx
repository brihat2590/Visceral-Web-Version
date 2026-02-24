"use client";

import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, RefreshCw, TrendingUp, TrendingDown } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
// Mocking/Importing your existing logic (Adjust paths as needed)
import FinancialGuideModal from "@/components/financial-guide-modal";
import { useAuth } from "@/hooks/useAuth";
import { getWatchList } from "@/api/watchlist";
import { getDisplaySymbol } from "@/lib/displaySymbol";
import { formatPrice } from "@/lib/formatPrice";
import { resolveMarketRegion } from "@/lib/market-region";
import { useHomeRealtime } from "@/lib/realtime/home-realtime";
import { getOrFetchSecurityLogo } from "@/lib/security-logo-cache";

import { markFinancialGuideSeen, shouldShowFinancialGuide } from "@/lib/financial-guide";
// import { getUserOnboardingState, getOnboardingRedirectPath } from "@/lib/useNewRedirect";
import { createCipheriv } from "crypto";

/**
 * UTILS & CONSTANTS
 */
const supabase=createClient();
const HOME_CACHE_KEY_PREFIX = "first_entry_home_cache_v1";
const HOME_MANUAL_REFRESH_COOLDOWN_MS = 1000 * 30;

// LocalStorage Helper for Next.js (Safe for SSR)
const storage = {
  getItem: (key: string) => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(key);
  },
  setItem: (key: string, value: string) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(key, value);
    }
  },
};

/**
 * TYPES (Synchronized with your provided code)
 */
type HomeCacheEnvelope = { savedAt: number; payload: any };
type HoldingSummary = {
  key: string; symbol: string; displaySymbol: string;
  companyName?: string; logoUrl?: string; market: string;
  quantity: number; avgPrice: number; currentPrice: number;
  currentValue: number; investedValue: number;
  totalReturnAmount: number; totalReturnPct: number;
};
type WatchlistSummary = {
  key: string; symbol: string; market: string;
  displaySymbol: string; companyName?: string; logoUrl?: string;
};

export default function HomeScreen() {
  const router = useRouter();
  const { user, authloading } = useAuth();
  
  // Realtime hook (Assuming this works on web via WebSockets/Supabase)
  const homeRealtime = useHomeRealtime(user?.id);

  // --- STATE ---
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [resolvingOnboarding, setResolvingOnboarding] = useState(true);
  const [almanackOpen, setAlmanackOpen] = useState(false);
  const [watchlist, setWatchlist] = useState<WatchlistSummary[]>([]);
  const [watchlistLoading, setWatchlistLoading] = useState(false);
  const [manualRefreshing, setManualRefreshing] = useState(false);

  // --- REFS ---
  const homeManualRefreshReadyAtRef = useRef(0);
  const activeHomeUserIdRef = useRef<string | null>(null);

  /**
   * CACHE LOGIC (LocalStorage Replacement)
   */
  const getHomeCacheKey = (userId: string) => `${HOME_CACHE_KEY_PREFIX}:${userId}`;

  const readHomeCache = useCallback((userId: string): HomeCacheEnvelope | null => {
    try {
      const raw = storage.getItem(getHomeCacheKey(userId));
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }, []);

  

  const writeHomeCache = useCallback((userId: string, payload: any) => {
    const envelope: HomeCacheEnvelope = { savedAt: Date.now(), payload };
    storage.setItem(getHomeCacheKey(userId), JSON.stringify(envelope));
  }, []);

  /**
   * INITIAL HYDRATION
   */
  useEffect(() => {
    if (authloading) return;
    if (!user?.id) {
      setLoading(false);
      return;
    }

    activeHomeUserIdRef.current = user.id;
    
    // 1. Load from Cache immediately
    const cached = readHomeCache(user.id);
    if (cached?.payload) {
      setData(cached.payload);
      setLoading(false);
    }

    // 2. Handle Onboarding Check
    // const checkOnboarding = async () => {
    //   const state = await getUserOnboardingState();
    //   const path = getOnboardingRedirectPath(state);
    //   if (path !== "/first-entry") {
    //     router.replace(path);
    //   } else {
    //     setResolvingOnboarding(false);
    //   }
    // };
    // checkOnboarding();
  }, [user?.id, authloading, readHomeCache, router]);

  /**
   * SYNC REALTIME DATA
   */
  useEffect(() => {
    if (homeRealtime.data && user?.id) {
      setData(homeRealtime.data);
      writeHomeCache(user.id, homeRealtime.data);
      setLoading(false);
    }
  }, [homeRealtime.data, user?.id, writeHomeCache]);

  /**
   * MANUAL REFRESH
   */
  const handleManualRefresh = async () => {
    if (manualRefreshing || Date.now() < homeManualRefreshReadyAtRef.current) return;
    
    setManualRefreshing(true);
    try {
      await homeRealtime.refresh();
      // Add watchlist refresh here if needed
    } finally {
      setManualRefreshing(false);
      homeManualRefreshReadyAtRef.current = Date.now() + HOME_MANUAL_REFRESH_COOLDOWN_MS;
    }
  };

  /**
   * DATA PROCESSING
   */
  const holdingSummaries = useMemo(() => {
    const holdings = Array.isArray(data?.holdings) ? data.holdings : [];
    return holdings.map((h: any, i: number) => {
        const symbol = h.symbol || "--";
        const qty = Number(h.quantity) || 0;
        const avg = Number(h.avg_price) || 0;
        const current = Number(h.current_price) || avg;
        return {
            key: `${symbol}-${i}`,
            symbol,
            displaySymbol: getDisplaySymbol(symbol, h.region),
            currentValue: qty * current,
            investedValue: qty * avg,
            totalReturnPct: avg > 0 ? ((current - avg) / avg) * 100 : 0,
            logoUrl: h.logo_url
        } as HoldingSummary;
    });
  }, [data]);

  if (loading || resolvingOnboarding) {
    return (
      <div className="flex h-screen items-center justify-center bg-black text-white">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white pb-20">
      {/* Header Area */}
      <header className="p-6 sticky top-0 bg-neutral-950/80 backdrop-blur-md z-10 flex justify-between items-center">
        <div>
          <p className="text-neutral-400 text-sm font-medium">Total Balance</p>
          <h1 className="text-3xl font-bold tracking-tight">
            {formatPrice(data?.available_balance,"US" || 0)}
          </h1>
        </div>
        <button 
          onClick={handleManualRefresh}
          className="p-2 rounded-full hover:bg-neutral-800 transition-colors"
        >
          <RefreshCw className={`h-5 w-5 ${manualRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </header>

      <main className="px-6 max-w-2xl mx-auto space-y-8">
        {/* Almanack Trigger */}
        <section 
          onClick={() => setAlmanackOpen(true)}
          className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-blue-500/10 border border-emerald-500/20 cursor-pointer hover:border-emerald-500/40 transition-all"
        >
          <h3 className="text-emerald-400 font-semibold mb-1">AI Analysis</h3>
          <p className="text-sm text-neutral-300 line-clamp-2">
            {data?.almanack?.system_analysis || "Analyzing your portfolio strategy..."}
          </p>
        </section>

        {/* Holdings List */}
        <section>
          <h2 className="text-xl font-bold mb-4">Your Holdings</h2>
          <div className="space-y-3">
            {holdingSummaries.map((item:any) => (
              <div 
                key={item.key} 
                className="flex items-center justify-between p-4 bg-neutral-900 rounded-xl border border-neutral-800 hover:border-neutral-700 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-neutral-800 overflow-hidden">
                    {item.logoUrl && <img src={item.logoUrl} alt={item.symbol} className="w-full h-full object-cover" />}
                  </div>
                  <div>
                    <p className="font-bold">{item.displaySymbol}</p>
                    <p className="text-xs text-neutral-500">{item.symbol}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatPrice(item.currentValue,"US")}</p>
                  <p className={`text-xs font-medium ${item.totalReturnPct >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {item.totalReturnPct >= 0 ? '+' : ''}{item.totalReturnPct.toFixed(2)}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Almanack Modal (Replaces Native Reanimated Modal) */}
      <AnimatePresence>
        {almanackOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setAlmanackOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-x-4 top-[15%] bottom-[15%] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-lg bg-neutral-900 border border-neutral-800 rounded-3xl z-50 p-8 overflow-y-auto"
            >
              <h2 className="text-2xl font-bold mb-4 text-emerald-400">Portfolio Almanack</h2>
              <p className="text-neutral-300 whitespace-pre-wrap leading-relaxed">
                {data?.almanack?.system_analysis || "No analysis available."}
              </p>
              <button 
                onClick={() => setAlmanackOpen(false)}
                className="mt-8 w-full py-3 bg-white text-black font-bold rounded-xl"
              >
                Close
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* <FinancialGuideModal 
      visible={guideOpen}
        // Connect your guideOpen state here
        onClose={closeGuide} 
      /> */}
    </div>
  );
}