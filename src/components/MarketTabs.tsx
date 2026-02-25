"use client";

import React from "react";

const MARKETS = ["US", "LONDON", "CRYPTO", "CHINA", "INDIA"];

export default function MarketTabs({
  active,
  onChange,
}: {
  active: string;
  onChange: (m: string) => void;
}) {
  return (
    <div className="flex flex-row justify-between pl-1 mt-4">
      {MARKETS.map((m) => (
        <button
          key={m}
          onClick={() => onChange(m)}
          type="button"
          className="bg-transparent border-none p-0 cursor-pointer outline-none focus:ring-0"
        >
          <span
            className={`text-sm tracking-wider transition-colors duration-200 ${
              m === active 
                ? "text-white font-bold" 
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            {m}
          </span>
        </button>
      ))}
    </div>
  );
}