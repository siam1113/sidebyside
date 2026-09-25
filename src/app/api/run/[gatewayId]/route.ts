import { NextResponse } from "next/server";
import { getGateway } from "@/lib/gateways/store";
import { runGateway } from "@/lib/gateways/adapters";
import type { RunRequestBody } from "@/lib/gateways/types";
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

  const body = (await request.json().catch(() => null)) as RunRequestBody | null;
  if (!body || typeof body.prompt !== "string" || (!body.prompt.trim() && !body.attachments?.length)) {
    return NextResponse.json({ error: "prompt or an attachment is required" }, { status: 400 });
  }

  const result = await runGateway(gateway, body.prompt, body.model, body.params, body.attachments);
  recordRun({
    kind: "chat",
    gatewayId: gateway.id,
    gatewayName: gateway.name,
    model: body.model || gateway.defaultModel,
    latencyMs: result.latencyMs,
    success: !result.error,
    errorMessage: result.error,
    promptPreview: previewText(body.prompt),
    responseText: result.text ? previewText(result.text) : undefined,
    usage: result.usage,
  });
  return NextResponse.json(result);
}
