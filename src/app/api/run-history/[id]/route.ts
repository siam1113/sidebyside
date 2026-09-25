import { NextResponse } from "next/server";
import { getRunHistoryEntry } from "@/lib/db/runHistory";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const entry = getRunHistoryEntry(id);
  if (!entry) {
    return NextResponse.json({ error: "Run not found" }, { status: 404 });
  }
  return NextResponse.json(entry);
}
