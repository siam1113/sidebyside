import { NextResponse } from "next/server";
import { deleteMcpServer, getMcpServer, listMcpTestRuns } from "@/lib/db/mcpServers";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const server = getMcpServer(id);
  if (!server) return NextResponse.json({ error: "MCP server not found" }, { status: 404 });
  return NextResponse.json({ server, testRuns: listMcpTestRuns(id) });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ok = deleteMcpServer(id);
  if (!ok) return NextResponse.json({ error: "MCP server not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
