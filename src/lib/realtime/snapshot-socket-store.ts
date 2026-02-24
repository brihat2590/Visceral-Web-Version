import {
    type RealtimeConnectionStatus,
    type RealtimeSnapshotState,
  } from "@/lib/realtime/types";
  
  type SnapshotParser<T> = (payload: unknown) => T | null;
  type SnapshotFetcher<T> = () => Promise<T>;
  type Listener = () => void;
  
  type RealtimeSnapshotStoreConfig<T> = {
    name: string;
    getSocketUrl: () => string | null;
    parseSnapshot: SnapshotParser<T>;
    fetchSnapshot?: SnapshotFetcher<T>;
    minUpdateIntervalMs?: number;
  };
  
  const RECONNECT_MIN_DELAY_MS = 1000;
  const RECONNECT_MAX_DELAY_MS = 20_000;
  const LIVE_STALE_AFTER_MS = 30_000;
  
  function getErrorMessage(error: unknown) {
    if (error instanceof Error) return error.message;
    return String(error ?? "Unknown error");
  }
  
  export class RealtimeSnapshotStore<T> {
    private readonly name: string;
    private readonly getSocketUrl: () => string | null;
    private readonly parseSnapshot: SnapshotParser<T>;
    private readonly fetchSnapshot?: SnapshotFetcher<T>;
    private readonly minUpdateIntervalMs: number;
  
    private readonly listeners = new Set<Listener>();
    private socket: WebSocket | null = null;
    private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    private inactivityTimer: ReturnType<typeof setTimeout> | null = null;
    private snapshotThrottleTimer: ReturnType<typeof setTimeout> | null = null;
    private pendingSnapshot: T | null = null;
    private lastSnapshotAppliedAt = 0;
    private reconnectDelayMs = RECONNECT_MIN_DELAY_MS;
    private fallbackFetchInFlight = false;
    private retainedConsumers = 0;
    private shouldRun = false;
  
    private state: RealtimeSnapshotState<T> = {
      status: "disconnected",
      stale: false,
      data: null,
      error: null,
      lastUpdatedAt: null,
    };
  
    constructor(config: RealtimeSnapshotStoreConfig<T>) {
      this.name = config.name;
      this.getSocketUrl = config.getSocketUrl;
      this.parseSnapshot = config.parseSnapshot;
      this.fetchSnapshot = config.fetchSnapshot;
      this.minUpdateIntervalMs = Math.max(0, Number(config.minUpdateIntervalMs) || 0);
    }
  
    getState = () => this.state;
  
    subscribe = (listener: Listener) => {
      this.listeners.add(listener);
      return () => {
        this.listeners.delete(listener);
      };
    };
  
    acquire = () => {
      this.retainedConsumers += 1;
      if (this.retainedConsumers === 1) {
        this.start();
      }
  
      return () => {
        this.release();
      };
    };
  
    refreshFromRest = async () => {
      await this.fetchAndApplySnapshot({
        source: "manual_rest",
      });
    };
  
    private release() {
      this.retainedConsumers = Math.max(0, this.retainedConsumers - 1);
      if (this.retainedConsumers > 0) return;
  
      this.stop();
    }
  
    private start() {
      this.shouldRun = true;
      this.openSocket();
      void this.fetchAndApplySnapshot({
        source: "initial_rest",
        onlyIfNoData: true,
      });
    }
  
    private stop() {
      this.shouldRun = false;
  
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }
      this.clearInactivityTimer();
      this.clearSnapshotThrottle();
  
      if (this.socket) {
        this.socket.onopen = null;
        this.socket.onmessage = null;
        this.socket.onerror = null;
        this.socket.onclose = null;
        this.socket.close();
        this.socket = null;
      }
  
      const nextStatus: RealtimeConnectionStatus =
        this.state.data !== null ? "stale" : "disconnected";
      this.setState({
        status: nextStatus,
        stale: this.state.data !== null,
      });
    }
  
    private notify() {
      for (const listener of this.listeners) {
        listener();
      }
    }
  
    private setState(patch: Partial<RealtimeSnapshotState<T>>) {
      this.state = {
        ...this.state,
        ...patch,
      };
      this.notify();
    }
  
    private scheduleReconnect() {
      if (!this.shouldRun) return;
      if (this.reconnectTimer) return;
  
      const delay = this.reconnectDelayMs;
      this.reconnectTimer = setTimeout(() => {
        this.reconnectTimer = null;
        this.openSocket();
      }, delay);
      this.reconnectDelayMs = Math.min(
        this.reconnectDelayMs * 2,
        RECONNECT_MAX_DELAY_MS,
      );
    }
  
    private clearInactivityTimer() {
      if (!this.inactivityTimer) return;
      clearTimeout(this.inactivityTimer);
      this.inactivityTimer = null;
    }
  
    private clearSnapshotThrottle() {
      if (this.snapshotThrottleTimer) {
        clearTimeout(this.snapshotThrottleTimer);
        this.snapshotThrottleTimer = null;
      }
      this.pendingSnapshot = null;
    }
  
    private applyLiveSnapshot(snapshot: T) {
      this.lastSnapshotAppliedAt = Date.now();
      this.setState({
        status: "live",
        stale: false,
        data: snapshot,
        error: null,
        lastUpdatedAt: Date.now(),
      });
      this.armInactivityTimer();
    }
  
    private queueOrApplyLiveSnapshot(snapshot: T) {
      if (this.minUpdateIntervalMs <= 0) {
        this.applyLiveSnapshot(snapshot);
        return;
      }
  
      const now = Date.now();
      const elapsedMs = now - this.lastSnapshotAppliedAt;
      if (this.lastSnapshotAppliedAt === 0 || elapsedMs >= this.minUpdateIntervalMs) {
        this.applyLiveSnapshot(snapshot);
        return;
      }
  
      this.pendingSnapshot = snapshot;
      if (this.snapshotThrottleTimer) {
        return;
      }
  
      const waitMs = Math.max(0, this.minUpdateIntervalMs - elapsedMs);
      this.snapshotThrottleTimer = setTimeout(() => {
        this.snapshotThrottleTimer = null;
        const pending = this.pendingSnapshot;
        this.pendingSnapshot = null;
        if (!pending || !this.shouldRun) return;
        this.applyLiveSnapshot(pending);
      }, waitMs);
    }
  
    private armInactivityTimer() {
      this.clearInactivityTimer();
      if (!this.shouldRun) return;
  
      this.inactivityTimer = setTimeout(() => {
        this.inactivityTimer = null;
        if (!this.shouldRun || !this.socket) return;
  
        // Force a reconnect when the socket goes silent without closing.
        this.socket.close();
      }, LIVE_STALE_AFTER_MS);
    }
  
    private openSocket() {
      if (!this.shouldRun) return;
      if (this.socket) return;
  
      const socketUrl = this.getSocketUrl();
      if (!socketUrl) {
        this.setState({
          status: "disconnected",
          stale: this.state.data !== null,
          error: `${this.name}: socket URL is missing.`,
        });
        return;
      }
  
      this.setState({
        status: "connecting",
        stale: this.state.data !== null,
        error: null,
      });
  
      const socket = new WebSocket(socketUrl);
      this.socket = socket;
  
      socket.onopen = () => {
        this.reconnectDelayMs = RECONNECT_MIN_DELAY_MS;
        this.armInactivityTimer();
        if (!this.shouldRun) {
          socket.close();
          return;
        }
        if (this.state.data === null) {
          this.setState({
            status: "connecting",
            stale: false,
            error: null,
          });
        }
      };
  
      socket.onmessage = (event) => {
        let parsedRaw: unknown;
        if (typeof event.data === "string") {
          const raw = event.data.trim();
          if (!raw) return;
  
          const lowered = raw.toLowerCase();
          if (lowered === "ping" || lowered === "pong") {
            return;
          }
  
          try {
            parsedRaw = JSON.parse(raw);
          } catch {
            // Ignore non-JSON text frames (often heartbeat/control frames).
            return;
          }
        } else {
          parsedRaw = event.data;
        }
  
        if (!parsedRaw || typeof parsedRaw !== "object") {
          return;
        }
  
        const snapshot = this.parseSnapshot(parsedRaw);
        if (!snapshot) return;
        this.queueOrApplyLiveSnapshot(snapshot);
      };
  
      socket.onerror = () => {
        this.setState({
          error: `${this.name}: socket error.`,
        });
      };
  
      socket.onclose = () => {
        if (this.socket === socket) {
          this.socket = null;
        }
        this.clearInactivityTimer();
        this.clearSnapshotThrottle();
  
        if (!this.shouldRun) return;
  
        const hasSnapshot = this.state.data !== null;
        this.setState({
          status: hasSnapshot ? "stale" : "disconnected",
          stale: hasSnapshot,
        });
  
        void this.fetchAndApplySnapshot({
          source: "disconnect_rest",
        });
        this.scheduleReconnect();
      };
    }
  
    private async fetchAndApplySnapshot({
      source,
      onlyIfNoData = false,
    }: {
      source: "initial_rest" | "manual_rest" | "disconnect_rest";
      onlyIfNoData?: boolean;
    }) {
      if (!this.fetchSnapshot) return;
      if (this.fallbackFetchInFlight) return;
      if (onlyIfNoData && this.state.data !== null) return;
  
      this.fallbackFetchInFlight = true;
      try {
        const payload = await this.fetchSnapshot();
        const snapshot = this.parseSnapshot(payload);
        if (!snapshot) return;
  
        const isLive = this.state.status === "live";
        this.setState({
          data: snapshot,
          lastUpdatedAt: Date.now(),
          status: isLive ? "live" : "stale",
          stale: !isLive,
          error: null,
        });
      } catch (error) {
        if (source !== "initial_rest") {
          this.setState({
            error: `${this.name}: rest fallback failed (${getErrorMessage(error)}).`,
          });
        }
      } finally {
        this.fallbackFetchInFlight = false;
      }
    }
  }