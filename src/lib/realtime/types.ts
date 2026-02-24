
export type RealtimeConnectionStatus =
  | "connecting"
  | "live"
  | "stale"
  | "disconnected";

export type HoldingSnapshot = {
  symbol: string;
  quantity?: number;
  avg_price?: number;
  current_price?: number;
  current_value?: number;
  unrealized_pnl?: number;
  unrealized_pnl_pct?: number;
  company_name?: string;
  market?: string;
  region?: string;
  logo_url?: string | null;
  [key: string]: unknown;
};

export type HomePayload = {
  available_balance: number;
  total_return: {
    percentage?: number;
    [key: string]: unknown;
  } | null;
  single_day_return: {
    percentage?: number;
    [key: string]: unknown;
  } | null;
  almanack: {
    system_analysis?: string | null;
    [key: string]: unknown;
  } | null;
  holdings: HoldingSnapshot[];
  [key: string]: unknown;
};

export type MarketStockSnapshot = {
  symbol: string;
  region?: string;
  market?: string;
  base_price?: number;
  display_price?: number;
  percentage_change?: number;
  yesterday_price_change?: number;
  updated_at?: string;
  company_name?: string;
  name?: string;
  logo_url?: string | null;
  price_source?: "redis" | "db";
  [key: string]: unknown;
};

export type MarketsPayload = {
  active_regions: string[];
  count: number;
  stocks: MarketStockSnapshot[];
  server_now?: string | null;
  [key: string]: unknown;
};

export type RealtimeSnapshotState<T> = {
  status: RealtimeConnectionStatus;
  stale: boolean;
  data: T | null;
  error: string | null;
  lastUpdatedAt: number | null;
};
