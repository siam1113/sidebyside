import { randomUUID } from "node:crypto";
import { getDb } from "./client";
import type { OpenRouterModelPrice } from "@/lib/pricing/openrouter";

export interface PricingInfo {
  promptPer1M?: number;
  completionPer1M?: number;
  currency: string;
  source: "openrouter" | "manual";
  fetchedAt: string;
}

interface PricingRow {
  model_id: string;
  prompt_per_1m: number | null;
  completion_per_1m: number | null;
  currency: string;
  source: "openrouter" | "manual";
  fetched_at: string;
  capabilities: string | null;
}

function rowToInfo(row: PricingRow): PricingInfo {
  return {
    promptPer1M: row.prompt_per_1m ?? undefined,
    completionPer1M: row.completion_per_1m ?? undefined,
    currency: row.currency,
    source: row.source,
    fetchedAt: row.fetched_at,
  };
}

/** Replaces the entire OpenRouter pricing catalog with a fresh fetch. */
export function replaceCatalog(entries: OpenRouterModelPrice[]): void {
  const db = getDb();
  const fetchedAt = new Date().toISOString();
  const tx = db.transaction((rows: OpenRouterModelPrice[]) => {
    db.prepare(`DELETE FROM model_pricing WHERE source = 'openrouter'`).run();
    const insert = db.prepare(
      `INSERT INTO model_pricing (id, source, gateway_id, model_id, prompt_per_1m, completion_per_1m, currency, fetched_at, capabilities)
       VALUES (@id, 'openrouter', NULL, @modelId, @promptPer1M, @completionPer1M, 'USD', @fetchedAt, @capabilities)`,
    );
    for (const row of rows) {
      insert.run({
        id: randomUUID(),
        modelId: row.modelId,
        promptPer1M: row.promptPer1M ?? null,
        completionPer1M: row.completionPer1M ?? null,
        fetchedAt,
        capabilities: row.capabilities.length > 0 ? JSON.stringify(row.capabilities) : null,
      });
    }
  });
  tx(entries);
  catalogNormCache = null;
}

export function setManualOverride(
  gatewayId: string,
  modelId: string,
  promptPer1M: number | undefined,
  completionPer1M: number | undefined,
): void {
  const db = getDb();
  db.prepare(
    `INSERT INTO model_pricing (id, source, gateway_id, model_id, prompt_per_1m, completion_per_1m, currency, fetched_at)
     VALUES (@id, 'manual', @gatewayId, @modelId, @promptPer1M, @completionPer1M, 'USD', @fetchedAt)
     ON CONFLICT(gateway_id, model_id) WHERE source = 'manual'
     DO UPDATE SET prompt_per_1m = excluded.prompt_per_1m,
                   completion_per_1m = excluded.completion_per_1m,
                   fetched_at = excluded.fetched_at`,
  ).run({
    id: randomUUID(),
    gatewayId,
    modelId,
    promptPer1M: promptPer1M ?? null,
    completionPer1M: completionPer1M ?? null,
    fetchedAt: new Date().toISOString(),
  });
}

export function clearManualOverride(gatewayId: string, modelId: string): void {
  getDb()
    .prepare(`DELETE FROM model_pricing WHERE source = 'manual' AND gateway_id = ? AND model_id = ?`)
    .run(gatewayId, modelId);
}

/** Suffix after the last "/", alphanumeric-only and lowercased, for cross-catalog fuzzy matching. */
function normalizeModelId(id: string): string {
  const suffix = id.split("/").pop() ?? id;
  return suffix.toLowerCase().replace(/[^a-z0-9]/g, "");
}

let catalogNormCache: { modelId: string; norm: string }[] | null = null;

function catalogNormalized(db: ReturnType<typeof getDb>): { modelId: string; norm: string }[] {
  if (catalogNormCache) return catalogNormCache;
  const rows = db
    .prepare(`SELECT model_id FROM model_pricing WHERE source = 'openrouter'`)
    .all() as { model_id: string }[];
  catalogNormCache = rows.map((r) => ({ modelId: r.model_id, norm: normalizeModelId(r.model_id) }));
  return catalogNormCache;
}

/** Exact, then fuzzy (last path segment, alphanumeric-only) match against the OpenRouter catalog. */
function findOpenRouterRow(db: ReturnType<typeof getDb>, modelId: string): PricingRow | undefined {
  const exact = db
    .prepare(`SELECT * FROM model_pricing WHERE source = 'openrouter' AND model_id = ?`)
    .get(modelId) as PricingRow | undefined;
  if (exact) return exact;

  const norm = normalizeModelId(modelId);
  const match = catalogNormalized(db).find((c) => c.norm === norm);
  if (!match) return undefined;
  return db
    .prepare(`SELECT * FROM model_pricing WHERE source = 'openrouter' AND model_id = ?`)
    .get(match.modelId) as PricingRow | undefined;
}

/** Manual override (if any) wins; otherwise an exact or fuzzy match against the OpenRouter catalog. */
export function resolvePricing(gatewayId: string, modelId: string): PricingInfo | undefined {
  const db = getDb();

  const manual = db
    .prepare(`SELECT * FROM model_pricing WHERE source = 'manual' AND gateway_id = ? AND model_id = ?`)
    .get(gatewayId, modelId) as PricingRow | undefined;
  if (manual) return rowToInfo(manual);

  const row = findOpenRouterRow(db, modelId);
  return row ? rowToInfo(row) : undefined;
}

/** Modality/tool-support tags for a model, resolved against the OpenRouter catalog (exact or fuzzy id match). */
export function resolveCapabilities(modelId: string): string[] | undefined {
  const row = findOpenRouterRow(getDb(), modelId);
  if (!row?.capabilities) return undefined;
  try {
    return JSON.parse(row.capabilities) as string[];
  } catch {
    return undefined;
  }
}
