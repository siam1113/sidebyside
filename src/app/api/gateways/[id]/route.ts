import { NextResponse } from "next/server";
import { deleteGateway, updateGateway } from "@/lib/gateways/store";
import { validateGatewayInput } from "@/lib/gateways/validate";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const result = validateGatewayInput(body);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  const gateway = await updateGateway(id, result.value);
  if (!gateway) {
    return NextResponse.json({ error: "Gateway not found" }, { status: 404 });
  }
  return NextResponse.json(gateway);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const deleted = await deleteGateway(id);
  if (!deleted) {
    return NextResponse.json({ error: "Gateway not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
