"use client"; // Required for App Router hooks and WebSocket singleton

import { useEffect, useSyncExternalStore } from "react";
import { buildRestUrl, buildWsUrl } from "@/lib/realtime/endpoints";
import { RealtimeSnapshotStore } from "@/lib/realtime/snapshot-socket-store";
import {
  type MarketsPayload,
  type RealtimeSnapshotState,
} from "@/lib/realtime/types";

// --- Constants & State Defaults ---

const EMPTY_MARKETS_STATE: RealtimeSnapshotState<MarketsPayload> = {
  status: "disconnected",
  stale: false,
  data: null,
  error: null,
  lastUpdatedAt: null,
};

// --- Payload Normalization Logic ---

function unwrapMarketsPayload(payload: unknown): Record<string, unknown> | null {
  if (!payload || typeof payload !== "object") return null;

  const source = payload as Record<string, unknown>;
  const candidateKeys = ["snapshot", "payload", "data", "message"] as const;

  for (const key of candidateKeys) {
    const candidate = source[key];
    if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
      continue;
    }

    const record = candidate as Record<string, unknown>;
    if (
      Array.isArray(record.stocks) ||
      Array.isArray(record.active_regions) ||
      "count" in record
    ) {
      return record;
    }
  }

  return source;
}

function normalizeMarketsPayload(payload: unknown): MarketsPayload | null {
  const source = unwrapMarketsPayload(payload);
  if (!source) return null;

  const stocks = Array.isArray(source.stocks) ? source.stocks : [];
  const regions = Array.isArray(source.active_regions) ? source.active_regions : [];
  const countValue =
    typeof source.count === "number"
      ? source.count
      : Number.isFinite(Number(source.count))
      ? Number(source.count)
      : stocks.length;

  return {
    ...source,
    active_regions: regions
      .map((value) => (typeof value === "string" ? value.trim().toUpperCase() : ""))
      .filter((value): value is string => !!value),
    count: countValue,
    stocks: stocks as MarketsPayload["stocks"],
  };
}

// --- REST Fetcher ---

async function fetchMarketsSnapshot(): Promise<MarketsPayload> {
  const response = await fetch(buildRestUrl("/markets"), {
    cache: "no-store", // Next.js specific: ensures we bypass the Data Cache
    headers: {
      "Cache-Control": "no-cache, no-store, max-age=0",
      Pragma: "no-cache",
    },
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`Markets fetch failed (${response.status})`);
  }

  const normalized = normalizeMarketsPayload(payload);
  if (!normalized) {
    throw new Error("Markets payload is invalid.");
  }

  return normalized;
}

// --- Singleton Store Instance ---
// This instance persists across client-side navigation in Next.js
const marketsStore = new RealtimeSnapshotStore<MarketsPayload>({
  name: "markets",
  getSocketUrl: () => buildWsUrl("/markets/ws"),
  parseSnapshot: normalizeMarketsPayload,
  fetchSnapshot: fetchMarketsSnapshot,
  minUpdateIntervalMs: 220,
});

// --- Exported Hooks & Utilities ---

/**
 * Manages the connection lifecycle. 
 * Use this in a layout or high-level component to keep the market data warm.
 */
export function useMarketsRealtimeConnection(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    // .acquire() increments the consumer count and opens the socket
    return marketsStore.acquire();
  }, [enabled]);
}

/**
 * Subscribes to the store state. 
 * Safe for SSR hydration via the third argument (getServerSnapshot).
 */
export function useMarketsRealtimeState() {
  return useSyncExternalStore(
    marketsStore.subscribe,
    marketsStore.getState,
    () => EMPTY_MARKETS_STATE // Used for initial server render in Next.js
  );
}

/**
 * Utility to manually trigger a REST-based refresh of the market data.
 */
export async function refreshMarketsSnapshot() {
  await marketsStore.refreshFromRest();
}