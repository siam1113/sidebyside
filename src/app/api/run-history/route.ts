import { NextResponse } from "next/server";
import { listRunHistory, type RunHistoryKind } from "@/lib/db/runHistory";

const KINDS: RunHistoryKind[] = ["chat", "evaluate", "embed", "image"];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const gatewayId = searchParams.get("gatewayId") ?? undefined;
  const kindParam = searchParams.get("kind");
  const kind = kindParam && KINDS.includes(kindParam as RunHistoryKind) ? (kindParam as RunHistoryKind) : undefined;
  const successParam = searchParams.get("success");
  const success = successParam === "true" ? true : successParam === "false" ? false : undefined;
  const limit = Number(searchParams.get("limit")) || undefined;
  const offset = Number(searchParams.get("offset")) || undefined;

  const entries = listRunHistory({ gatewayId, kind, success, limit, offset });
  return NextResponse.json({ entries });
}
