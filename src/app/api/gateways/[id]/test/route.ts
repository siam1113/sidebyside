import { NextResponse } from "next/server";
import { getGateway } from "@/lib/gateways/store";
import { testConnection } from "@/lib/gateways/adapters/connection";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const gateway = await getGateway(id);
  if (!gateway) {
    return NextResponse.json({ error: "Gateway not found" }, { status: 404 });
  }

  const result = await testConnection(gateway);
  return NextResponse.json(result);
}
