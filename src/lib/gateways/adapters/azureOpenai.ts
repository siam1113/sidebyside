import type { Attachment, GatewayConfig, RunParams, RunResult, UsageInfo } from "../types";
import { describeHttpError, errorMessage, normalizeBaseUrl, runHttpJson } from "./shared";
import { getModelMeta } from "./models";
import { buildOpenAiUserContent } from "./attachments";
import type { ChatMessage, ToolCallRequest, ToolDef, ToolTurnResult } from "./toolTypes";

interface AzureOpenAiResponse {
  choices?: Array<{ message?: { content?: string } }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
}

interface AzureToolCall {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
}

interface AzureToolMessage {
  role: "system" | "user" | "assistant" | "tool";
  content?: string | null;
  tool_calls?: AzureToolCall[];
  tool_call_id?: string;
}

interface AzureToolResponse {
  choices?: Array<{ message?: { content?: string | null; tool_calls?: AzureToolCall[] } }>;
  usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
}

/** Same message-array shape as openai.ts -- Azure OpenAI's chat.completions API is
 *  wire-compatible with OpenAI's, just reached through a deployment-scoped URL. */
function toAzureMessages(messages: ChatMessage[], systemPrompt?: string): AzureToolMessage[] {
  const result: AzureToolMessage[] = [];
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

function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

// See openai.ts: some OpenAI-compatible gateways default the requested
// output length to the model's full context window when max_tokens is
// omitted, then reject that as exceeding the same context window.
const DEFAULT_MAX_TOKENS = 1024;

export async function run(
  config: GatewayConfig,
  prompt: string,
  params?: RunParams,
  attachments?: Attachment[],
): Promise<RunResult> {
  if (!config.azure) {
    return {
      gatewayId: config.id,
      text: "",
      latencyMs: 0,
      raw: null,
      error: "Missing Azure deployment/apiVersion configuration",
    };
  }
  const { deployment, apiVersion } = config.azure;
  const meta = getModelMeta(config.baseUrl, deployment);
  const { content, warnings } = buildOpenAiUserContent(prompt, attachments);
  const url = `${normalizeBaseUrl(config.baseUrl)}/openai/deployments/${encodeURIComponent(
    deployment,
  )}/chat/completions?api-version=${encodeURIComponent(apiVersion)}`;
  try {
    const { res, latencyMs, raw, request, response } = await runHttpJson({
      apiKey: config.apiKey,
      method: "POST",
      url,
      headers: {
        "Content-Type": "application/json",
        "api-key": config.apiKey,
        ...config.extraHeaders,
      },
      body: JSON.stringify({
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
    const data = raw as AzureOpenAiResponse;
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
  _model: string | undefined,
  params: RunParams | undefined,
  messages: ChatMessage[],
  tools: ToolDef[],
): Promise<ToolTurnResult> {
  if (!config.azure) {
    return { latencyMs: 0, raw: null, error: "Missing Azure deployment/apiVersion configuration" };
  }
  const { deployment, apiVersion } = config.azure;
  const meta = getModelMeta(config.baseUrl, deployment);
  const url = `${normalizeBaseUrl(config.baseUrl)}/openai/deployments/${encodeURIComponent(
    deployment,
  )}/chat/completions?api-version=${encodeURIComponent(apiVersion)}`;
  try {
    const { res, latencyMs, raw, request, response } = await runHttpJson({
      apiKey: config.apiKey,
      method: "POST",
      url,
      headers: {
        "Content-Type": "application/json",
        "api-key": config.apiKey,
        ...config.extraHeaders,
      },
      body: JSON.stringify({
        messages: toAzureMessages(messages, params?.systemPrompt),
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
    const data = raw as AzureToolResponse;
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
