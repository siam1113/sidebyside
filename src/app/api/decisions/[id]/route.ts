import { NextResponse } from "next/server";
import { deleteDecision, getDecision, updateDecision, type DecisionInput } from "@/lib/db/decisions";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const decision = getDecision(id);
  if (!decision) return NextResponse.json({ error: "Decision not found" }, { status: 404 });
  return NextResponse.json(decision);
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await request.json().catch(() => null)) as DecisionInput | null;
  if (!body || typeof body.title !== "string" || !body.title.trim()) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }
  const updated = updateDecision(id, body);
  if (!updated) return NextResponse.json({ error: "Decision not found" }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ok = deleteDecision(id);
  if (!ok) return NextResponse.json({ error: "Decision not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
