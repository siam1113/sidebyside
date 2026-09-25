import { NextResponse } from "next/server";
import { testConnection } from "@/lib/gateways/adapters/connection";
import type { AzureOptions, GatewayProtocol } from "@/lib/gateways/types";

const PROTOCOLS = new Set<GatewayProtocol>([
  "openai",
  "anthropic",
  "azure-openai",
  "google-gemini",
  "custom",
  "typesafe-eval",
]);

/**
 * Tests a gateway that hasn't been saved yet -- takes the draft form fields
 * directly rather than an id, mirroring /api/gateways/models.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "Request body must be an object" }, { status: 400 });
  }
  const b = body as Record<string, unknown>;

  if (typeof b.protocol !== "string" || !PROTOCOLS.has(b.protocol as GatewayProtocol)) {
    return NextResponse.json(
      { error: `protocol must be one of ${[...PROTOCOLS].join(", ")}` },
      { status: 400 },
    );
  }
  if (typeof b.baseUrl !== "string" || !b.baseUrl.trim()) {
    return NextResponse.json({ error: "baseUrl is required" }, { status: 400 });
  }

  const result = await testConnection({
    protocol: b.protocol as GatewayProtocol,
    baseUrl: b.baseUrl,
    apiKey: typeof b.apiKey === "string" ? b.apiKey : "",
    extraHeaders: (b.extraHeaders as Record<string, string> | undefined) ?? undefined,
    azure: (b.azure as AzureOptions | undefined) ?? undefined,
  });

  return NextResponse.json(result);
}
