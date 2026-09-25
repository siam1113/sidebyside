import type { ModelInfo } from "./adapters/models";
import type { GatewayConfig } from "./types";

type CacheEntry =
  | { status: "loading"; promise: Promise<ModelInfo[]> }
  | { status: "done"; models: ModelInfo[] }
  | { status: "error"; error: string };

const cache = new Map<string, CacheEntry>();

export interface DraftModelQuery {
  protocol: string;
  baseUrl: string;
  apiKey: string;
  extraHeaders?: Record<string, string>;
  azure?: { deployment: string; apiVersion: string };
}

function draftCacheKey(q: DraftModelQuery): string {
  return `draft:${q.protocol}:${q.baseUrl}:${q.apiKey}:${q.azure?.apiVersion ?? ""}`;
}

function gatewayCacheKey(gatewayId: string): string {
  return `gw:${gatewayId}`;
}

async function loadAndCache(key: string, run: () => Promise<ModelInfo[]>): Promise<ModelInfo[]> {
  const existing = cache.get(key);
  if (existing?.status === "done") return existing.models;
  if (existing?.status === "loading") return existing.promise;

  const promise = run().then(
    (models) => {
      cache.set(key, { status: "done", models });
      return models;
    },
    (err) => {
      const message = err instanceof Error ? err.message : String(err);
      cache.set(key, { status: "error", error: message });
      throw err;
    },
  );
  cache.set(key, { status: "loading", promise });
  return promise;
}

export function invalidateGatewayModels(gatewayId: string): void {
  cache.delete(gatewayCacheKey(gatewayId));
}

export async function fetchModelsForGateway(
  gatewayId: string,
  force = false,
): Promise<ModelInfo[]> {
  const key = gatewayCacheKey(gatewayId);
  if (force) cache.delete(key);
  return loadAndCache(key, async () => {
    const res = await fetch(`/api/gateways/${gatewayId}/models`);
    const body = await res.json();
    if (!res.ok) throw new Error(body.error ?? "Failed to fetch models");
    return (body.models ?? []) as ModelInfo[];
  });
}

/** Fetches models for every target gateway and merges them into one deduped, sorted list --
 *  shared by every playground tab that lets a run span multiple gateways. */
export async function loadMergedModels(
  targets: GatewayConfig[],
  force: boolean,
): Promise<{ models: ModelInfo[]; error: string | null }> {
  const results = await Promise.allSettled(targets.map((gw) => fetchModelsForGateway(gw.id, force)));
  const merged = new Map<string, ModelInfo>();
  const failures: string[] = [];
  results.forEach((r, i) => {
    if (r.status === "fulfilled") {
      r.value.forEach((m) => {
        if (!merged.has(m.id)) merged.set(m.id, m);
      });
    } else {
      failures.push(`${targets[i].name}: ${r.reason instanceof Error ? r.reason.message : String(r.reason)}`);
    }
  });
  const models = [...merged.values()].sort((a, b) => a.id.localeCompare(b.id));
  const error =
    models.length === 0
      ? (failures[0] ?? "No models returned")
      : failures.length > 0
        ? `${failures.length} of ${targets.length} gateways failed to list models`
        : null;
  return { models, error };
}

export async function fetchModelsForDraft(
  query: DraftModelQuery,
  force = false,
): Promise<ModelInfo[]> {
  const key = draftCacheKey(query);
  if (force) cache.delete(key);
  return loadAndCache(key, async () => {
    const res = await fetch("/api/gateways/models", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(query),
    });
    const body = await res.json();
    if (!res.ok) throw new Error(body.error ?? "Failed to fetch models");
    return (body.models ?? []) as ModelInfo[];
  });
}
