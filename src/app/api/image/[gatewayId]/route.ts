import { NextResponse } from "next/server";
import { getGateway } from "@/lib/gateways/store";
import { runImage } from "@/lib/gateways/adapters/images";
import type { ImageRequestBody } from "@/lib/gateways/types";
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

  const body = (await request.json().catch(() => null)) as ImageRequestBody | null;
  if (!body || typeof body.prompt !== "string" || !body.prompt.trim()) {
    return NextResponse.json({ error: "prompt is required" }, { status: 400 });
  }

  const result = await runImage(gateway, body.prompt, body.model, body.size);
  recordRun({
    kind: "image",
    gatewayId: gateway.id,
    gatewayName: gateway.name,
    model: body.model || gateway.defaultModel,
    latencyMs: result.latencyMs,
    success: !result.error,
    errorMessage: result.error,
    promptPreview: previewText(body.prompt),
    responseText: result.error ? undefined : `${result.images.length} image(s) generated`,
  });
  return NextResponse.json(result);
}
