import type { Attachment, GatewayConfig, RunParams, RunResult, UsageInfo } from "../types";
import { describeHttpError, errorMessage, normalizeBaseUrl, runHttpJson } from "./shared";
import { getModelMeta } from "./models";
import { buildOpenAiUserContent } from "./attachments";
import type { ChatMessage, ToolCallRequest, ToolDef, ToolTurnResult } from "./toolTypes";

interface OpenAiResponse {
  choices?: Array<{ message?: { content?: string } }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
}

interface OpenAiToolCall {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
}

interface OpenAiToolMessage {
  role: "system" | "user" | "assistant" | "tool";
  content?: string | null;
  tool_calls?: OpenAiToolCall[];
  tool_call_id?: string;
}

interface OpenAiToolResponse {
  choices?: Array<{ message?: { content?: string | null; tool_calls?: OpenAiToolCall[] } }>;
  usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
}

/** Re-serializes the agent loop's provider-agnostic history into OpenAI's chat.completions
 *  message array -- one message per turn, tool results keyed by tool_call_id. */
function toOpenAiMessages(messages: ChatMessage[], systemPrompt?: string): OpenAiToolMessage[] {
  const result: OpenAiToolMessage[] = [];
  if (systemPrompt) result.push({ role: "system", content: systemPrompt });
  for (const msg of messages) {
    if (msg.role === "user") {
      result.push({ role: "user", content: msg.content });
    } else if (msg.role === "assistant") {
      result.push({
        role: "assistant",
        content: msg.text ?? null,
        tool_calls: msg.toolCalls?.length
          ? msg.toolCalls.map((tc) => ({
              id: tc.id,
              type: "function",
              function: { name: tc.name, arguments: JSON.stringify(tc.args ?? {}) },
            }))
          : undefined,
      });
    } else {
      result.push({
        role: "tool",
        tool_call_id: msg.toolCallId,
        content: typeof msg.result === "string" ? msg.result : JSON.stringify(msg.result),
      });
    }
  }
  return result;
}

// Fallback when a model's real max-output-tokens isn't known yet (no
// successful listModels() call has cached it). Some OpenAI-compatible
// gateways silently default the requested output length to the model's full
// context window when max_tokens is omitted, which then gets rejected as
// exceeding that same context window -- always sending an explicit cap
// avoids that class of 400.
const DEFAULT_MAX_TOKENS = 1024;

export async function run(
  config: GatewayConfig,
  prompt: string,
  model?: string,
  params?: RunParams,
  attachments?: Attachment[],
): Promise<RunResult> {
  const modelId = model || config.defaultModel;
  const meta = getModelMeta(config.baseUrl, modelId);
  if (meta?.type && meta.type !== "language") {
    return {
      gatewayId: config.id,
      text: "",
      latencyMs: 0,
      raw: null,
      error: `Model '${modelId}' is a${/^[aeiou]/i.test(meta.type) ? "n" : ""} ${meta.type} model, not a language model -- pick a chat-capable model to run a completion.`,
    };
  }

  const { content, warnings } = buildOpenAiUserContent(prompt, attachments);
  const url = `${normalizeBaseUrl(config.baseUrl)}/chat/completions`;
  try {
    const { res, latencyMs, raw, request, response } = await runHttpJson({
      apiKey: config.apiKey,
      method: "POST",
      url,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
        ...config.extraHeaders,
      },
      body: JSON.stringify({
        model: modelId,
        messages: params?.systemPrompt
          ? [{ role: "system", content: params.systemPrompt }, { role: "user", content }]
          : [{ role: "user", content }],
        max_tokens: params?.maxTokens || meta?.maxOutputTokens || DEFAULT_MAX_TOKENS,
        ...(params?.temperature != null ? { temperature: params.temperature } : {}),
        ...(params?.topP != null ? { top_p: params.topP } : {}),
        ...(params?.stopSequences?.length ? { stop: params.stopSequences } : {}),
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
    const data = raw as OpenAiResponse;
    const text = data.choices?.[0]?.message?.content ?? "";
    const usage: UsageInfo | undefined = data.usage
      ? {
          promptTokens: data.usage.prompt_tokens,
          completionTokens: data.usage.completion_tokens,
          totalTokens: data.usage.total_tokens,
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
  const modelId = model || config.defaultModel;
  const meta = getModelMeta(config.baseUrl, modelId);
  const url = `${normalizeBaseUrl(config.baseUrl)}/chat/completions`;
  try {
    const { res, latencyMs, raw, request, response } = await runHttpJson({
      apiKey: config.apiKey,
      method: "POST",
      url,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
        ...config.extraHeaders,
      },
      body: JSON.stringify({
        model: modelId,
        messages: toOpenAiMessages(messages, params?.systemPrompt),
        tools: tools.map((t) => ({
          type: "function",
          function: { name: t.name, description: t.description, parameters: t.inputSchema },
        })),
        max_tokens: params?.maxTokens || meta?.maxOutputTokens || DEFAULT_MAX_TOKENS,
        ...(params?.temperature != null ? { temperature: params.temperature } : {}),
        ...(params?.topP != null ? { top_p: params.topP } : {}),
        ...(params?.stopSequences?.length ? { stop: params.stopSequences } : {}),
      }),
    });
    if (!res.ok) {
      return { latencyMs, raw, request, response, error: describeHttpError(res.status, raw) };
    }
    const data = raw as OpenAiToolResponse;
    const message = data.choices?.[0]?.message;
    const toolCalls: ToolCallRequest[] =
      message?.tool_calls?.map((tc) => ({
        id: tc.id,
        name: tc.function.name,
        args: safeJsonParse(tc.function.arguments),
      })) ?? [];
    const usage: UsageInfo | undefined = data.usage
      ? {
          promptTokens: data.usage.prompt_tokens,
          completionTokens: data.usage.completion_tokens,
          totalTokens: data.usage.total_tokens,
        }
      : undefined;
    return {
      text: message?.content || undefined,
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

function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
