"use client";

import React from "react";
import { getDisplaySymbol } from "../lib/displaySymbol";
import { MarketStock } from "../types/stock";

export default function StockRow({
  item,
  onPress
}: {
  item: MarketStock;
  onPress: () => void;
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
        <div>
          <p className="text-white text-lg font-semibold leading-none">
            {displaySymbol}
          </p>
          {companyName ? (
            <p className="text-neutral-500 text-xs mt-1">
              {companyName}
            </p>
          ) : null}
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