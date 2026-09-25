import { NextResponse } from "next/server";
import { fetchOpenRouterCatalog } from "@/lib/pricing/openrouter";
import { replaceCatalog } from "@/lib/db/pricing";

export async function POST() {
  try {
    const entries = await fetchOpenRouterCatalog();
    replaceCatalog(entries);
    return NextResponse.json({ count: entries.length, fetchedAt: new Date().toISOString() });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
