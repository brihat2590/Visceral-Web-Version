export interface MarketStock {
    symbol: string;
    company_name?: string;
    name?: string;
    logo_url?: string;
    market: string;
    display_price: number;
    percentage_change: number;
    yesterday_price_change: number;
    updated_at?: string;
  }
  
  export interface StockDetail {
    ticker: string;
    name?: string;
    exchange?: string;
    currency?: string;
    logo_url?: string;
    currentPrice: number;
    dayOpen?: number;
    previousClose?: number;
    percentage_change?: number;
    single_day_change?: number;
    single_day_change_pct?: number;
    quote_snapshot?: {
      last?: number;
      prev?: number;
      currentPrice?: number;
      dayHigh?: number;
      dayLow?: number;
      dayVolume?: number;
      marketCap?: number;
      [key: string]: unknown;
    };
    dayHigh: number;
    dayLow: number;
    dayVolume?: number;
    marketCap: number;
    peRatio?: number;
    revenue?: number;
    eps?: number;
    profitMargins?: number;
    dividendYield?: number;
    fiftyTwoWeekHigh?: number;
    fiftyTwoWeekLow?: number;
    beta?: number;
    bookValue?: number;
    cash?: number;
    debt?: number;
    growthMetrics?: {
      revenueGrowth?: number;
      earningsGrowth?: number;
      earningsQuarterlyGrowth?: number;
    };
    fundamentals?: {
      source?: string;
      metricType?: string;
      symbol?: string;
      peRatio?: number;
      dayVolume?: number;
      marketCap?: number;
      revenue?: number;
      revenuePerShareTTM?: number;
      eps?: number;
      profitMargins?: number;
      dividendYield?: number;
      fiftyTwoWeekHigh?: number;
      fiftyTwoWeekLow?: number;
      beta?: number;
      bookValue?: number;
      cash?: number;
      cashPerShareAnnual?: number;
      debt?: number;
      debtToEquityAnnual?: number;
      growthMetrics?: {
        revenueGrowth?: number;
        earningsGrowth?: number;
        earningsQuarterlyGrowth?: number;
      };
    };
    range?: string;
    data: {
      timestamp: string;
      open: number;
      high: number;
      low: number;
      close: number;
      volume: number;
      percentage_change?: number;
    }[];
  }