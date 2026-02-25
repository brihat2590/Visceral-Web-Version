"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS } from "chart.js/auto";
import { motion } from "framer-motion";
import {toast} from "sonner";

import { createClient } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/formatPrice";
import { getDisplaySymbol } from "@/lib/displaySymbol";
import TradeModal from "@/components/Trade/TradeModel";

/* ---------------- CONSTANTS ---------------- */
const supabase=createClient();
const RANGES = [
  { label: "1D", value: "1d" },
  { label: "5D", value: "5d" },
  { label: "1M", value: "1mo" },
  { label: "3M", value: "3mo" },
  { label: "6M", value: "6mo" },
  { label: "1Y", value: "1y" },
];

/* ================= PAGE ================= */

export default function StockDetailsPage() {
  const { symbol } = useParams<{ symbol: string }>();
  const ticker = symbol

  const [userId, setUserId] = useState<string | null>(null);
  const [range, setRange] = useState("1d");
  const [stock, setStock] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [tradeType, setTradeType] = useState<"BUY" | "SELL" | null>(null);
  const [quantity, setQuantity] = useState<number | null>(null);
  const [avgBuy, setAvgBuy] = useState<number | null>(null);

  /* ---------------- AUTH ---------------- */

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null);
    });
  }, []);

  /* ---------------- STOCK DATA ---------------- */

  useEffect(() => {
    let active = true;
    setLoading(true);

    fetch(`/api/stocks?ticker=${ticker}&range=${range}`)
      .then((r) => r.json())
      .then((data) => {
        if (!active) return;
        setStock(data);
      })
      .catch(() => toast.error("Failed to fetch stock"))
      .finally(() => setLoading(false));

    return () => {
      active = false;
    };
  }, [ticker, range]);

  /* ---------------- POSITION SNAPSHOT ---------------- */

  useEffect(() => {
    if (!userId) return;

    supabase
      .from("trades")
      .select("side, quantity, price")
      .eq("user_id", userId)
      .eq("symbol", ticker)
      .order("executed_at", { ascending: true })
      .then(({ data }) => {
        let q = 0;
        let cost = 0;

        data?.forEach((t) => {
          if (t.side === "BUY") {
            q += t.quantity;
            cost += t.quantity * t.price;
          } else if (q > 0) {
            const avg = cost / q;
            const matched = Math.min(q, t.quantity);
            q -= matched;
            cost -= avg * matched;
          }
        });

        setQuantity(q > 0 ? q : null);
        setAvgBuy(q > 0 ? cost / q : null);
      });
  }, [userId, ticker]);

  /* ---------------- CHART DATA (INLINE) ---------------- */

  const prices = useMemo(
    () => stock?.data?.map((d: any) => d.close) ?? [],
    [stock],
  );

  const chartData = useMemo(
    () => ({
      labels: prices.map((_, i) => i),
      datasets: [
        {
          data: prices,
          borderColor:
            prices.at(-1)! >= prices[0] ? "#34D399" : "#FB7185",
          borderWidth: 2,
          pointRadius: 0,
          tension: 0.35,
        },
      ],
    }),
    [prices],
  );

  /* ---------------- STATES ---------------- */

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-black">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
      </div>
    );
  }

  if (!stock || prices.length === 0) return null;

  const latest = prices.at(-1);
  const base = prices[0];
  const change = latest - base;
  const percent = (change / base) * 100;

  const unrealized =
    avgBuy && quantity ? (latest - avgBuy) * quantity : null;

  /* ================= RENDER ================= */

  return (
    <div className="min-h-screen bg-black text-white px-4 py-6 max-w-5xl mx-auto">
      {/* HEADER */}
      <h1 className="text-2xl font-bold">
        {stock.name} ({getDisplaySymbol(ticker)})
      </h1>

      {/* PRICE */}
      <div className="mt-6 flex justify-between">
        <div>
          <div className="text-4xl font-semibold">
            {formatPrice(latest)}
          </div>
          <div
            className={`text-lg ${
              percent >= 0 ? "text-green-400" : "text-red-400"
            }`}
          >
            {percent >= 0 ? "+" : "-"}
            {Math.abs(percent).toFixed(2)}%
          </div>
        </div>

        <div className="text-right">
          <Stat label="Avg Buy" value={avgBuy ? formatPrice(avgBuy) : "--"} />
          <Stat
            label="PnL"
            value={
              unrealized !== null ? formatPrice(unrealized) : "--"
            }
            positive={unrealized !== null && unrealized >= 0}
          />
        </div>
      </div>

      {/* CHART */}
      <motion.div
        className="mt-10 rounded-2xl border border-neutral-800 bg-neutral-900 p-4"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Line data={chartData} />
      </motion.div>

      {/* RANGE SELECTOR */}
      <div className="flex gap-2 mt-6">
        {RANGES.map((r) => (
          <button
            key={r.value}
            onClick={() => setRange(r.value)}
            className={`flex-1 py-2 rounded-lg text-sm ${
              range === r.value
                ? "bg-white text-black"
                : "bg-neutral-800 text-neutral-400"
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* TRADE ACTIONS */}
      <div className="flex gap-4 mt-8">
        <button
          onClick={() => setTradeType("SELL")}
          className="flex-1 py-4 border border-neutral-700 rounded-xl"
        >
          Sell
        </button>
        <button
          onClick={() => setTradeType("BUY")}
          className="flex-1 py-4 bg-white text-black rounded-xl"
        >
          Buy
        </button>
      </div>

      {tradeType && (
        <TradeModal
          symbol={ticker}
          price={latest}
          type={tradeType}
          onClose={() => setTradeType(null)}
        />
      )}
    </div>
  );
}

/* ================= INLINE STAT COMPONENT ================= */

function Stat({
  label,
  value,
  positive,
}: {
  label: string;
  value: string;
  positive?: boolean;
}) {
  return (
    <div className="mt-2">
      <div className="text-xs text-neutral-500">{label}</div>
      <div
        className={`text-sm font-semibold ${
          positive === undefined
            ? "text-white"
            : positive
            ? "text-green-400"
            : "text-red-400"
        }`}
      >
        {value}
      </div>
    </div>
  );
}