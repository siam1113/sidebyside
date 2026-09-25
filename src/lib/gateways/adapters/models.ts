import type { AzureOptions, GatewayProtocol } from "../types";
import { describeHttpError, errorMessage, normalizeBaseUrl, timedFetch } from "./shared";

export interface ModelListQuery {
  protocol: GatewayProtocol;
  baseUrl: string;
  apiKey: string;
  extraHeaders?: Record<string, string>;
  azure?: AzureOptions;
}

export interface ModelInfo {
  id: string;
  /** Human-readable name, only set when it differs from id. */
  label?: string;
  /** Short free-form tag, e.g. "owned by openai" or deployment status. */
  meta?: string;
  description?: string;
  contextLength?: number;
  /** Max output/completion tokens this model will accept in a single request. */
  maxOutputTokens?: number;
  /** e.g. "language", "embedding", "evaluation", "image" -- only "language" models can run chat completions. */
  type?: string;
  /** Populated by the Cost Calculator (src/lib/pricing); absent until pricing has been fetched/entered for this model. */
  pricing?: {
    promptPer1M?: number;
    completionPer1M?: number;
    currency: string;
    source: "openrouter" | "manual";
    fetchedAt: string;
  };
  /** Modality/tool-support tags (e.g. "text", "image", "audio", "tool") resolved against the OpenRouter
   *  catalog by model id; falls back to `type` when no OpenRouter match exists. */
  capabilities?: string[];
}

export type ModelListResult = { models: ModelInfo[] } | { error: string };

interface CachedModelMeta {
  contextLength?: number;
  maxOutputTokens?: number;
  type?: string;
}

/**
 * Metadata keyed by baseUrl+modelId, populated whenever listModels() runs.
 * Run adapters consult this so completion requests match what the model
 * actually supports (output token cap, language vs. non-language type)
 * instead of guessing -- see the 40960-output-tokens / "evaluation model"
 * gateway errors this was added to fix.
 */
const modelMetaCache = new Map<string, CachedModelMeta>();

function cacheKey(baseUrl: string, modelId: string): string {
  return `${normalizeBaseUrl(baseUrl)}::${modelId}`;
}

export function getModelMeta(baseUrl: string, modelId: string): CachedModelMeta | undefined {
  return modelMetaCache.get(cacheKey(baseUrl, modelId));
}

function cacheModels(baseUrl: string, models: ModelInfo[]): void {
  for (const m of models) {
    modelMetaCache.set(cacheKey(baseUrl, m.id), {
      contextLength: m.contextLength,
      maxOutputTokens: m.maxOutputTokens,
      type: m.type,
    });
  }
}

async function fetchJson(
  url: string,
  headers: Record<string, string>,
): Promise<{ ok: true; data: unknown } | { ok: false; error: string }> {
  try {
    const { res } = await timedFetch(url, { method: "GET", headers }, 15_000);
    const raw = await res.json().catch(() => null);
    if (!res.ok) return { ok: false, error: describeHttpError(res.status, raw) };
    return { ok: true, data: raw };
  } catch (err) {
    return { ok: false, error: errorMessage(err) };
  }
}

function labelIfDifferent(id: string, candidate?: string): string | undefined {
  return candidate && candidate !== id ? candidate : undefined;
}

export async function listModels(query: ModelListQuery): Promise<ModelListResult> {
  const baseUrl = normalizeBaseUrl(query.baseUrl);

  switch (query.protocol) {
    case "openai": {
      const result = await fetchJson(`${baseUrl}/models`, {
        Authorization: `Bearer ${query.apiKey}`,
        ...query.extraHeaders,
      });
      if (!result.ok) return { error: result.error };
      const data = result.data as {
        data?: Array<{
          id?: string;
          name?: string;
          owned_by?: string;
          context_window?: number;
          max_tokens?: number;
          type?: string;
          description?: string;
        }>;
      };
      const models: ModelInfo[] = (data.data ?? [])
        .filter((m): m is typeof m & { id: string } => Boolean(m.id))
        .map((m) => ({
          id: m.id,
          label: labelIfDifferent(m.id, m.name),
          meta: m.owned_by ? `owned by ${m.owned_by}` : undefined,
          description: m.description,
          contextLength: m.context_window,
          maxOutputTokens: m.max_tokens,
          type: m.type,
        }))
        .sort((a, b) => a.id.localeCompare(b.id));
      cacheModels(baseUrl, models);
      return { models };
    }

    case "anthropic": {
      const result = await fetchJson(`${baseUrl}/v1/models`, {
        "x-api-key": query.apiKey,
        "anthropic-version": "2023-06-01",
        ...query.extraHeaders,
      });
      if (!result.ok) return { error: result.error };
      const data = result.data as { data?: Array<{ id?: string; display_name?: string }> };
      const models: ModelInfo[] = (data.data ?? [])
        .filter((m): m is typeof m & { id: string } => Boolean(m.id))
        .map((m) => ({ id: m.id, label: labelIfDifferent(m.id, m.display_name) }));
      return { models };
    }

    case "azure-openai": {
      if (!query.azure?.apiVersion) {
        return { error: "Set an API version before fetching deployments" };
      }
      const result = await fetchJson(
        `${baseUrl}/openai/deployments?api-version=${encodeURIComponent(query.azure.apiVersion)}`,
        { "api-key": query.apiKey, ...query.extraHeaders },
      );
      if (!result.ok) return { error: result.error };
      const data = result.data as {
        data?: Array<{ id?: string; model?: string; status?: string }>;
      };
      const models: ModelInfo[] = (data.data ?? [])
        .filter((m): m is typeof m & { id: string } => Boolean(m.id))
        .map((m) => ({
          id: m.id,
          label: m.model,
          meta: m.status,
        }))
        .sort((a, b) => a.id.localeCompare(b.id));
      return { models };
    }

    case "google-gemini": {
      const result = await fetchJson(
        `${baseUrl}/v1beta/models?key=${encodeURIComponent(query.apiKey)}`,
        { ...query.extraHeaders },
      );
      if (!result.ok) return { error: result.error };
      const data = result.data as {
        models?: Array<{
          name?: string;
          displayName?: string;
          description?: string;
          inputTokenLimit?: number;
          outputTokenLimit?: number;
          supportedGenerationMethods?: string[];
        }>;
      };
      const models: ModelInfo[] = (data.models ?? [])
        .filter(
          (m) =>
            !m.supportedGenerationMethods ||
            m.supportedGenerationMethods.includes("generateContent"),
        )
        .flatMap((m): ModelInfo[] => {
          const id = m.name?.replace(/^models\//, "");
          if (!id) return [];
          return [
            {
              id,
              label: labelIfDifferent(id, m.displayName),
              description: m.description,
              contextLength: m.inputTokenLimit,
              maxOutputTokens: m.outputTokenLimit,
            },
          ];
        })
        .sort((a, b) => a.id.localeCompare(b.id));
      cacheModels(baseUrl, models);
      return { models };
    }

    case "custom":
      return { error: "Custom gateways don't support model listing" };

    case "typesafe-eval": {
      const result = await fetchJson(`${baseUrl}/v1/models`, {
        Authorization: `Bearer ${query.apiKey}`,
        ...query.extraHeaders,
      });
      if (!result.ok) return { error: result.error };
      const data = result.data as {
        data?: Array<{
          id?: string;
          name?: string;
          owned_by?: string;
          context_window?: number;
          max_tokens?: number;
          description?: string;
        }>;
      };
      const models: ModelInfo[] = (data.data ?? [])
        .filter((m): m is typeof m & { id: string } => Boolean(m.id))
        .map((m) => ({
          id: m.id,
          label: labelIfDifferent(m.id, m.name),
          meta: m.owned_by ? `owned by ${m.owned_by}` : undefined,
          description: m.description,
          contextLength: m.context_window,
          maxOutputTokens: m.max_tokens,
          type: "evaluation",
        }))
        .sort((a, b) => a.id.localeCompare(b.id));
      cacheModels(baseUrl, models);
      return { models };
    }

    default: {
      const exhaustive: never = query.protocol;
      return { error: `Unknown protocol: ${exhaustive}` };
    }
  }
}
