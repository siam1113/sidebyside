import { randomUUID } from "node:crypto";
import { getDb } from "./client";
import type { AgentStep } from "@/lib/mcp/agentLoop";
import type { RunParams, UsageInfo } from "@/lib/gateways/types";

export interface McpAgentRunInput {
  serverId: string;
  gatewayId: string;
  gatewayName: string;
  model?: string;
  params?: RunParams;
  prompt: string;
  toolNames?: string[];
  success: boolean;
  errorMessage?: string;
  latencyMs?: number;
  usage?: UsageInfo;
  steps: AgentStep[];
  finalText?: string;
  turns?: number;
  hitMaxTurns?: boolean;
}

export interface McpAgentRun extends McpAgentRunInput {
  id: string;
  createdAt: string;
}

interface McpAgentRunRow {
  id: string;
  server_id: string;
  gateway_id: string;
  gateway_name: string;
  model: string | null;
  params: string | null;
  prompt: string;
  tool_names: string | null;
  success: number;
  error_message: string | null;
  latency_ms: number | null;
  usage: string | null;
  steps: string | null;
  final_text: string | null;
  turns: number | null;
  hit_max_turns: number | null;
  created_at: string;
}

function rowToRun(row: McpAgentRunRow): McpAgentRun {
  return {
    id: row.id,
    serverId: row.server_id,
    gatewayId: row.gateway_id,
    gatewayName: row.gateway_name,
    model: row.model ?? undefined,
    params: row.params ? JSON.parse(row.params) : undefined,
    prompt: row.prompt,
    toolNames: row.tool_names ? JSON.parse(row.tool_names) : undefined,
    success: Boolean(row.success),
    errorMessage: row.error_message ?? undefined,
    latencyMs: row.latency_ms ?? undefined,
    usage: row.usage ? JSON.parse(row.usage) : undefined,
    steps: row.steps ? JSON.parse(row.steps) : [],
    finalText: row.final_text ?? undefined,
    turns: row.turns ?? undefined,
    hitMaxTurns: row.hit_max_turns != null ? Boolean(row.hit_max_turns) : undefined,
    createdAt: row.created_at,
  };
}

export function recordMcpAgentRun(input: McpAgentRunInput): McpAgentRun {
  const id = randomUUID();
  const createdAt = new Date().toISOString();
  getDb()
    .prepare(
      `INSERT INTO mcp_agent_runs
        (id, server_id, gateway_id, gateway_name, model, params, prompt, tool_names,
         success, error_message, latency_ms, usage, steps, final_text, turns, hit_max_turns, created_at)
       VALUES
        (@id, @serverId, @gatewayId, @gatewayName, @model, @params, @prompt, @toolNames,
         @success, @errorMessage, @latencyMs, @usage, @steps, @finalText, @turns, @hitMaxTurns, @createdAt)`,
    )
    .run({
      id,
      serverId: input.serverId,
      gatewayId: input.gatewayId,
      gatewayName: input.gatewayName,
      model: input.model ?? null,
      params: input.params ? JSON.stringify(input.params) : null,
      prompt: input.prompt,
      toolNames: input.toolNames ? JSON.stringify(input.toolNames) : null,
      success: input.success ? 1 : 0,
      errorMessage: input.errorMessage ?? null,
      latencyMs: input.latencyMs ?? null,
      usage: input.usage ? JSON.stringify(input.usage) : null,
      steps: JSON.stringify(input.steps),
      finalText: input.finalText ?? null,
      turns: input.turns ?? null,
      hitMaxTurns: input.hitMaxTurns != null ? (input.hitMaxTurns ? 1 : 0) : null,
      createdAt,
    });
  return { ...input, id, createdAt };
}

export function listMcpAgentRuns(serverId: string, limit = 20): McpAgentRun[] {
  const rows = getDb()
    .prepare(`SELECT * FROM mcp_agent_runs WHERE server_id = ? ORDER BY created_at DESC LIMIT ?`)
    .all(serverId, limit) as McpAgentRunRow[];
  return rows.map(rowToRun);
}
