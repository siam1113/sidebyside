import type { Attachment, GatewayConfig, RunParams, RunResult } from "../types";
import { attachmentAsText, formatAttachmentForPrompt } from "./attachments";
import {
  describeHttpError,
  errorMessage,
  getByPath,
  interpolate,
  runHttpJson,
} from "./shared";

export async function run(
  config: GatewayConfig,
  prompt: string,
  model?: string,
  params?: RunParams,
  attachments?: Attachment[],
): Promise<RunResult> {
  if (!config.custom) {
    return {
      gatewayId: config.id,
      text: "",
      latencyMs: 0,
      raw: null,
      error: "Missing custom adapter configuration",
    };
  }
  // Custom gateways have no stable content-block shape to inject media into -- fold
  // text-like attachments into the {{prompt}} placeholder and warn about the rest.
  const warnings: string[] = [];
  let promptWithAttachments = prompt;
  for (const att of attachments ?? []) {
    const asText = attachmentAsText(att);
    if (asText != null) {
      promptWithAttachments += `\n\n${formatAttachmentForPrompt(att)}`;
    } else {
      warnings.push(
        `Attachment "${att.name}" (${att.mimeType}) can't be sent through a custom body template and was left out of the request -- only text-like files are folded into {{prompt}}.`,
      );
    }
  }

  const { method, url, headers, bodyTemplate, responsePath } = config.custom;
  const vars = {
    baseUrl: config.baseUrl,
    apiKey: config.apiKey,
    prompt: promptWithAttachments,
    model: model || config.defaultModel,
    // Not guaranteed to apply -- only takes effect if the body template
    // references one of these placeholders.
    temperature: params?.temperature != null ? String(params.temperature) : "",
    maxTokens: params?.maxTokens != null ? String(params.maxTokens) : "",
    topP: params?.topP != null ? String(params.topP) : "",
    systemPrompt: params?.systemPrompt ?? "",
    stopSequences: params?.stopSequences?.join(",") ?? "",
  };
  const resolvedUrl = interpolate(url, vars);
  const resolvedHeaders: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
    resolvedHeaders[key] = interpolate(value, vars);
  }

  try {
    const { res, latencyMs, raw, request, response } = await runHttpJson({
      apiKey: config.apiKey,
      method,
      url: resolvedUrl,
      headers:
        method === "GET"
          ? resolvedHeaders
          : { "Content-Type": "application/json", ...resolvedHeaders },
      body: method === "GET" ? undefined : interpolate(bodyTemplate, vars),
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
    const extracted = getByPath(raw, responsePath);
    const text = typeof extracted === "string" ? extracted : JSON.stringify(extracted);
    return { gatewayId: config.id, text, latencyMs, raw, request, response, warnings: warnings.length ? warnings : undefined };
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
