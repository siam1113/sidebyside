import type { EmbeddingResult, GatewayConfig, UsageInfo } from "../types";
import { describeHttpError, errorMessage, normalizeBaseUrl, runHttpJson } from "./shared";

interface OpenAiEmbeddingResponse {
  data?: Array<{ embedding?: number[] }>;
  usage?: { prompt_tokens?: number; total_tokens?: number };
}

interface GeminiEmbedResponse {
  embedding?: { values?: number[] };
}

function unsupported(config: GatewayConfig, why: string): EmbeddingResult {
  return { gatewayId: config.id, embedding: [], dimensions: 0, latencyMs: 0, raw: null, error: why };
}

export async function runEmbedding(
  config: GatewayConfig,
  input: string,
  model?: string,
): Promise<EmbeddingResult> {
  const modelId = model || config.defaultModel;
  const baseUrl = normalizeBaseUrl(config.baseUrl);

  try {
    if (config.protocol === "openai") {
      const { res, latencyMs, raw, request, response } = await runHttpJson({
        apiKey: config.apiKey,
        method: "POST",
        url: `${baseUrl}/embeddings`,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.apiKey}`,
          ...config.extraHeaders,
        },
        body: JSON.stringify({ model: modelId, input }),
      });
      if (!res.ok) {
        return {
          gatewayId: config.id,
          embedding: [],
          dimensions: 0,
          latencyMs,
          raw,
          request,
          response,
          error: describeHttpError(res.status, raw),
        };
      }
      const data = raw as OpenAiEmbeddingResponse;
      const embedding = data.data?.[0]?.embedding ?? [];
      const usage: UsageInfo | undefined = data.usage
        ? { promptTokens: data.usage.prompt_tokens, totalTokens: data.usage.total_tokens }
        : undefined;
      return {
        gatewayId: config.id,
        embedding,
        dimensions: embedding.length,
        latencyMs,
        usage,
        raw,
        request,
        response,
      };
    }

    if (config.protocol === "azure-openai") {
      if (!config.azure) return unsupported(config, "Missing Azure deployment/apiVersion configuration");
      const url = `${baseUrl}/openai/deployments/${encodeURIComponent(config.azure.deployment)}/embeddings?api-version=${encodeURIComponent(config.azure.apiVersion)}`;
      const { res, latencyMs, raw, request, response } = await runHttpJson({
        apiKey: config.apiKey,
        method: "POST",
        url,
        headers: { "Content-Type": "application/json", "api-key": config.apiKey, ...config.extraHeaders },
        body: JSON.stringify({ input }),
      });
      if (!res.ok) {
        return {
          gatewayId: config.id,
          embedding: [],
          dimensions: 0,
          latencyMs,
          raw,
          request,
          response,
          error: describeHttpError(res.status, raw),
        };
      }
      const data = raw as OpenAiEmbeddingResponse;
      const embedding = data.data?.[0]?.embedding ?? [];
      const usage: UsageInfo | undefined = data.usage
        ? { promptTokens: data.usage.prompt_tokens, totalTokens: data.usage.total_tokens }
        : undefined;
      return {
        gatewayId: config.id,
        embedding,
        dimensions: embedding.length,
        latencyMs,
        usage,
        raw,
        request,
        response,
      };
    }

    if (config.protocol === "google-gemini") {
      const url = `${baseUrl}/v1beta/models/${encodeURIComponent(modelId)}:embedContent?key=${encodeURIComponent(config.apiKey)}`;
      const { res, latencyMs, raw, request, response } = await runHttpJson({
        apiKey: config.apiKey,
        method: "POST",
        url,
        headers: { "Content-Type": "application/json", ...config.extraHeaders },
        body: JSON.stringify({ content: { parts: [{ text: input }] } }),
      });
      if (!res.ok) {
        return {
          gatewayId: config.id,
          embedding: [],
          dimensions: 0,
          latencyMs,
          raw,
          request,
          response,
          error: describeHttpError(res.status, raw),
        };
      }
      const data = raw as GeminiEmbedResponse;
      const embedding = data.embedding?.values ?? [];
      return { gatewayId: config.id, embedding, dimensions: embedding.length, latencyMs, raw, request, response };
    }

    if (config.protocol === "anthropic") {
      return unsupported(config, "Anthropic doesn't offer an embeddings API.");
    }

    return unsupported(
      config,
      "Custom gateways don't have a standard embeddings shape -- point a request/response template at your provider's embeddings endpoint instead.",
    );
  } catch (err) {
    return { gatewayId: config.id, embedding: [], dimensions: 0, latencyMs: 0, raw: null, error: errorMessage(err) };
  }
}
