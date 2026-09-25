import { NextResponse } from "next/server";
import { getMcpServer, recordMcpTestRun } from "@/lib/db/mcpServers";
import { probeMcpServer } from "@/lib/mcp/client";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const server = getMcpServer(id);
  if (!server) return NextResponse.json({ error: "MCP server not found" }, { status: 404 });

  const result = await probeMcpServer(server);
  const run = recordMcpTestRun({
    serverId: id,
    success: result.success,
    errorMessage: result.errorMessage,
    latencyMs: result.latencyMs,
    tools: result.tools,
    resources: result.resources,
    prompts: result.prompts,
  });
  return NextResponse.json(run);
}
