import type { Attachment, GatewayConfig, RunParams, RunResult, UsageInfo } from "../types";
import { describeHttpError, errorMessage, normalizeBaseUrl, runHttpJson } from "./shared";
import { getModelMeta } from "./models";
import { buildGeminiParts } from "./attachments";
import type { ChatMessage, ToolCallRequest, ToolDef, ToolTurnResult } from "./toolTypes";

interface GeminiResponsePart {
  text?: string;
  inlineData?: { data?: string; mimeType?: string };
}

interface GeminiResponse {
  candidates?: Array<{ content?: { parts?: GeminiResponsePart[] } }>;
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    totalTokenCount?: number;
  };
}

interface GeminiPart {
  text?: string;
  functionCall?: { name: string; args?: unknown };
  functionResponse?: { name: string; response: unknown };
  /** Gemini 3's signed-reasoning receipt for a function call -- must be echoed back verbatim
   *  alongside the same functionCall part on the next turn, or the API rejects the request. */
  thoughtSignature?: string;
}

interface GeminiContent {
  role: "user" | "model";
  parts: GeminiPart[];
}

interface GeminiToolResponse {
  candidates?: Array<{ content?: { parts?: GeminiPart[] } }>;
  usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number; totalTokenCount?: number };
}

/** MCP tool input schemas are plain JSON Schema and often carry a top-level `$schema` key
 *  (e.g. draft-07's `$schema: "http://json-schema.org/draft-07/schema#"`) -- Gemini's function
 *  declaration `parameters` field is a stricter OpenAPI-style subset that rejects any field it
 *  doesn't recognize, `$schema` included, so it has to be stripped before sending. */
function sanitizeSchemaForGemini(schema: unknown): unknown {
  if (Array.isArray(schema)) return schema.map(sanitizeSchemaForGemini);
  if (schema && typeof schema === "object") {
    const { $schema: _drop, ...rest } = schema as Record<string, unknown>;
    return Object.fromEntries(Object.entries(rest).map(([k, v]) => [k, sanitizeSchemaForGemini(v)]));
  }
  return schema;
}

/** Re-serializes the agent loop's provider-agnostic history into Gemini's contents array --
 *  assistant turns become role "model"; tool results go back as role "user" carrying
 *  functionResponse parts (Gemini has no separate "function" role -- sending one is rejected
 *  with "Role 'function' is not supported"), merging consecutive results into one turn the same
 *  way Anthropic's tool_result blocks get merged. */
function toGeminiContents(messages: ChatMessage[]): GeminiContent[] {
  const result: GeminiContent[] = [];
  for (const msg of messages) {
    if (msg.role === "user") {
      result.push({ role: "user", parts: [{ text: msg.content }] });
      continue;
    }
    if (msg.role === "assistant") {
      const parts: GeminiPart[] = [];
      if (msg.text) parts.push({ text: msg.text });
      for (const tc of msg.toolCalls ?? []) {
        const meta = tc.providerMeta as { thoughtSignature?: string } | undefined;
        parts.push({ functionCall: { name: tc.name, args: tc.args }, thoughtSignature: meta?.thoughtSignature });
      }
      result.push({ role: "model", parts });
      continue;
    }
    const response = msg.result && typeof msg.result === "object" ? (msg.result as object) : { result: msg.result };
    const part: GeminiPart = { functionResponse: { name: msg.name, response } };
    const last = result[result.length - 1];
    if (last?.role === "user" && last.parts.every((p) => p.functionResponse)) {
      last.parts.push(part);
    } else {
      result.push({ role: "user", parts: [part] });
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
  const modelId = model || config.defaultModel;
  const meta = getModelMeta(config.baseUrl, modelId);
  const url = `${normalizeBaseUrl(config.baseUrl)}/v1beta/models/${encodeURIComponent(
    modelId,
  )}:generateContent?key=${encodeURIComponent(config.apiKey)}`;

  const generationConfig: Record<string, unknown> = {};
  if (params?.maxTokens != null) generationConfig.maxOutputTokens = params.maxTokens;
  else if (meta?.maxOutputTokens) generationConfig.maxOutputTokens = meta.maxOutputTokens;
  if (params?.temperature != null) generationConfig.temperature = params.temperature;
  if (params?.topP != null) generationConfig.topP = params.topP;
  if (params?.stopSequences?.length) generationConfig.stopSequences = params.stopSequences;

  const { parts, warnings } = buildGeminiParts(prompt, attachments);

  try {
    const { res, latencyMs, raw, request, response } = await runHttpJson({
      apiKey: config.apiKey,
      method: "POST",
      url,
      headers: {
        "Content-Type": "application/json",
        ...config.extraHeaders,
      },
      body: JSON.stringify({
        contents: [{ parts }],
        ...(params?.systemPrompt
          ? { systemInstruction: { parts: [{ text: params.systemPrompt }] } }
          : {}),
        ...(Object.keys(generationConfig).length ? { generationConfig } : {}),
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
    const data = raw as GeminiResponse;
    const responseParts = data.candidates?.[0]?.content?.parts ?? [];
    const text = responseParts.map((p) => p.text ?? "").join("");
    const images = responseParts
      .map((p) => (p.inlineData?.data ? `data:${p.inlineData.mimeType || "image/png"};base64,${p.inlineData.data}` : null))
      .filter((x): x is string => Boolean(x));
    const usage: UsageInfo | undefined = data.usageMetadata
      ? {
          promptTokens: data.usageMetadata.promptTokenCount,
          completionTokens: data.usageMetadata.candidatesTokenCount,
          totalTokens: data.usageMetadata.totalTokenCount,
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
      images: images.length ? images : undefined,
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
  const url = `${normalizeBaseUrl(config.baseUrl)}/v1beta/models/${encodeURIComponent(
    modelId,
  )}:generateContent?key=${encodeURIComponent(config.apiKey)}`;

  const generationConfig: Record<string, unknown> = {};
  if (params?.maxTokens != null) generationConfig.maxOutputTokens = params.maxTokens;
  else if (meta?.maxOutputTokens) generationConfig.maxOutputTokens = meta.maxOutputTokens;
  if (params?.temperature != null) generationConfig.temperature = params.temperature;
  if (params?.topP != null) generationConfig.topP = params.topP;
  if (params?.stopSequences?.length) generationConfig.stopSequences = params.stopSequences;

  try {
    const { res, latencyMs, raw, request, response } = await runHttpJson({
      apiKey: config.apiKey,
      method: "POST",
      url,
      headers: {
        "Content-Type": "application/json",
        ...config.extraHeaders,
      },
      body: JSON.stringify({
        contents: toGeminiContents(messages),
        tools: [
          {
            functionDeclarations: tools.map((t) => ({
              name: t.name,
              description: t.description,
              parameters: sanitizeSchemaForGemini(t.inputSchema),
            })),
          },
        ],
        ...(params?.systemPrompt ? { systemInstruction: { parts: [{ text: params.systemPrompt }] } } : {}),
        ...(Object.keys(generationConfig).length ? { generationConfig } : {}),
      }),
    });
    if (!res.ok) {
      return { latencyMs, raw, request, response, error: describeHttpError(res.status, raw) };
    }
    const data = raw as GeminiToolResponse;
    const parts = data.candidates?.[0]?.content?.parts ?? [];
    const text = parts
      .filter((p) => p.text != null)
      .map((p) => p.text ?? "")
      .join("");
    const toolCalls: ToolCallRequest[] = parts
      .filter((p) => p.functionCall)
      .map((p, i) => ({
        id: `fc-${i}`,
        name: p.functionCall!.name,
        args: p.functionCall!.args,
        providerMeta: p.thoughtSignature ? { thoughtSignature: p.thoughtSignature } : undefined,
      }));
    const usage: UsageInfo | undefined = data.usageMetadata
      ? {
          promptTokens: data.usageMetadata.promptTokenCount,
          completionTokens: data.usageMetadata.candidatesTokenCount,
          totalTokens: data.usageMetadata.totalTokenCount,
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
