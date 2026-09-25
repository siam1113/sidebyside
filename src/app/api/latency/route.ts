import { NextResponse } from "next/server";
import { summarizeLatency } from "@/lib/db/latency";

const DEFAULT_WINDOW_DAYS = 7;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const days = Number(searchParams.get("days")) || DEFAULT_WINDOW_DAYS;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  return NextResponse.json({ since, gateways: summarizeLatency(since) });
}
