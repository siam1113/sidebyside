import { NextResponse } from "next/server";
import { getMcpServer } from "@/lib/db/mcpServers";
import { callMcpTool } from "@/lib/mcp/client";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const server = getMcpServer(id);
  if (!server) return NextResponse.json({ error: "MCP server not found" }, { status: 404 });

  const body = (await request.json().catch(() => null)) as { name?: string; args?: unknown } | null;
  if (!body?.name) return NextResponse.json({ error: "name is required" }, { status: 400 });

  const result = await callMcpTool(server, body.name, body.args);
  return NextResponse.json(result);
}
