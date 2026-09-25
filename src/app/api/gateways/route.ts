import { NextResponse } from "next/server";
import { createGateway, listGateways } from "@/lib/gateways/store";
import { validateGatewayInput } from "@/lib/gateways/validate";

export async function GET() {
  const gateways = await listGateways();
  return NextResponse.json(gateways);
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const result = validateGatewayInput(body);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  const gateway = await createGateway(result.value);
  return NextResponse.json(gateway, { status: 201 });
}
