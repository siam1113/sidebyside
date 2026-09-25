import { NextResponse } from "next/server";
import { createDecision, listDecisions, type DecisionInput } from "@/lib/db/decisions";

export async function GET() {
  return NextResponse.json(listDecisions());
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as DecisionInput | null;
  if (!body || typeof body.title !== "string" || !body.title.trim()) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }
  return NextResponse.json(createDecision(body), { status: 201 });
}
