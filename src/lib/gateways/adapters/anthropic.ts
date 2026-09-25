import type { Attachment, GatewayConfig, RunParams, RunResult, UsageInfo } from "../types";
import { describeHttpError, errorMessage, normalizeBaseUrl, runHttpJson } from "./shared";
import { buildAnthropicUserContent } from "./attachments";
import type { ChatMessage, ToolCallRequest, ToolDef, ToolTurnResult } from "./toolTypes";

interface AnthropicResponse {
  content?: Array<{ type?: string; text?: string }>;
  usage?: { input_tokens?: number; output_tokens?: number };
}

interface AnthropicContentBlock {
  type: "text" | "tool_use" | "tool_result";
  text?: string;
  id?: string;
  name?: string;
  input?: unknown;
  tool_use_id?: string;
  content?: string;
  is_error?: boolean;
}

interface AnthropicMessage {
  role: "user" | "assistant";
  content: string | AnthropicContentBlock[];
}

interface AnthropicToolResponse {
  content?: AnthropicContentBlock[];
  usage?: { input_tokens?: number; output_tokens?: number };
}

/** Re-serializes the agent loop's provider-agnostic history into Anthropic's messages format --
 *  consecutive tool results get merged into a single user turn with multiple tool_result blocks,
 *  since Anthropic expects one turn per role rather than one message per tool call. */
function toAnthropicMessages(messages: ChatMessage[]): AnthropicMessage[] {
  const result: AnthropicMessage[] = [];
  for (const msg of messages) {
    if (msg.role === "user") {
      result.push({ role: "user", content: msg.content });
      continue;
    }
    if (msg.role === "assistant") {
      const content: AnthropicContentBlock[] = [];
      if (msg.text) content.push({ type: "text", text: msg.text });
      for (const tc of msg.toolCalls ?? []) {
        content.push({ type: "tool_use", id: tc.id, name: tc.name, input: tc.args });
      }
      result.push({ role: "assistant", content });
      continue;
    }
    const block: AnthropicContentBlock = {
      type: "tool_result",
      tool_use_id: msg.toolCallId,
      content: typeof msg.result === "string" ? msg.result : JSON.stringify(msg.result),
      ...(msg.isError ? { is_error: true } : {}),
    };
    const last = result[result.length - 1];
    if (last?.role === "user" && Array.isArray(last.content) && last.content.every((b) => b.type === "tool_result")) {
      last.content.push(block);
    } else {
      result.push({ role: "user", content: [block] });
    }
  }
  return result;
}

export async function run(
  config: GatewayConfig,
  prompt: string,
  model?: string,
  params?: RunParams,
  attachments?: Attachment[],
): Promise<RunResult> {
  const { content, warnings } = buildAnthropicUserContent(prompt, attachments);
  const url = `${normalizeBaseUrl(config.baseUrl)}/v1/messages`;
  try {
    const { res, latencyMs, raw, request, response } = await runHttpJson({
      apiKey: config.apiKey,
      method: "POST",
      url,
      headers: {
        "Content-Type": "application/json",
        "x-api-key": config.apiKey,
        "anthropic-version": "2023-06-01",
        ...config.extraHeaders,
      },
      body: JSON.stringify({
        model: model || config.defaultModel,
        max_tokens: params?.maxTokens || 1024,
        messages: [{ role: "user", content }],
        ...(params?.systemPrompt ? { system: params.systemPrompt } : {}),
        ...(params?.temperature != null ? { temperature: params.temperature } : {}),
        ...(params?.topP != null ? { top_p: params.topP } : {}),
        ...(params?.stopSequences?.length ? { stop_sequences: params.stopSequences } : {}),
      }),
    });
    if (!res.ok) {
      return {
        gatewayId: config.id,
        text: "",
        latencyMs,
        raw,
        request,
        response,
        error: describeHttpError(res.status, raw),
      };
    }
    const data = raw as AnthropicResponse;
    const text =
      data.content?.find((block) => block.type === "text")?.text ??
      data.content?.[0]?.text ??
      "";
    const usage: UsageInfo | undefined = data.usage
      ? {
          promptTokens: data.usage.input_tokens,
          completionTokens: data.usage.output_tokens,
          totalTokens:
            (data.usage.input_tokens ?? 0) + (data.usage.output_tokens ?? 0),
        }
      : undefined;
    return {
      gatewayId: config.id,
      text,
      latencyMs,
      usage,
      raw,
      request,
      response,
      warnings: warnings.length ? warnings : undefined,
    };
  } catch (err) {
    return {
      gatewayId: config.id,
      text: "",
      latencyMs: 0,
      raw: null,
      error: errorMessage(err),
    };
  }
}

export async function runWithTools(
  config: GatewayConfig,
  model: string | undefined,
  params: RunParams | undefined,
  messages: ChatMessage[],
  tools: ToolDef[],
): Promise<ToolTurnResult> {
  const url = `${normalizeBaseUrl(config.baseUrl)}/v1/messages`;
  try {
    const { res, latencyMs, raw, request, response } = await runHttpJson({
      apiKey: config.apiKey,
      method: "POST",
      url,
      headers: {
        "Content-Type": "application/json",
        "x-api-key": config.apiKey,
        "anthropic-version": "2023-06-01",
        ...config.extraHeaders,
      },
      body: JSON.stringify({
        model: model || config.defaultModel,
        max_tokens: params?.maxTokens || 1024,
        messages: toAnthropicMessages(messages),
        tools: tools.map((t) => ({ name: t.name, description: t.description, input_schema: t.inputSchema })),
        ...(params?.systemPrompt ? { system: params.systemPrompt } : {}),
        ...(params?.temperature != null ? { temperature: params.temperature } : {}),
        ...(params?.topP != null ? { top_p: params.topP } : {}),
        ...(params?.stopSequences?.length ? { stop_sequences: params.stopSequences } : {}),
      }),
    });
    if (!res.ok) {
      return { latencyMs, raw, request, response, error: describeHttpError(res.status, raw) };
    }
    const data = raw as AnthropicToolResponse;
    const text = data.content
      ?.filter((b) => b.type === "text")
      .map((b) => b.text ?? "")
      .join("");
    const toolCalls: ToolCallRequest[] =
      data.content
        ?.filter((b) => b.type === "tool_use")
        .map((b) => ({ id: b.id ?? "", name: b.name ?? "", args: b.input })) ?? [];
    const usage: UsageInfo | undefined = data.usage
      ? {
          promptTokens: data.usage.input_tokens,
          completionTokens: data.usage.output_tokens,
          totalTokens: (data.usage.input_tokens ?? 0) + (data.usage.output_tokens ?? 0),
        }
      : undefined;
    return {
      text: text || undefined,
      toolCalls: toolCalls.length ? toolCalls : undefined,
      latencyMs,
      usage,
      raw,
      request,
      response,
    };
  } catch (err) {
    return { latencyMs: 0, raw: null, error: errorMessage(err) };
  }
}
