"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { addToAlmanack } from "@/api/almanack";
import { buyStock, sellStock } from "@/api/trade";
import { toast } from "sonner";

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

  const invalid =
    qty <= 0 || (type === "SELL" && qty > availableShares);

  useEffect(() => {
    if (!open) return;

    setFetching(true);

    const fetchData = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL}/home?user_id=${userId}`
        );
        const data = await res.json();

        setAvailableBalance(data.available_balance);

        const holding = data.holdings?.find(
          (h: any) => h.symbol === symbol && h.region === region
        );

        const ownedQty = holding ? holding.quantity : 0;
        setAvailableShares(ownedQty);

        if (type === "SELL") {
          setQty(ownedQty > 0 ? 1 : 0);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setFetching(false);
      }
    };

    fetchData();
  }, [open, userId, symbol, region, type]);

  if (!open) return null;

  if (fetching) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-50">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white border-t-transparent" />
      </div>
    );
  }

  const submit = async () => {
    try {
      setLoading(true);
      setError(null);

      const payload = {
        user_id: userId,
        symbol,
        region,
        quantity: qty,
        reason,
      };

      // 1. Execute trade
      if (type === "BUY") {
        await buyStock(payload);
      } else {
        await sellStock(payload);
      }

      // 2. Almanack (optional)
      let almanackSaved = false;
      if (reason.trim()) {
        try {
          await addToAlmanack(userId, reason.trim());
          almanackSaved = true;
        } catch (e) {
          console.error("Almanack save failed:", e);
        }
      }

      // 3. Toast
      toast.success(
        almanackSaved
          ? `${type === "BUY" ? "Buy" : "Sell"} order placed • Note saved`
          : `${type === "BUY" ? "Buy" : "Sell"} order placed`
      );

      // 4. Navigate + close
      setTimeout(() => {
        router.replace(
          type === "BUY"
            ? "/buy-confirmed"
            : "/sell-confirmed"
        );
      }, 500);

      onClose();
    } catch (e: any) {
      setError(e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70">
      <div className="w-full max-w-lg rounded-t-3xl bg-black px-6 pt-6 pb-8 border-t border-neutral-800">

        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-white text-xl font-bold">
              {name ?? symbol}
            </h2>
            <p className="text-neutral-500">
              {region}: {symbol}
            </p>
          </div>

          <button onClick={onClose} className="text-neutral-400 text-xl">
            ✕
          </button>
        </div>

        {/* Price */}
        <div className="flex items-center mb-4">
          <span className="text-white text-4xl font-semibold">
            ${price.toFixed(2)}
          </span>
          <span className="ml-3 h-2 w-2 rounded-full bg-green-400" />
        </div>

        {type === "BUY" && (
          <p className="text-neutral-500 mb-4">
            Available balance: ₹{availableBalance.toFixed(2)}
          </p>
        )}

        {type === "SELL" && (
          <p className="text-neutral-500 mb-4">
            Available: {availableShares}
          </p>
        )}

        {/* Quantity */}
        <p className="text-neutral-500 mb-2">Quantity</p>

        <div className="flex items-center justify-between mb-10">
          <button
            onClick={() =>
              setQty(q => Math.max(type === "SELL" ? 0 : 1, q - 1))
            }
            className="px-6 py-3 text-white text-3xl"
          >
            −
          </button>

          <span className="text-white text-4xl font-semibold">
            {qty}
          </span>

          <button
            onClick={() =>
              setQty(q =>
                type === "SELL"
                  ? Math.min(q + 1, availableShares)
                  : q + 1
              )
            }
            className="px-6 py-3 text-white text-3xl"
          >
            +
          </button>
        </div>

        {/* Reason */}
        <p className="text-white text-base mb-2">
          Why are you {type === "BUY" ? "buying" : "selling"} this?
        </p>

        <textarea
          value={reason}
          onChange={e => setReason(e.target.value)}
          placeholder="What did you notice? What are you expecting?"
          className="w-full bg-neutral-900 text-white rounded-xl p-4 h-28 mb-6 placeholder:text-neutral-600"
        />

        {error && (
          <p className="text-red-400 mb-3">{error}</p>
        )}

        {/* Confirm */}
        <button
          disabled={
            invalid ||
            loading ||
            (type === "SELL" && availableShares === 0)
          }
          onClick={submit}
          className={`w-full py-4 rounded-2xl font-semibold text-lg ${
            invalid ? "bg-neutral-700 text-neutral-400" : "bg-white text-black"
          }`}
        >
          {loading
            ? "Executing..."
            : `Confirm ${type === "BUY" ? "Buy" : "Sell"}`}
        </button>
      </div>
    </div>
  );
}