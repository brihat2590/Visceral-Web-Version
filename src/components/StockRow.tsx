"use client";

import React from "react";
import { getDisplaySymbol } from "../lib/displaySymbol";
import { MarketStock } from "../types/stock";

export default function StockRow({
  item,
  onPress,
  showYesterdayChange
}: {
  item: MarketStock;
  onPress: () => void;
  showYesterdayChange?: boolean;
}) {
  const displaySymbol = getDisplaySymbol(item.symbol, item.market);
  const companyName = item.company_name ?? item.name;
  const positive = item.percentage_change >= 0;

  return (
    <button 
      onClick={onPress}
      className="w-full text-left bg-transparent border-none p-0 cursor-pointer group outline-none"
    >
      <div className="flex flex-row justify-between items-center py-6 bg-black border-b border-neutral-900 group-hover:bg-neutral-900/50 transition-colors">
        <div className="flex flex-row items-center gap-4">
          <div className="h-12 w-12 rounded-full overflow-hidden shrink-0 bg-neutral-800 border border-neutral-700 flex items-center justify-center">
            {item.logo_url ? (
              <img
                src={item.logo_url}
                alt={`${displaySymbol} logo`}
                className="h-full w-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            ) : (
              <span className="text-white text-xs font-bold leading-none">
                {displaySymbol.slice(0, 3)}
              </span>
            )}
          </div>
          <div>
            <p className="text-white text-lg font-semibold leading-none">
              {displaySymbol}
            </p>
            {companyName ? (
              <p className="text-neutral-500 text-xs mt-1 max-w-[140px] md:max-w-[200px] truncate">
                {companyName}
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col items-end">
          <p className="text-white text-base font-semibold leading-none">
            ${item.display_price.toFixed(2)}
          </p>
          <p
            className={`text-sm font-medium mt-1 ${
              positive ? "text-green-400" : "text-red-400"
            }`}
          >
            {positive ? "+" : ""}
            {item.percentage_change.toFixed(2)}%
          </p>
        </div>
      </div>
    </button>
  );
}