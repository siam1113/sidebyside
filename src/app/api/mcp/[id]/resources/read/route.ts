import { NextResponse } from "next/server";
import { getMcpServer } from "@/lib/db/mcpServers";
import { readMcpResource } from "@/lib/mcp/client";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const server = getMcpServer(id);
  if (!server) return NextResponse.json({ error: "MCP server not found" }, { status: 404 });

  const body = (await request.json().catch(() => null)) as { uri?: string } | null;
  if (!body?.uri) return NextResponse.json({ error: "uri is required" }, { status: 400 });

  const result = await readMcpResource(server, body.uri);
  return NextResponse.json(result);
}
