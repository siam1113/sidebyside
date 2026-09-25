import { withMcpClient } from "./client";
import type { McpServer } from "@/lib/db/mcpServers";
import type { GatewayConfig, RunParams, UsageInfo } from "@/lib/gateways/types";
import { runGatewayWithTools } from "@/lib/gateways/adapters";
import type { ChatMessage, ToolDef } from "@/lib/gateways/adapters/toolTypes";

export type AgentStep =
  | { type: "assistant"; text?: string; toolCalls?: { id: string; name: string; args: unknown }[] }
  | { type: "tool_result"; toolCallId: string; name: string; result: unknown; isError?: boolean };

export interface AgentRunResult {
  success: boolean;
  errorMessage?: string;
  latencyMs: number;
  usage?: UsageInfo;
  steps: AgentStep[];
  finalText?: string;
  turns: number;
  hitMaxTurns: boolean;
}

const DEFAULT_MAX_TURNS = 8;

/** Accumulates UsageInfo across every LLM turn in the loop -- each adapter only reports the
 *  usage for that one call, but the run as a whole spent all of it. */
function addUsage(total: UsageInfo | undefined, turn: UsageInfo | undefined): UsageInfo | undefined {
  if (!turn) return total;
  return {
    promptTokens: (total?.promptTokens ?? 0) + (turn.promptTokens ?? 0),
    completionTokens: (total?.completionTokens ?? 0) + (turn.completionTokens ?? 0),
    totalTokens: (total?.totalTokens ?? 0) + (turn.totalTokens ?? 0),
  };
}

/** Connects to the MCP server once, sends the prompt to the given gateway/model with the
 *  server's tools bound, and executes whatever tools the model calls -- looping until it
 *  returns a plain-text answer, errors, or hits maxTurns. Never throws. */
export async function runMcpAgent(opts: {
  server: McpServer;
  gateway: GatewayConfig;
  model?: string;
  params?: RunParams;
  prompt: string;
  toolNames?: string[];
  maxTurns?: number;
}): Promise<AgentRunResult> {
  const { server, gateway, model, params, prompt, toolNames, maxTurns = DEFAULT_MAX_TURNS } = opts;

  const outcome = await withMcpClient(server, async (client): Promise<Omit<AgentRunResult, "latencyMs">> => {
    const { tools: mcpTools } = await client.listTools();
    const selected = toolNames?.length ? mcpTools.filter((t) => toolNames.includes(t.name)) : mcpTools;
    const tools: ToolDef[] = selected.map((t) => ({
      name: t.name,
      description: t.description,
      inputSchema: t.inputSchema,
    }));

    const messages: ChatMessage[] = [{ role: "user", content: prompt }];
    const steps: AgentStep[] = [];
    let usage: UsageInfo | undefined;
    let turns = 0;

    while (turns < maxTurns) {
      turns++;
      const turn = await runGatewayWithTools(gateway, model, params, messages, tools);
      usage = addUsage(usage, turn.usage);
      if (turn.error) {
        return { success: false, errorMessage: turn.error, steps, usage, turns, hitMaxTurns: false };
      }

      steps.push({ type: "assistant", text: turn.text, toolCalls: turn.toolCalls });
      messages.push({ role: "assistant", text: turn.text, toolCalls: turn.toolCalls });

      if (!turn.toolCalls?.length) {
        return { success: true, steps, usage, finalText: turn.text, turns, hitMaxTurns: false };
      }

      for (const call of turn.toolCalls) {
        const callResult = await client
          .callTool({ name: call.name, arguments: call.args as Record<string, unknown> | undefined })
          .catch((err) => ({ content: [{ type: "text", text: err instanceof Error ? err.message : String(err) }], isError: true }));
        const isError = Boolean((callResult as { isError?: boolean }).isError);
        steps.push({ type: "tool_result", toolCallId: call.id, name: call.name, result: callResult, isError });
        messages.push({ role: "tool", toolCallId: call.id, name: call.name, result: callResult, isError });
      }
    }

    return { success: false, errorMessage: `Stopped after ${maxTurns} turns without a final answer.`, steps, usage, turns, hitMaxTurns: true };
  });

  if (!outcome.ok) {
    return {
      success: false,
      errorMessage: outcome.error,
      latencyMs: outcome.latencyMs,
      steps: [],
      turns: 0,
      hitMaxTurns: false,
    };
  }
  return { ...outcome.value, latencyMs: outcome.latencyMs };
}
