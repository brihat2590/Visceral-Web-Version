const DEFAULT_BASE_URL = "http://localhost:3000";

const RAW_BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL?.trim() || DEFAULT_BASE_URL;

function stripTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

export const REST_BASE_URL = stripTrailingSlash(RAW_BASE_URL);

function toWsProtocol(url: string) {
  if (url.startsWith("https://")) {
    return `wss://${url.slice("https://".length)}`;
  }

  if (url.startsWith("http://")) {
    return `ws://${url.slice("http://".length)}`;
  }

  if (url.startsWith("wss://") || url.startsWith("ws://")) {
    return url;
  }

  return `ws://${url}`;
}

export const WS_BASE_URL = stripTrailingSlash(toWsProtocol(RAW_BASE_URL));

export function buildRestUrl(pathWithQuery: string) {
  const path = pathWithQuery.startsWith("/") ? pathWithQuery : `/${pathWithQuery}`;
  return `${REST_BASE_URL}${path}`;
}

export function buildWsUrl(pathWithQuery: string) {
  const path = pathWithQuery.startsWith("/") ? pathWithQuery : `/${pathWithQuery}`;
  return `${WS_BASE_URL}${path}`;
}