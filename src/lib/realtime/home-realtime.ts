"use client"; // Required for App Router hooks & WebSocket logic

import { useCallback, useEffect, useMemo, useSyncExternalStore } from "react";
import { buildRestUrl, buildWsUrl } from "@/lib/realtime/endpoints";
import { RealtimeSnapshotStore } from "@/lib/realtime/snapshot-socket-store";
import { type HomePayload, type RealtimeSnapshotState } from "@/lib/realtime/types";

// --- Constants & Types ---

const EMPTY_HOME_STATE: RealtimeSnapshotState<HomePayload> = {
  status: "disconnected",
  stale: false,
  data: null,
  error: null,
  lastUpdatedAt: null,
};

// Module-level cache to persist the store instance during client-side navigation
const homeStores = new Map<string, RealtimeSnapshotStore<HomePayload>>();

// --- Helper Logic ---

function unwrapHomePayload(payload: unknown): Record<string, unknown> | null {
  if (!payload || typeof payload !== "object") return null;
  const source = payload as Record<string, unknown>;
  const candidateKeys = ["snapshot", "payload", "data", "message"] as const;

  for (const key of candidateKeys) {
    const candidate = source[key];
    if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) continue;

    const record = candidate as Record<string, unknown>;
    if (
      Array.isArray(record.holdings) ||
      "available_balance" in record ||
      "total_return" in record ||
      "single_day_return" in record
    ) {
      return record;
    }
  }
  return source;
}

function normalizeHomePayload(payload: unknown): HomePayload | null {
  const source = unwrapHomePayload(payload);
  if (!source) return null;

  const holdings = Array.isArray(source.holdings) ? source.holdings : [];

  return {
    ...source,
    available_balance:
      typeof source.available_balance === "number"
        ? source.available_balance
        : Number(source.available_balance ?? 0),
    total_return:
      source.total_return && typeof source.total_return === "object"
        ? (source.total_return as HomePayload["total_return"])
        : null,
    single_day_return:
      source.single_day_return && typeof source.single_day_return === "object"
        ? (source.single_day_return as HomePayload["single_day_return"])
        : null,
    almanack:
      source.almanack && typeof source.almanack === "object"
        ? (source.almanack as HomePayload["almanack"])
        : null,
    holdings: holdings as HomePayload["holdings"],
  };
}

async function fetchHomeSnapshot(userId: string): Promise<HomePayload> {
  const params = new URLSearchParams({ user_id: userId });
  // Ensure we are using the browser's fetch
  const response = await fetch(buildRestUrl(`/home?${params.toString()}`), {
    cache: "no-store", // Next.js specific fetch option to bypass data cache
    headers: {
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
    },
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`Home fetch failed (${response.status})`);
  }

  const normalized = normalizeHomePayload(payload);
  if (!normalized) throw new Error("Home payload is invalid.");
  return normalized;
}

function getOrCreateHomeStore(userId: string) {
  // In Next.js, window is only available on the client
  if (typeof window === "undefined") return null;

  const existing = homeStores.get(userId);
  if (existing) return existing;

  const store = new RealtimeSnapshotStore<HomePayload>({
    name: `home:${userId}`,
    getSocketUrl: () => {
      const params = new URLSearchParams({ user_id: userId });
      return buildWsUrl(`/home/ws?${params.toString()}`);
    },
    parseSnapshot: normalizeHomePayload,
    fetchSnapshot: () => fetchHomeSnapshot(userId),
    minUpdateIntervalMs: 300,
  });

  homeStores.set(userId, store);
  return store;
}

// --- Exported Hooks ---

/**
 * Main hook for consuming realtime home data.
 * Safe for Next.js SSR via useSyncExternalStore getServerSnapshot parameter.
 */
export function useHomeRealtime(userId: string | null | undefined) {
  const safeUserId = typeof userId === "string" ? userId.trim() : "";

  const store = useMemo(() => {
    if (!safeUserId) return null;
    return getOrCreateHomeStore(safeUserId);
  }, [safeUserId]);

  useEffect(() => {
    if (!store) return;
    return store.acquire();
  }, [store]);

  const state = useSyncExternalStore(
    (listener) => {
      if (!store) return () => {};
      return store.subscribe(listener);
    },
    () => (store ? store.getState() : EMPTY_HOME_STATE),
    () => EMPTY_HOME_STATE // getServerSnapshot: used during Next.js SSR
  );

  const refresh = useCallback(async () => {
    if (!store) return;
    await store.refreshFromRest();
  }, [store]);

  return {
    ...state,
    refresh,
  };
}

/**
 * Secondary hook to just maintain a connection without necessarily consuming the data.
 */
export function useHomeRealtimeConnection(
  userId: string | null | undefined,
  enabled: boolean,
) {
  const safeUserId = typeof userId === "string" ? userId.trim() : "";

  const store = useMemo(() => {
    if (!safeUserId) return null;
    return getOrCreateHomeStore(safeUserId);
  }, [safeUserId]);

  useEffect(() => {
    if (!enabled || !store) return;
    return store.acquire();
  }, [enabled, store]);
}