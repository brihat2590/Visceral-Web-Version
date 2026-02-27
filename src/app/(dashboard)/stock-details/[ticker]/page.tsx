"use client";

import { fetchStockDetails } from "@/api/stock";
import {
  addToWatchlist,
  getWatchList,
  removeFromWatchlist,
} from "@/api/watchlist";
import TradeModal from "@/components/Trade/TradeModel";
import TutorialHighlightTarget from "@/components/tutorial-highlight-target";
import EmptyState from "@/components/state/EmptyState";
import { getDisplaySymbol } from "@/lib/displaySymbol";
import { formatPrice } from "@/lib/formatPrice";
import { resolveMarketRegion } from "@/lib/market-region";
import {
  cacheSecurityLogo,
  getOrFetchSecurityLogo,
  markSecurityLogoUrlBroken,
} from "@/lib/security-logo-cache";
import { createClient } from "@/lib/supabase/client";
import { Bookmark, BookmarkCheck, Loader2 } from "lucide-react";
import Image from "next/image";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  LineChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  ReferenceLine,
} from "recharts";

// ── Constants ──────────────────────────────────────────────
const ONE_DAY_RANGE = "1d";
const CHART_HEIGHT = 250;

const ranges = [
  { label: "1D", value: ONE_DAY_RANGE },
  { label: "5D", value: "5d" },
  { label: "1M", value: "1mo" },
  { label: "3M", value: "3mo" },
  { label: "6M", value: "6mo" },
  { label: "1Y", value: "1y" },
];

const CHART_MIN_RENDER_POINTS = 56;
const CHART_MAX_RENDER_POINTS = 180;

// ── Types ──────────────────────────────────────────────────
type ChartPoint = {
  timestamp: string;
  close: number;
};

type UserStockTradeSnapshot = {
  side: "BUY" | "SELL";
  quantity: number;
  price: number;
};

// ── Pure helpers (identical logic to RN) ──────────────────
function getRangeOrderIndex(value: string) {
  const index = ranges.findIndex((item) => item.value === value);
  return index === -1 ? 0 : index;
}

function getChartMaxRenderPoints(viewportWidth: number) {
  const estimated = Math.round(viewportWidth * 0.52);
  return Math.min(
    CHART_MAX_RENDER_POINTS,
    Math.max(CHART_MIN_RENDER_POINTS, estimated)
  );
}

function downsampleChartPoints(
  points: ChartPoint[],
  maxPoints: number
): ChartPoint[] {
  if (points.length <= maxPoints) return points;
  const sampled: ChartPoint[] = [];
  const lastIndex = points.length - 1;
  const step = lastIndex / Math.max(1, maxPoints - 1);
  let previousIndex = -1;
  for (let i = 0; i < maxPoints; i++) {
    const nextIndex = Math.round(i * step);
    if (nextIndex === previousIndex) continue;
    sampled.push(points[nextIndex]);
    previousIndex = nextIndex;
  }
  if (sampled.length === 0)
    return [points[0], points[lastIndex]].filter(Boolean);
  if (sampled[sampled.length - 1] !== points[lastIndex])
    sampled.push(points[lastIndex]);
  return sampled;
}

function formatChartTimestamp(timestamp: string, selectedRange: string) {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "";
  if (selectedRange === "1d")
    return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  if (selectedRange === "5d" || selectedRange === "1mo")
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  return date.toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "2-digit",
  });
}

function compactNumber(value: number) {
  if (!Number.isFinite(value)) return "N/A";
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(value);
}

function hasRenderableSeries(payload: any) {
  return (
    Array.isArray(payload?.data) &&
    payload.data.some((point: any) => Number.isFinite(Number(point?.close)))
  );
}

function normalizeLogoUrl(value: unknown) {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function formatSignedPrice(value: number, market: string) {
  const sign = value >= 0 ? "+" : "-";
  return `${sign}${formatPrice(Math.abs(value), market)}`;
}

function toFiniteNumber(value: unknown) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object") return null;
  return value as Record<string, unknown>;
}

function pickFiniteNumber(...values: unknown[]): number | null {
  for (const value of values) {
    const parsed = toFiniteNumber(value);
    if (parsed !== null) return parsed;
  }
  return null;
}

function pickText(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value !== "string") continue;
    const trimmed = value.trim();
    if (trimmed) return trimmed;
  }
  return null;
}

function formatPercentRatio(value: number | null) {
  if (value === null) return "--";
  return `${value.toFixed(2)}%`;
}

function formatNumber(value: number | null, decimals = 2) {
  if (value === null) return "--";
  return value.toFixed(decimals);
}

function formatCompactMetric(value: number | null) {
  if (value === null) return "--";
  return compactNumber(value);
}

function formatPriceMetric(value: number | null, market: string) {
  if (value === null) return "--";
  return formatPrice(value, market);
}

function formatCashMetric(value: number | null, market: string) {
  if (value === null) return "--";
  if (Math.abs(value) >= 1000) return compactNumber(value);
  return formatPrice(value, market);
}

function formatDebtMetric(value: number | null) {
  if (value === null) return "--";
  if (Math.abs(value) >= 1000) return compactNumber(value);
  return formatNumber(value, 2);
}

function formatTextMetric(value: string | null) {
  if (value === null) return "--";
  return value;
}

// ── Custom Recharts Tooltip ────────────────────────────────
function ChartTooltip({
  active,
  payload,
  selectedRange,
}: {
  active?: boolean;
  payload?: any[];
  selectedRange: string;
}) {
  if (!active || !payload?.length) return null;
  const point: ChartPoint = payload[0].payload;
  return (
    <div className="bg-[#111827] border border-[#374151] rounded-lg px-3 py-1.5 text-xs font-semibold text-[#E5E7EB]">
      {formatChartTimestamp(point.timestamp, selectedRange)}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────
export default function StockDetailsPage() {
  // Next.js uses useParams + useSearchParams instead of useLocalSearchParams
  const params = useParams();
  const supabase=createClient();
  const searchParams = useSearchParams();

  const ticker =
    typeof params.ticker === "string" ? params.ticker : "";
  const market = searchParams.get("market") ?? "";

  const symbol = ticker;
  const marketParams = resolveMarketRegion(market, symbol);
  const displaySymbol = getDisplaySymbol(symbol, marketParams);

  const [userId, setUserId] = useState("");
  const [inWatchlist, setInWatchlist] = useState(false);
  const [watchlistLoading, setWatchlistLoading] = useState(false);
  const [stock, setStock] = useState<any>(null);
  const [range, setRange] = useState(ONE_DAY_RANGE);
  const [loading, setLoading] = useState(true);
  const [activePointIndex, setActivePointIndex] = useState<number | null>(null);
  const [tradeType, setTradeType] = useState<"BUY" | "SELL" | null>(null);
  const [positionQuantity, setPositionQuantity] = useState<number | null>(null);
  const [averageBuyPrice, setAverageBuyPrice] = useState<number | null>(null);
  const [positionLoading, setPositionLoading] = useState(false);
  const [fundamentalsModalOpen, setFundamentalsModalOpen] = useState(false);
  const [showNerdFundamentals, setShowNerdFundamentals] = useState(false);

  // Refs that replace RNAnimated (no animations on web — just state)
  const previousRangeRef = useRef(ONE_DAY_RANGE);
  const stockRef = useRef<any>(null);
  const requestIdRef = useRef(0);

  // ── Auth ────────────────────────────────────────────────
  useEffect(() => {
    const fetchUserId = async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user?.id) setUserId(data.user.id);
    };
    fetchUserId();
  }, []);

  // ── Watchlist sync ──────────────────────────────────────
  useEffect(() => {
    if (!userId || !symbol) return;
    const syncWatchlistState = async () => {
      try {
        const res = await getWatchList(userId);
        const watchlist = Array.isArray(res?.watchlist) ? res.watchlist : [];
        const normalizedSymbol = symbol.toUpperCase();
        const exists = watchlist.some(
          (entry: any) =>
            typeof entry?.symbol === "string" &&
            entry.symbol.toUpperCase() === normalizedSymbol
        );
        setInWatchlist(exists);
      } catch (e) {
        console.error("Failed to sync watchlist state", e);
      }
    };
    syncWatchlistState();
  }, [userId, symbol]);

  // ── Position snapshot ───────────────────────────────────
  useEffect(() => {
    if (!userId || !symbol) {
      setPositionQuantity(null);
      setAverageBuyPrice(null);
      setPositionLoading(false);
      return;
    }
    let active = true;
    const safeSymbol = symbol.trim().toUpperCase();

    const loadPositionSnapshot = async () => {
      try {
        setPositionLoading(true);
        const { data, error } = await supabase
          .from("trades")
          .select("side,quantity,price,executed_at")
          .eq("user_id", userId)
          .eq("symbol", safeSymbol)
          .order("executed_at", { ascending: true });

        if (error) throw new Error(error.message);

        const tradeRows = ((data ?? []) as any[])
          .map((row) => ({
            side: row?.side === "SELL" ? "SELL" : "BUY",
            quantity: Number(row?.quantity),
            price: Number(row?.price),
          }))
          .filter(
            (row): row is UserStockTradeSnapshot =>
              Number.isFinite(row.quantity) &&
              row.quantity > 0 &&
              Number.isFinite(row.price) &&
              row.price >= 0
          );

        let openQuantity = 0;
        let openCost = 0;
        for (const trade of tradeRows) {
          if (trade.side === "BUY") {
            openQuantity += trade.quantity;
            openCost += trade.quantity * trade.price;
            continue;
          }
          if (openQuantity <= 0) continue;
          const matchedQuantity = Math.min(openQuantity, trade.quantity);
          const currentAverage = openCost / openQuantity;
          openQuantity -= matchedQuantity;
          openCost = Math.max(0, openCost - currentAverage * matchedQuantity);
        }

        if (!active) return;
        if (openQuantity > 0 && openCost > 0) {
          setPositionQuantity(openQuantity);
          setAverageBuyPrice(openCost / openQuantity);
        } else {
          setPositionQuantity(null);
          setAverageBuyPrice(null);
        }
      } catch (error) {
        if (!active) return;
        console.error("Failed to load stock position snapshot", error);
        setPositionQuantity(null);
        setAverageBuyPrice(null);
      } finally {
        if (active) setPositionLoading(false);
      }
    };

    void loadPositionSnapshot();
    return () => { active = false; };
  }, [symbol, userId]);

  // ── Stock data fetch ────────────────────────────────────
  useEffect(() => {
    if (!ticker) return;

    const currentTicker =
      typeof ticker === "string" ? ticker.toUpperCase() : "";
    const previousRange = previousRangeRef.current;
    const nextRange = typeof range === "string" ? range : ONE_DAY_RANGE;
    const isRangeUpdate =
      !!stockRef.current &&
      typeof stockRef.current.ticker === "string" &&
      stockRef.current.ticker.toUpperCase() === currentTicker &&
      Array.isArray(stockRef.current.data) &&
      stockRef.current.data.length > 0;

    const requestId = ++requestIdRef.current;

    if (!isRangeUpdate) setLoading(true);

    const loadStock = async () => {
      try {
        const data = await fetchStockDetails(ticker, range, {
          region: marketParams,
          preferCache: false,
        });
        if (requestIdRef.current !== requestId) return;

        if (
          !hasRenderableSeries(data) &&
          hasRenderableSeries(stockRef.current)
        ) {
          setStock(stockRef.current);
        } else {
          setStock(data);
          stockRef.current = data;
        }
      } catch {
        if (requestIdRef.current !== requestId) return;
        toast.error("Unable to fetch stock data");
      } finally {
        if (requestIdRef.current !== requestId) return;
        setLoading(false);
      }
    };

    previousRangeRef.current = nextRange;
    void loadStock();
  }, [marketParams, range, ticker]);

  // Reset active point on ticker/range change
  useEffect(() => {
    setActivePointIndex(null);
  }, [ticker, range]);

  // ── Watchlist toggle ────────────────────────────────────
  async function toggleWatchlist() {
    if (!userId) {
      toast.error("Please login to use the watchlist.");
      return;
    }
    try {
      setWatchlistLoading(true);
      if (inWatchlist) {
        await removeFromWatchlist(userId, symbol, marketParams);
        setInWatchlist(false);
        toast.success(`${displaySymbol} removed from watchlist`);
      } else {
        const res = await addToWatchlist(userId, symbol, marketParams);
        if (res.status === "ADDED" || res.status === "ALREADY_EXISTS") {
          setInWatchlist(true);
          toast.success(`${displaySymbol} added to watchlist`);
        }
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setWatchlistLoading(false);
    }
  }

  // ── Loading / empty states ──────────────────────────────
  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-black">
        <Loader2 className="animate-spin text-white" size={32} />
      </div>
    );
  }

  if (!stock || !Array.isArray(stock.data) || stock.data.length === 0) {
    return <EmptyState />;
  }

  // ── Chart data preparation (identical logic to RN) ──────
  const stockSeries = Array.isArray(stock?.data) ? stock.data : [];
  const chartViewportWidth =
    typeof window !== "undefined" ? window.innerWidth - 64 : 800;
  const maxRenderPoints = getChartMaxRenderPoints(chartViewportWidth);

  const chartPoints: ChartPoint[] = stockSeries
    .map((d: any) => ({
      close: Number(d?.close),
      timestamp: typeof d?.timestamp === "string" ? d.timestamp : "",
    }))
    .filter((point: ChartPoint) => Number.isFinite(point.close))
    .sort((a: ChartPoint, b: ChartPoint) => {
      const aTs = Date.parse(a.timestamp);
      const bTs = Date.parse(b.timestamp);
      if (Number.isNaN(aTs) || Number.isNaN(bTs)) return 0;
      return aTs - bTs;
    });

  const sampledChartPoints = downsampleChartPoints(
    chartPoints,
    maxRenderPoints
  );
  const renderChartPoints: ChartPoint[] =
    sampledChartPoints.length === 1
      ? [sampledChartPoints[0], { ...sampledChartPoints[0] }]
      : sampledChartPoints;

  const fullPrices = chartPoints.map((p: ChartPoint) => p.close);
  const renderPrices = renderChartPoints.map((p: ChartPoint) => p.close);

  if (fullPrices.length === 0 || renderPrices.length === 0)
    return <EmptyState />;

  // ── Price calculations (identical logic to RN) ──────────
  const quoteSnapshot =
    stock?.quote_snapshot && typeof stock.quote_snapshot === "object"
      ? (stock.quote_snapshot as Record<string, unknown>)
      : null;
  const snapshotLast =
    toFiniteNumber(quoteSnapshot?.last) ??
    toFiniteNumber(quoteSnapshot?.currentPrice);
  const snapshotPrev =
    toFiniteNumber(quoteSnapshot?.prev) ??
    toFiniteNumber(stock.previousClose);
  const dayOpen = toFiniteNumber(stock.dayOpen);
  const latestClose = fullPrices.at(-1) ?? 0;
  const isOneDayRange = range === ONE_DAY_RANGE;
  const latest =
    snapshotLast ??
    (typeof stock.currentPrice === "number" &&
    Number.isFinite(stock.currentPrice)
      ? stock.currentPrice
      : latestClose);
  const oneDayBasePrice =
    (dayOpen !== null && dayOpen !== 0
      ? dayOpen
      : snapshotPrev !== null && snapshotPrev !== 0
      ? snapshotPrev
      : fullPrices[0]) ?? 0;
  const rangeBasePrice = fullPrices[0] ?? 0;
  const activeChangeBasePrice = isOneDayRange
    ? oneDayBasePrice
    : rangeBasePrice;
  const oneDayFallbackPercent =
    oneDayBasePrice !== 0
      ? ((latest - oneDayBasePrice) / oneDayBasePrice) * 100
      : 0;
  const rangeFallbackPercent =
    rangeBasePrice !== 0
      ? ((latest - rangeBasePrice) / rangeBasePrice) * 100
      : oneDayFallbackPercent;
  const oneDayChangeAmount =
    typeof stock.single_day_change === "number" &&
    Number.isFinite(stock.single_day_change)
      ? stock.single_day_change
      : oneDayBasePrice !== 0
      ? latest - oneDayBasePrice
      : 0;
  const oneDayChangePercent =
    typeof stock.single_day_change_pct === "number" &&
    Number.isFinite(stock.single_day_change_pct)
      ? stock.single_day_change_pct
      : rangeFallbackPercent;
  const rangeChangePercent =
    typeof stock.percentage_change === "number" &&
    Number.isFinite(stock.percentage_change)
      ? stock.percentage_change
      : oneDayChangePercent;
  const changePercent = isOneDayRange
    ? oneDayChangePercent
    : rangeChangePercent;
  const rangeChangeAmount =
    rangeBasePrice !== 0 ? latest - rangeBasePrice : oneDayChangeAmount;
  const changeAmount = isOneDayRange ? oneDayChangeAmount : rangeChangeAmount;

  const activePrice =
    activePointIndex !== null &&
    activePointIndex >= 0 &&
    activePointIndex < renderPrices.length
      ? renderPrices[activePointIndex]
      : null;
  const visiblePrice = activePrice ?? latest;
  const visibleChangePercent =
    activePrice !== null && activeChangeBasePrice !== 0
      ? ((activePrice - activeChangeBasePrice) / activeChangeBasePrice) * 100
      : changePercent;
  const visibleChangeAmount =
    activePrice !== null && activeChangeBasePrice !== 0
      ? activePrice - activeChangeBasePrice
      : changeAmount;
  const isVisiblePositive = visibleChangePercent >= 0;
  const unrealizedPnl =
    averageBuyPrice !== null && positionQuantity !== null
      ? (visiblePrice - averageBuyPrice) * positionQuantity
      : null;
  const unrealizedPnlPercent =
    averageBuyPrice !== null &&
    positionQuantity !== null &&
    Number.isFinite(averageBuyPrice * positionQuantity) &&
    averageBuyPrice * positionQuantity > 0 &&
    unrealizedPnl !== null
      ? (unrealizedPnl / (averageBuyPrice * positionQuantity)) * 100
      : null;
  const pnlPositive = (unrealizedPnl ?? 0) >= 0;

  const activeDateLabel =
    activePointIndex !== null &&
    activePointIndex >= 0 &&
    activePointIndex < renderChartPoints.length &&
    renderChartPoints[activePointIndex].timestamp
      ? formatChartTimestamp(
          renderChartPoints[activePointIndex].timestamp,
          range
        )
      : "";

  // ── Fundamentals ────────────────────────────────────────
  const fundamentals = asRecord(stock?.fundamentals);
  const rootGrowthMetrics = asRecord(stock?.growthMetrics);
  const fundamentalsGrowthMetrics = asRecord(fundamentals?.growthMetrics);

  const dayVolume = pickFiniteNumber(stock.dayVolume, fundamentals?.dayVolume);
  const marketCap = pickFiniteNumber(stock.marketCap, fundamentals?.marketCap);
  const peRatio = pickFiniteNumber(stock.peRatio, fundamentals?.peRatio);
  const revenue = pickFiniteNumber(stock.revenue, fundamentals?.revenue, fundamentals?.revenuePerShareTTM);
  const eps = pickFiniteNumber(stock.eps, fundamentals?.eps);
  const profitMargins = pickFiniteNumber(stock.profitMargins, fundamentals?.profitMargins);
  const dividendYield = pickFiniteNumber(stock.dividendYield, fundamentals?.dividendYield);
  const fiftyTwoWeekHigh = pickFiniteNumber(stock.fiftyTwoWeekHigh, fundamentals?.fiftyTwoWeekHigh);
  const fiftyTwoWeekLow = pickFiniteNumber(stock.fiftyTwoWeekLow, fundamentals?.fiftyTwoWeekLow);
  const beta = pickFiniteNumber(stock.beta, fundamentals?.beta);
  const bookValue = pickFiniteNumber(stock.bookValue, fundamentals?.bookValue);
  const cash = pickFiniteNumber(stock.cash, stock.totalCash, fundamentals?.cash, fundamentals?.totalCash, fundamentals?.cashAndShortTermInvestments, fundamentals?.cashPerShareAnnual);
  const debt = pickFiniteNumber(stock.debt, stock.totalDebt, fundamentals?.debt, fundamentals?.totalDebt, fundamentals?.totalDebtQuarterly, fundamentals?.debtToEquityAnnual);
  const revenueGrowth = pickFiniteNumber(rootGrowthMetrics?.revenueGrowth, fundamentalsGrowthMetrics?.revenueGrowth);
  const earningsGrowth = pickFiniteNumber(rootGrowthMetrics?.earningsGrowth, fundamentalsGrowthMetrics?.earningsGrowth);
  const earningsQuarterlyGrowth = pickFiniteNumber(rootGrowthMetrics?.earningsQuarterlyGrowth, fundamentalsGrowthMetrics?.earningsQuarterlyGrowth);
  const revenuePerShareTTM = pickFiniteNumber(fundamentals?.revenuePerShareTTM);
  const cashPerShareAnnual = pickFiniteNumber(fundamentals?.cashPerShareAnnual);
  const debtToEquityAnnual = pickFiniteNumber(fundamentals?.debtToEquityAnnual);
  const fundamentalsSource = pickText(fundamentals?.source);
  const fundamentalsMetricType = pickText(fundamentals?.metricType);
  const fundamentalsSymbol = pickText(fundamentals?.symbol);

  const stockDisplayName =
    typeof stock.name === "string" && stock.name.trim()
      ? stock.name
      : typeof stock.ticker === "string"
      ? getDisplaySymbol(stock.ticker, marketParams)
      : displaySymbol;
  const stockTickerRaw =
    typeof stock.ticker === "string" && stock.ticker.trim()
      ? stock.ticker.trim().toUpperCase()
      : symbol.trim().toUpperCase();
  const stockTicker = getDisplaySymbol(stockTickerRaw, marketParams);
  const stockLogoUrl = normalizeLogoUrl(stock.logo_url);
  const chartLineColor = changePercent >= 0 ? "#34D399" : "#FB7185";

  const primaryFundamentalsStats: { label: string; value: string }[] = [
    { label: "P/E Ratio", value: formatNumber(peRatio) },
    { label: "Day Volume", value: formatCompactMetric(dayVolume) },
    { label: "Market Cap", value: formatCompactMetric(marketCap) },
    { label: "Revenue", value: formatPriceMetric(revenue, marketParams) },
    { label: "EPS", value: formatPriceMetric(eps, marketParams) },
    { label: "Profit Margin", value: formatPercentRatio(profitMargins) },
    { label: "Dividend Yield", value: formatPercentRatio(dividendYield) },
    { label: "52W High", value: formatPriceMetric(fiftyTwoWeekHigh, marketParams) },
    { label: "52W Low", value: formatPriceMetric(fiftyTwoWeekLow, marketParams) },
    { label: "Beta", value: formatNumber(beta) },
    { label: "Book Value", value: formatPriceMetric(bookValue, marketParams) },
    { label: "Cash", value: formatCashMetric(cash, marketParams) },
    { label: "Debt", value: formatDebtMetric(debt) },
    { label: "Rev Growth", value: formatPercentRatio(revenueGrowth) },
    { label: "Earnings Growth", value: formatPercentRatio(earningsGrowth) },
    { label: "Quarterly Growth", value: formatPercentRatio(earningsQuarterlyGrowth) },
  ];

  const primaryFundamentalsPreviewStats = [
    { label: "Market Cap", value: formatCompactMetric(marketCap) },
    { label: "P/E Ratio", value: formatNumber(peRatio) },
    { label: "Revenue", value: formatCompactMetric(revenue) },
    { label: "EPS", value: formatPriceMetric(eps, marketParams) },
  ];

  const nerdFundamentalsStats: { label: string; value: string }[] = [
    { label: "Revenue / Share (TTM)", value: formatPriceMetric(revenuePerShareTTM, marketParams) },
    { label: "Cash / Share (Annual)", value: formatPriceMetric(cashPerShareAnnual, marketParams) },
    { label: "Debt / Equity (Annual)", value: formatNumber(debtToEquityAnnual, 4) },
    { label: "Source", value: formatTextMetric(fundamentalsSource) },
    { label: "Metric Type", value: formatTextMetric(fundamentalsMetricType) },
    { label: "Symbol", value: formatTextMetric(fundamentalsSymbol) },
  ];

  const fundamentalsStats = showNerdFundamentals
    ? nerdFundamentalsStats
    : primaryFundamentalsStats;

  const closeFundamentalsModal = () => {
    setShowNerdFundamentals(false);
    setFundamentalsModalOpen(false);
  };

  // ── Chart mouse interaction ─────────────────────────────
  const handleChartMouseMove = (e: any) => {
    if (!e?.activeTooltipIndex == null) return;
    if (typeof e.activeTooltipIndex === "number") {
      setActivePointIndex(e.activeTooltipIndex);
    }
  };

  const handleChartMouseLeave = () => {
    setActivePointIndex(null);
  };

  // ── Render ──────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">

        {/* ── Header: Logo + Name + Watchlist ── */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 flex-1 pr-3">
            <StockLogo
              logoUrl={stockLogoUrl}
              label={stockDisplayName}
              symbol={stockTickerRaw}
              market={marketParams}
            />
            <h1 className="text-white text-2xl font-bold leading-tight">
              {stockDisplayName}
            </h1>
          </div>

          <TutorialHighlightTarget targetId="stock.watchlist_button">
            <button
              onClick={toggleWatchlist}
              disabled={watchlistLoading}
              className="h-10 w-10 rounded-full border border-neutral-700 flex items-center justify-center transition-all hover:bg-neutral-900 disabled:opacity-50"
            >
              {watchlistLoading ? (
                <Loader2 size={18} className="animate-spin text-white" />
              ) : inWatchlist ? (
                <BookmarkCheck size={18} className="text-white" />
              ) : (
                <Bookmark size={18} className="text-white" />
              )}
            </button>
          </TutorialHighlightTarget>
        </div>

        {/* ── Price + PnL ── */}
        <div className="flex items-start justify-between">
          <div className="flex-1 pr-3">
            <p className="text-white text-4xl font-semibold">
              {formatPrice(visiblePrice, marketParams)}
            </p>
            <p
              className={`mt-1 text-lg ${
                isVisiblePositive ? "text-green-400" : "text-red-400"
              }`}
            >
              {isVisiblePositive ? "↑" : "↓"}{" "}
              {formatSignedPrice(visibleChangeAmount, marketParams)} (
              {isVisiblePositive ? "+" : "-"}
              {Math.abs(visibleChangePercent).toFixed(2)}%)
            </p>
          </div>

          <div className="text-right">
            <p className="text-neutral-500 text-[10px] uppercase tracking-widest">
              Avg Buy
            </p>
            <p className="text-white text-[15px] font-semibold mt-1">
              {averageBuyPrice !== null
                ? formatPrice(averageBuyPrice, marketParams)
                : positionLoading
                ? "..."
                : "--"}
            </p>
            <p className="text-neutral-500 text-[10px] uppercase tracking-widest mt-3">
              PnL
            </p>
            <p
              className={`text-[15px] font-semibold mt-1 ${
                unrealizedPnl === null
                  ? "text-neutral-300"
                  : pnlPositive
                  ? "text-green-400"
                  : "text-red-400"
              }`}
            >
              {unrealizedPnl !== null
                ? `${formatSignedPrice(unrealizedPnl, marketParams)}${
                    unrealizedPnlPercent !== null
                      ? ` (${pnlPositive ? "+" : ""}${Math.abs(
                          unrealizedPnlPercent
                        ).toFixed(2)}%)`
                      : ""
                  }`
                : positionLoading
                ? "..."
                : "--"}
            </p>
          </div>
        </div>

        {/* ── Chart ── */}
        <div
          className="rounded-2xl border border-neutral-800 bg-neutral-950/60 overflow-hidden cursor-crosshair"
          style={{ height: CHART_HEIGHT }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={renderChartPoints}
              onMouseMove={handleChartMouseMove}
              onMouseLeave={handleChartMouseLeave}
              margin={{ top: 8, right: 0, left: 0, bottom: 0 }}
            >
              <Tooltip
                content={
                  <ChartTooltip selectedRange={range} />
                }
                cursor={{
                  stroke: "#9CA3AF",
                  strokeWidth: 1,
                  strokeDasharray: "4 4",
                }}
              />
              <Line
                type="monotone"
                dataKey="close"
                stroke={chartLineColor}
                strokeWidth={2.35}
                dot={false}
                activeDot={{ r: 4, fill: "#FFFFFF", strokeWidth: 0 }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* ── Range Selector ── */}
        <TutorialHighlightTarget targetId="stock.trade_controls">
          <div className="space-y-6">
            <div className="flex justify-between rounded-2xl border border-neutral-800 bg-neutral-950/80 p-1 gap-1">
              {ranges.map((r) => {
                const isActive = range === r.value;
                return (
                  <button
                    key={r.value}
                    onClick={() => {
                      if (!isActive) setRange(r.value);
                    }}
                    className={`flex-1 py-2 rounded-xl text-xs tracking-widest transition-all ${
                      isActive
                        ? "bg-white text-black font-semibold"
                        : "text-neutral-400 hover:text-neutral-200"
                    }`}
                  >
                    {r.label}
                  </button>
                );
              })}
            </div>

            {/* ── Buy / Sell Buttons ── */}
            <div className="flex gap-6">
              <button
                onClick={() => setTradeType("SELL")}
                className="flex-1 py-4 border border-neutral-700 rounded-xl text-white font-semibold hover:bg-neutral-900 transition-all"
              >
                Sell
              </button>
              <button
                onClick={() => setTradeType("BUY")}
                className="flex-1 py-4 bg-white rounded-xl text-black font-semibold hover:bg-white/90 transition-all"
              >
                Buy
              </button>
            </div>

            <p className="text-neutral-500 text-center text-xs italic">
              "Before you trade, note your reasoning."
            </p>

            {/* ── Fundamentals Preview Card ── */}
            <div className="rounded-2xl border border-neutral-700 bg-neutral-950 overflow-hidden">
              <button
                onClick={() => {
                  setShowNerdFundamentals(false);
                  setFundamentalsModalOpen(true);
                }}
                className="w-full border-b border-neutral-800 py-3.5 text-white font-semibold hover:bg-neutral-900 transition-all"
              >
                Fundamentals
              </button>

              <button
                onClick={() => {
                  setShowNerdFundamentals(false);
                  setFundamentalsModalOpen(true);
                }}
                className="w-full px-2 py-4 hover:bg-neutral-900/50 transition-all"
              >
                <div className="flex justify-center gap-4 mb-3">
                  <Stat
                    label={primaryFundamentalsPreviewStats[0].label}
                    value={primaryFundamentalsPreviewStats[0].value}
                  />
                  <Stat
                    label={primaryFundamentalsPreviewStats[1].label}
                    value={primaryFundamentalsPreviewStats[1].value}
                  />
                </div>
                <div className="flex justify-center gap-4">
                  <Stat
                    label={primaryFundamentalsPreviewStats[2].label}
                    value={primaryFundamentalsPreviewStats[2].value}
                  />
                  <Stat
                    label={primaryFundamentalsPreviewStats[3].label}
                    value={primaryFundamentalsPreviewStats[3].value}
                  />
                </div>
                <p className="text-neutral-500 text-xs text-center mt-3">
                  Click to expand
                </p>
              </button>
            </div>
          </div>
        </TutorialHighlightTarget>
      </div>

      {/* ── Fundamentals Modal ── */}
      {fundamentalsModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8"
          role="dialog"
          aria-modal="true"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/75"
            onClick={closeFundamentalsModal}
          />

          <div className="relative z-10 w-full max-w-lg rounded-3xl border border-neutral-700 bg-[#0A0A0A] overflow-hidden max-h-[84vh] flex flex-col">
            {/* Modal Header */}
            <div className="px-5 pt-5 pb-4 border-b border-neutral-800 bg-[#0D0D0D] flex items-start justify-between">
              <div className="flex-1 pr-4">
                <p className="text-neutral-500 text-[10px] font-bold tracking-[2px] uppercase">
                  {showNerdFundamentals
                    ? "More Fundamentals for nerds"
                    : "Fundamentals"}
                </p>
                <p className="text-white text-lg font-semibold mt-2">
                  {stockTicker || stockTickerRaw}
                </p>
              </div>
              <button
                onClick={closeFundamentalsModal}
                className="h-9 w-9 rounded-full border border-neutral-700 bg-neutral-900 flex items-center justify-center hover:bg-neutral-800 transition-all text-neutral-100"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto px-4 pt-5 pb-4 flex-1">
              {Array.from({
                length: Math.ceil(fundamentalsStats.length / 2),
              }).map((_, index) => {
                const left = fundamentalsStats[index * 2];
                const right = fundamentalsStats[index * 2 + 1];
                return (
                  <div
                    key={left.label}
                    className="flex justify-center mb-4"
                  >
                    <Stat label={left.label} value={left.value} />
                    {right ? (
                      <Stat label={right.label} value={right.value} />
                    ) : (
                      <div className="w-[46%] px-2" />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="px-4 py-4 border-t border-neutral-800 bg-[#0D0D0D]">
              <button
                onClick={() =>
                  setShowNerdFundamentals((current) => !current)
                }
                className="w-full py-3 rounded-xl border border-neutral-600 bg-neutral-900 text-neutral-100 font-semibold hover:bg-neutral-800 transition-all"
              >
                {showNerdFundamentals
                  ? "Back to Fundamentals"
                  : "More Fundamentals for nerds"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Trade Modal ── */}
      {tradeType && (
        <TradeModal
          open={true}
          name={stock.name}
          type={tradeType}
          price={latest}
          symbol={stock.ticker}
          region={marketParams}
          userId={userId}
          onClose={() => setTradeType(null)}
        />
      )}
    </div>
  );
}

// ── Stat chip ─────────────────────────────────────────────
function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="w-[46%] flex flex-col items-center px-2">
      <span className="text-neutral-500 text-xs text-center">{label}</span>
      <span className="text-white mt-1 font-medium text-center text-sm truncate w-full text-center">
        {value}
      </span>
    </div>
  );
}

// ── Stock Logo ────────────────────────────────────────────
function StockLogo({
  logoUrl,
  label,
  symbol,
  market,
}: {
  logoUrl?: string;
  label: string;
  symbol: string;
  market: string;
}) {
  const [failed, setFailed] = useState(false);
  const [resolvedLogoUrl, setResolvedLogoUrl] = useState(logoUrl);
  const fallbackRequestedRef = useRef(false);

  useEffect(() => {
    setFailed(false);
    setResolvedLogoUrl(logoUrl);
    fallbackRequestedRef.current = false;
  }, [logoUrl, market, symbol]);

  useEffect(() => {
    if (!logoUrl) return;
    void cacheSecurityLogo(symbol, market, logoUrl);
  }, [logoUrl, market, symbol]);

  useEffect(() => {
    if (resolvedLogoUrl || fallbackRequestedRef.current) return;
    const safeSymbol = symbol.trim().toUpperCase();
    if (!safeSymbol) return;
    fallbackRequestedRef.current = true;
    let active = true;
    const hydrateLogo = async () => {
      const fetched = await getOrFetchSecurityLogo(safeSymbol, market);
      if (!active || !fetched) return;
      setResolvedLogoUrl(fetched);
      setFailed(false);
    };
    void hydrateLogo();
    return () => { active = false; };
  }, [market, resolvedLogoUrl, symbol]);

  const initial = label.trim().charAt(0).toUpperCase() || "?";
  const hasVisibleLogo = !!resolvedLogoUrl && !failed;

  return (
    <div
      className={`h-11 w-11 flex items-center justify-center overflow-hidden rounded-full border border-neutral-700 ${
        hasVisibleLogo ? "bg-white" : "bg-neutral-900"
      }`}
    >
      {hasVisibleLogo ? (
        <Image
          src={resolvedLogoUrl!}
          alt={label}
          width={44}
          height={44}
          className="object-cover w-full h-full"
          onError={() => {
            setFailed(true);
            if (resolvedLogoUrl) {
              fallbackRequestedRef.current = false;
              void markSecurityLogoUrlBroken(symbol, market, resolvedLogoUrl);
              setResolvedLogoUrl(undefined);
            }
          }}
        />
      ) : (
        <span className="text-neutral-300 text-sm font-semibold">
          {initial}
        </span>
      )}
    </div>
  );
}