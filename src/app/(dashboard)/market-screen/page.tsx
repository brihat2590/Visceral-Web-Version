"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { searchStocks } from "@/api/stock";

import { fetchMarkets } from "@/api/stock";

import MarketTabs from "@/components/MarketTabs";


import StockRow from "@/components/StockRow";

import { getDisplaySymbol } from "@/lib/displaySymbol";

import { MarketStock } from "@/types/stock";

function SearchResultRow({
  symbol,
  companyName,
  market,
}: {
  symbol: string;
  companyName?: string;
  market: string;
}) {
  const displaySymbol = getDisplaySymbol(symbol, market);

  // In Next.js, we use Link for better SEO and prefetching
  return (
    <Link
      href={`/stock-details/${symbol}?market=${market}`}
      className="block px-6 py-4 border-b border-neutral-800 bg-black hover:bg-neutral-900 transition-colors"
    >
      <div className="flex flex-col">
        <span className="text-white text-base font-semibold">
          {displaySymbol}
        </span>
        <span className="text-neutral-500 text-xs mt-1">
          {companyName || "Stock"}
        </span>
      </div>
    </Link>
  );
}

export default function MarketScreen() {
  const router = useRouter();
  const [market, setMarket] = useState("US");
  const [stocks, setStocks] = useState<MarketStock[]>([]);
  const [searchResults, setSearchResults] = useState<MarketStock[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  // Fetch market stocks
  useEffect(() => {
    fetchMarkets(market).then((res) => setStocks(res.stocks));
  }, [market]);

  // Search logic with debounce and AbortController
  useEffect(() => {
    if (!search.trim()) {
      setSearchResults([]);
      return;
    }

    const controller = new AbortController();

    const timeout = setTimeout(async () => {
      try {
        setLoading(true);
        const res = await searchStocks(search, controller.signal);
        setSearchResults(res);
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.error("Search error:", err);
        }
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, [search]);

  const isSearching = search.trim().length > 0;
  const currentData = isSearching ? searchResults : stocks;

  return (
    <div className="flex-1 min-h-screen bg-black pt-8 px-8 flex flex-col overflow-hidden">
      <MarketTabs active={market} onChange={setMarket} />

      {/* 🔎 Search bar */}
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by ticker or symbol"
        className="mt-4 px-6 py-2 rounded-full bg-neutral-900 text-white border-none outline-none focus:ring-1 focus:ring-neutral-700"
      />

      <p className="text-gray-300 text-[11px] tracking-wider font-medium mb-4 pt-5 uppercase">
        Where attention is converging
      </p>

      {/* 🔽 Search results / Market list */}
      <div className="flex-1 overflow-y-auto pb-10 custom-scrollbar">
        {currentData.length > 0 ? (
          currentData.map((item) =>
            isSearching ? (
              <SearchResultRow
                key={item.symbol}
                symbol={item.symbol}
                companyName={item.company_name ?? item.name}
                market={item.market ?? market}
              />
            ) : (
              <StockRow
                key={item.symbol}
                item={item}
                onPress={() => router.push(`/stock-details/${item.symbol}?market=${market}`)}
              />
            )
          )
        ) : (
          /* Empty Component States */
          <div className="flex flex-col items-center justify-center pt-16 px-6 text-center">
            {isSearching ? (
              <p className="text-neutral-500">
                {loading ? "Searching..." : "No matching stocks"}
              </p>
            ) : (
              <>
                <h3 className="text-neutral-400 text-lg font-semibold">
                  Market is closed
                </h3>
                <p className="text-neutral-600 text-sm mt-2 max-w-xs">
                  Prices will update when the market opens.
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}