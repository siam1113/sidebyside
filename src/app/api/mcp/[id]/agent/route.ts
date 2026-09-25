import { NextResponse } from "next/server";
import { getMcpServer } from "@/lib/db/mcpServers";
import { getGateway } from "@/lib/gateways/store";
import type { RunParams } from "@/lib/gateways/types";
import { runMcpAgent } from "@/lib/mcp/agentLoop";
import { listMcpAgentRuns, recordMcpAgentRun } from "@/lib/db/mcpAgentRuns";

interface AgentRequestBody {
  gatewayId: string;
  model?: string;
  params?: RunParams;
  prompt: string;
  toolNames?: string[];
  maxTurns?: number;
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const server = getMcpServer(id);
  if (!server) return NextResponse.json({ error: "MCP server not found" }, { status: 404 });

  const body = (await request.json().catch(() => null)) as AgentRequestBody | null;
  if (!body?.gatewayId) return NextResponse.json({ error: "gatewayId is required" }, { status: 400 });
  if (!body.prompt?.trim()) return NextResponse.json({ error: "prompt is required" }, { status: 400 });

  const gateway = await getGateway(body.gatewayId);
  if (!gateway) return NextResponse.json({ error: "Gateway not found" }, { status: 404 });

  const result = await runMcpAgent({
    server,
    gateway,
    model: body.model,
    params: body.params,
    prompt: body.prompt,
    toolNames: body.toolNames,
    maxTurns: body.maxTurns,
  });

  const run = recordMcpAgentRun({
    serverId: id,
    gatewayId: gateway.id,
    gatewayName: gateway.name,
    model: body.model,
    params: body.params,
    prompt: body.prompt,
    toolNames: body.toolNames,
    success: result.success,
    errorMessage: result.errorMessage,
    latencyMs: result.latencyMs,
    usage: result.usage,
    steps: result.steps,
    finalText: result.finalText,
    turns: result.turns,
    hitMaxTurns: result.hitMaxTurns,
  });
  return NextResponse.json(run);
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return NextResponse.json(listMcpAgentRuns(id));
}
