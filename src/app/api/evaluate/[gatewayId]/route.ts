import { NextResponse } from "next/server";
import { getGateway } from "@/lib/gateways/store";
import { runEvaluation } from "@/lib/gateways/adapters/evaluation";
import type { EvalRequestBody } from "@/lib/gateways/types";
import { previewText, recordRun } from "@/lib/db/runHistory";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ gatewayId: string }> },
) {
  const { gatewayId } = await params;
  const gateway = await getGateway(gatewayId);
  if (!gateway) {
    return NextResponse.json({ error: "Gateway not found" }, { status: 404 });
  }

  const body = (await request.json().catch(() => null)) as EvalRequestBody | null;
  if (!body || typeof body.state !== "string" || !body.state.trim()) {
    return NextResponse.json({ error: "state is required" }, { status: 400 });
  }
  if (!body.questions || Object.keys(body.questions).length === 0) {
    return NextResponse.json({ error: "at least one question is required" }, { status: 400 });
  }

  const result = await runEvaluation(gateway, body.state, body.questions, body.model);
  recordRun({
    kind: "evaluate",
    gatewayId: gateway.id,
    gatewayName: gateway.name,
    model: body.model || gateway.defaultModel,
    latencyMs: result.latencyMs,
    success: !result.error,
    errorMessage: result.error,
    promptPreview: previewText(body.state),
    responseText: result.error ? undefined : previewText(JSON.stringify(result.answers)),
    usage: result.usage,
  });
  return NextResponse.json(result);
}
