const EXCHANGE_SUFFIXES = new Set([
    "NS",
    "BO",
    "L",
    "TO",
    "V",
    "AX",
    "HK",
    "SS",
    "SZ",
    "KS",
    "KQ",
    "SI",
    "T",
    "PA",
    "F",
    "SW",
    "MI",
    "AS",
    "BR",
    "SA",
    "MX",
    "ME",
    "TA",
    "IR",
    "IC",
    "IS",
    "JK",
    "VN",
    "BK",
    "ST",
    "HE",
    "CO",
    "OL",
  ]);
  
  export function getDisplaySymbol(symbol: string, market?: string) {
    if (typeof symbol !== "string") return "";
  
    const normalizedSymbol = symbol.trim();
    const normalizedMarket = typeof market === "string" ? market.toUpperCase() : "";
    const upperSymbol = normalizedSymbol.toUpperCase();
  
    if (normalizedMarket === "CRYPTO" && upperSymbol.endsWith("-USD")) {
      return normalizedSymbol.slice(0, -4);
    }
  
    // Exchange suffixes in source tickers (e.g. RELIANCE.NS, VOD.L) should not be shown.
    const suffixMatch = normalizedSymbol.match(/\.([A-Za-z]+)$/);
    if (suffixMatch) {
      const suffix = (suffixMatch[1] ?? "").toUpperCase();
      if (EXCHANGE_SUFFIXES.has(suffix)) {
        return normalizedSymbol.slice(0, -(suffix.length + 1));
      }
    }
  
    return normalizedSymbol;
  }