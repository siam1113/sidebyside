import { NextResponse } from "next/server";
import { createMcpServer, listMcpServers, type McpServerInput } from "@/lib/db/mcpServers";

export async function GET() {
  return NextResponse.json(listMcpServers());
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as McpServerInput | null;
  if (!body || typeof body.name !== "string" || !body.name.trim()) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }
  if (body.transport !== "stdio" && body.transport !== "http") {
    return NextResponse.json({ error: "transport must be 'stdio' or 'http'" }, { status: 400 });
  }
  if (body.transport === "stdio" && !body.command?.trim()) {
    return NextResponse.json({ error: "command is required for stdio servers" }, { status: 400 });
  }
  if (body.transport === "http" && !body.url?.trim()) {
    return NextResponse.json({ error: "url is required for http servers" }, { status: 400 });
  }
  return NextResponse.json(createMcpServer(body), { status: 201 });
}
