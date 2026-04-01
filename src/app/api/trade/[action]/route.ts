import { NextRequest, NextResponse } from "next/server";

const BACKEND_BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL?.trim() || "http://127.0.0.1:8000";

function stripTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

function isTradeAction(action: string) {
  return action === "buy" || action === "sell";
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ action: string }> }
) {
  const { action } = await params;

  if (!isTradeAction(action)) {
    return NextResponse.json({ detail: "Unsupported trade action" }, { status: 404 });
  }

  const query = request.nextUrl.searchParams.toString();
  const target = `${stripTrailingSlash(BACKEND_BASE_URL)}/${action}${
    query ? `?${query}` : ""
  }`;

  try {
    const upstream = await fetch(target, {
      method: "POST",
      headers: {
        Accept: "application/json, text/plain;q=0.9, */*;q=0.8",
      },
      cache: "no-store",
    });

    const body = await upstream.text();
    return new NextResponse(body, {
      status: upstream.status,
      headers: {
        "content-type": upstream.headers.get("content-type") || "application/json",
      },
    });
  } catch {
    return NextResponse.json(
      { detail: "Unable to reach backend trade service." },
      { status: 502 }
    );
  }
}
