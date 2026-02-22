const MARKET_ALIAS_BY_CODE: Record<string, string> = {
    UK: "LONDON",
    UNITED_KINGDOM: "LONDON",
    LSE: "LONDON",
    LONDON_STOCK_EXCHANGE: "LONDON",
    GB: "LONDON",
    USA: "US",
    UNITED_STATES: "US",
    NYSE: "US",
    NASDAQ: "US",
    NSE: "INDIA",
    BSE: "INDIA",
    HK: "HONG_KONG",
    HKEX: "HONG_KONG",
    SOUTH_KOREA: "KOREA",
    KRX: "KOREA",
    AUS: "AUSTRALIA",
  };
  
  export function inferMarketRegionFromSymbol(symbol: unknown): string {
    if (typeof symbol !== "string") return "US";
    const safeSymbol = symbol.trim().toUpperCase();
    if (!safeSymbol) return "US";
    return safeSymbol.endsWith("-USD") ? "CRYPTO" : "US";
  }
  
  export function normalizeMarketRegion(
    value: unknown,
    fallback: string = "US",
  ): string {
    if (typeof value !== "string") return fallback;
  
    const normalized = value.trim().toUpperCase().replace(/[\s-]+/g, "_");
    if (!normalized) return fallback;
  
    return MARKET_ALIAS_BY_CODE[normalized] ?? normalized;
  }
  
  export function resolveMarketRegion(
    value: unknown,
    symbol: unknown,
    fallback: string = "US",
  ): string {
    return normalizeMarketRegion(value, inferMarketRegionFromSymbol(symbol) || fallback);
  }