import { NextResponse } from "next/server";
import { getGateway } from "@/lib/gateways/store";
import { listModels } from "@/lib/gateways/adapters/models";
import { resolveCapabilities, resolvePricing } from "@/lib/db/pricing";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const gateway = await getGateway(id);
  if (!gateway) {
    return NextResponse.json({ error: "Gateway not found" }, { status: 404 });
  }

  const result = await listModels(gateway);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  const models = result.models.map((m) => ({
    ...m,
    pricing: resolvePricing(gateway.id, m.id),
    capabilities: resolveCapabilities(m.id) ?? (m.type ? [m.type] : undefined),
  }));
  return NextResponse.json({ models });
}
