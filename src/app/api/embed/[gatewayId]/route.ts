import { NextResponse } from "next/server";
import { getGateway } from "@/lib/gateways/store";
import { runEmbedding } from "@/lib/gateways/adapters/embeddings";
import type { EmbedRequestBody } from "@/lib/gateways/types";
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

  const body = (await request.json().catch(() => null)) as EmbedRequestBody | null;
  if (!body || typeof body.input !== "string" || !body.input.trim()) {
    return NextResponse.json({ error: "input is required" }, { status: 400 });
  }

  const result = await runEmbedding(gateway, body.input, body.model);
  recordRun({
    kind: "embed",
    gatewayId: gateway.id,
    gatewayName: gateway.name,
    model: body.model || gateway.defaultModel,
    latencyMs: result.latencyMs,
    success: !result.error,
    errorMessage: result.error,
    promptPreview: previewText(body.input),
    responseText: result.error ? undefined : `${result.dimensions} dimensions`,
    usage: result.usage,
  });
  return NextResponse.json(result);
}
