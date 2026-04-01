"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { addToAlmanack } from "@/api/almanack";
import { buyStock, sellStock } from "@/api/trade";
import { getDisplaySymbol } from "@/lib/displaySymbol";
import { resolveMarketRegion } from "@/lib/market-region";
import { maybeSendTradeConfirmationNotification } from "@/lib/notifications";
import { syncTraderDaysFromTrades } from "@/lib/user-metrics";
import { toast } from "sonner";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL?.trim() || "http://127.0.0.1:8000";

type Props = {
  open: boolean;
  type: "BUY" | "SELL";
  symbol: string;
  name?: string;
  region: string;
  price: number;
  userId: string;
  onClose: () => void;
};

function getFriendlyTradeErrorMessage(rawError: unknown) {
  const rawMessage =
    rawError instanceof Error ? rawError.message : String(rawError ?? "");
  const normalized = rawMessage.toLowerCase();

  const priceConstraintTriggered =
    normalized.includes("trades_price_check") ||
    normalized.includes("price >= 0") ||
    (normalized.includes("check constraint") && normalized.includes("price"));

  if (priceConstraintTriggered) {
    return "Price was not enough. Increase the buy amount and try again.";
  }

  return rawMessage || "Something went wrong";
}

export default function TradeModal({
  open,
  type,
  symbol,
  name,
  region,
  price,
  userId,
  onClose,
}: Props) {
  const router = useRouter();

  const [qty, setQty] = useState(1);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [availableBalance, setAvailableBalance] = useState<number>(0);
  const [availableShares, setAvailableShares] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const normalizedRegion = resolveMarketRegion(region, symbol);
  const normalizedSymbol = symbol.trim().toUpperCase();
  const displaySymbol = getDisplaySymbol(normalizedSymbol, normalizedRegion);

  const invalid =
    qty <= 0 || (type === "SELL" && (fetching || qty > availableShares));

  useEffect(() => {
    if (!open) return;
    let active = true;

    setError(null);
    setFetching(true);

    if (type === "BUY") {
      setQty((current) => (current > 0 ? current : 1));
    }

    const fetchData = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL.replace(/\/+$/, "")}/home?user_id=${userId}`
        );
        const data = await response.json().catch(() => ({}));
        if (!active) return;

        const nextBalance = Number(data?.available_balance);
        if (Number.isFinite(nextBalance)) {
          setAvailableBalance(nextBalance);
        }

        if (type === "SELL") {
          const holdings = Array.isArray(data?.holdings) ? data.holdings : [];
          const symbolOnlyFallback = holdings.find((h: any) => {
            const holdingSymbol =
              typeof h?.symbol === "string" ? h.symbol.trim().toUpperCase() : "";
            const holdingRegion = resolveMarketRegion(
              h?.region ?? h?.market,
              holdingSymbol
            );
            const holdingDisplaySymbol = getDisplaySymbol(
              holdingSymbol,
              holdingRegion
            ).toUpperCase();
            const targetDisplaySymbol = getDisplaySymbol(
              normalizedSymbol,
              normalizedRegion
            ).toUpperCase();

            return (
              holdingSymbol === normalizedSymbol ||
              holdingDisplaySymbol === targetDisplaySymbol
            );
          });

          const exactHolding = holdings.find((h: any) => {
            const holdingSymbol =
              typeof h?.symbol === "string" ? h.symbol.trim().toUpperCase() : "";
            const holdingRegion = resolveMarketRegion(
              h?.region ?? h?.market,
              holdingSymbol
            );
            const holdingDisplaySymbol = getDisplaySymbol(
              holdingSymbol,
              holdingRegion
            ).toUpperCase();
            const targetDisplaySymbol = getDisplaySymbol(
              normalizedSymbol,
              normalizedRegion
            ).toUpperCase();

            return (
              (holdingSymbol === normalizedSymbol ||
                holdingDisplaySymbol === targetDisplaySymbol) &&
              holdingRegion === normalizedRegion
            );
          });

          const holding = exactHolding ?? symbolOnlyFallback;

          const ownedQty = Number(holding?.quantity);
          const safeOwnedQty = Number.isFinite(ownedQty)
            ? Math.max(0, Math.trunc(ownedQty))
            : 0;

          setAvailableShares(safeOwnedQty);
          setQty(safeOwnedQty > 0 ? 1 : 0);
        }
      } catch {
        if (!active) return;
        setAvailableBalance(0);
        setAvailableShares(0);
      } finally {
        if (active) {
          setFetching(false);
        }
      }
    };

    void fetchData();

    return () => {
      active = false;
    };
  }, [normalizedRegion, normalizedSymbol, open, type, userId]);

  if (!open) return null;

  const submit = async () => {
    if (type === "BUY" && (!Number.isFinite(price) || price <= 0)) {
      const message = "Price was not enough. Increase the buy amount and try again.";
      setError(message);
      toast.error("Buy order failed", { description: message });
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const payload = {
        user_id: userId,
        symbol: normalizedSymbol,
        region: normalizedRegion,
        quantity: qty,
      };

      if (type === "BUY") {
        await buyStock(payload);
      } else {
        await sellStock(payload);
      }

      const trimmedReason = reason.trim();
      toast.success(`${type === "BUY" ? "Buy" : "Sell"} order placed successfully`, {
        description: trimmedReason
          ? "Trade placed. Reflection will save in background."
          : undefined,
      });

      setLoading(false);
      onClose();
      router.replace(type === "BUY" ? "/buy-confirmed" : "/sell-confirmed");

      void syncTraderDaysFromTrades(userId).catch(() => {});

      if (trimmedReason) {
        void addToAlmanack(userId, trimmedReason).catch(() => {});
      }

      void maybeSendTradeConfirmationNotification({
        side: type,
        symbol: normalizedSymbol,
        quantity: qty,
      }).catch(() => {});
    } catch (submitError: unknown) {
      const message = getFriendlyTradeErrorMessage(submitError);
      setError(message);
      toast.error(`${type === "BUY" ? "Buy" : "Sell"} order failed`, {
        description: message,
      });
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 backdrop-blur-[1px] md:items-center">
      <div className="w-full max-w-3xl rounded-t-3xl border border-neutral-800 bg-black px-5 pt-5 pb-6 md:rounded-3xl md:px-7 md:pt-6 md:pb-7">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">{name ?? displaySymbol}</h2>
            <p className="text-neutral-500">
              {normalizedRegion}: {displaySymbol}
            </p>
          </div>

          <button onClick={onClose} className="text-xl text-neutral-400">
            ✕
          </button>
        </div>

        <div className="mb-5 flex items-center">
          <span className="text-4xl font-semibold text-white">${price.toFixed(2)}</span>
          <span className="ml-3 h-2 w-2 rounded-full bg-green-400" />
        </div>

        <div className="mb-6 grid gap-3 md:grid-cols-2">
          {type === "BUY" ? (
            <div className="rounded-2xl border border-neutral-800 bg-neutral-950/70 px-4 py-3">
              <p className="text-[10px] uppercase tracking-widest text-neutral-500">
                Available Balance
              </p>
              <p className="mt-1 text-lg font-semibold text-neutral-100">
                {fetching ? "Loading..." : `₹${availableBalance.toFixed(2)}`}
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-neutral-800 bg-neutral-950/70 px-4 py-3">
              <p className="text-[10px] uppercase tracking-widest text-neutral-500">
                Shares Available
              </p>
              <p className="mt-1 text-lg font-semibold text-neutral-100">
                {fetching ? "Loading..." : availableShares}
              </p>
            </div>
          )}

          <div className="rounded-2xl border border-neutral-800 bg-neutral-950/70 px-4 py-3">
            <p className="text-[10px] uppercase tracking-widest text-neutral-500">
              Estimated Value
            </p>
            <p className="mt-1 text-lg font-semibold text-neutral-100">
              ${(qty * price).toFixed(2)}
            </p>
          </div>
        </div>

        <p className="mb-2 text-neutral-500">Quantity</p>

        <div className="mb-6 flex items-center justify-between rounded-2xl border border-neutral-800 bg-neutral-950/65 px-2 py-1">
          <button
            onClick={() => setQty((q) => Math.max(type === "SELL" ? 0 : 1, q - 1))}
            className="px-5 py-2.5 text-3xl text-white disabled:text-neutral-600"
            disabled={loading || (type === "SELL" && availableShares <= 0)}
          >
            −
          </button>

          <span className="min-w-20 text-center text-4xl font-semibold text-white">
            {qty}
          </span>

          <button
            onClick={() =>
              setQty((q) =>
                type === "SELL" ? Math.min(q + 1, availableShares) : q + 1
              )
            }
            className="px-5 py-2.5 text-3xl text-white disabled:text-neutral-600"
            disabled={
              loading || (type === "SELL" && (availableShares <= 0 || qty >= availableShares))
            }
          >
            +
          </button>
        </div>

        {type === "SELL" && availableShares <= 0 && !fetching && (
          <p className="mb-4 rounded-xl border border-amber-700/40 bg-amber-900/20 px-3 py-2 text-sm text-amber-300">
            You currently have no shares available to sell for this stock.
          </p>
        )}

        <p className="mb-2 text-base text-white">
          Why are you {type === "BUY" ? "buying" : "selling"} this?
        </p>

        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="What did you notice? What are you expecting?"
          className="mb-6 h-28 w-full rounded-xl bg-neutral-900 p-4 text-white placeholder:text-neutral-600 md:h-32"
        />

        {error && <p className="mb-3 text-red-400">{error}</p>}

        <button
          disabled={invalid || loading || (type === "SELL" && (fetching || availableShares === 0))}
          onClick={submit}
          className={`w-full rounded-2xl py-4 text-lg font-semibold transition-colors ${
            invalid ? "bg-neutral-700 text-neutral-400" : "bg-white text-black hover:bg-neutral-200"
          }`}
        >
          {loading ? "Executing..." : `Confirm ${type === "BUY" ? "Buy" : "Sell"}`}
        </button>
      </div>
    </div>
  );
}
