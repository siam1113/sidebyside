import { NextResponse } from "next/server";
import { clearManualOverride, setManualOverride } from "@/lib/db/pricing";

interface OverrideBody {
  gatewayId: string;
  modelId: string;
  promptPer1M?: number;
  completionPer1M?: number;
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as OverrideBody | null;
  if (!body || typeof body.gatewayId !== "string" || typeof body.modelId !== "string") {
    return NextResponse.json({ error: "gatewayId and modelId are required" }, { status: 400 });
  }
  setManualOverride(body.gatewayId, body.modelId, body.promptPer1M, body.completionPer1M);
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const body = (await request.json().catch(() => null)) as Pick<OverrideBody, "gatewayId" | "modelId"> | null;
  if (!body || typeof body.gatewayId !== "string" || typeof body.modelId !== "string") {
    return NextResponse.json({ error: "gatewayId and modelId are required" }, { status: 400 });
  }
  clearManualOverride(body.gatewayId, body.modelId);
  return NextResponse.json({ ok: true });
}
