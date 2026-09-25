import type { GatewayConfig, RunParams, RunResult } from "@/lib/gateways/types";

/** Shared shape for any "run this against N gateways" flow -- chat, embeddings, images, evaluation. */
export type AsyncState<T> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "done"; result: T }
  | { status: "error"; message: string };

export type RunState = AsyncState<RunResult>;

/** One cell's full result history -- length 1 normally, length N when the repeat axis is on
 *  (N independent runs of the same request, shown aggregated rather than as separate columns).
 *  Generic so every "run this against N gateways" tab (chat, embeddings, images, evaluation)
 *  can reuse the same cell/aggregation machinery over its own result shape. */
export type CellResults<T = RunResult> = AsyncState<T>[];

/** Independent axes the base prompt/params can be varied along -- any combination can be
 *  enabled at once. "repeat" multiplies how many times each (gateway, model, variant) cell
 *  runs -- it does not fork into separate cells like the others; see CellResults. */
export type VariantAxisKind = "repeat" | "prompts" | "systemPrompts" | "paramSweep";

export interface RepeatAggregate {
  total: number;
  succeeded: number;
  failed: number;
  anyLoading: boolean;
  avgLatencyMs: number | null;
  minLatencyMs: number | null;
  maxLatencyMs: number | null;
}

/** Summarizes a cell's repeat runs for display -- success rate and latency spread. Generic over
 *  any result shape that at least carries a latency and an optional error (every tab's result
 *  type does). Tab-specific extras (e.g. chat's token totals) are computed separately by the
 *  caller and shown alongside this, since usage shapes differ per tab. */
export function aggregateRunStates<T extends { latencyMs: number; error?: string }>(
  states: CellResults<T>,
): RepeatAggregate {
  const succeededStates = states.filter(
    (s): s is Extract<AsyncState<T>, { status: "done" }> => s.status === "done" && !s.result.error,
  );
  const failed = states.filter((s) => s.status === "error" || (s.status === "done" && Boolean(s.result.error))).length;
  const latencies = succeededStates.map((s) => s.result.latencyMs);
  return {
    total: states.length,
    succeeded: succeededStates.length,
    failed,
    anyLoading: states.some((s) => s.status === "loading"),
    avgLatencyMs: latencies.length ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length) : null,
    minLatencyMs: latencies.length ? Math.min(...latencies) : null,
    maxLatencyMs: latencies.length ? Math.max(...latencies) : null,
  };
}

/** One variation of the base prompt/RunParams -- a repeat run, an alternate prompt, a system
 *  prompt, or a swept param value. */
export interface RunVariant {
  id: string;
  /** Empty for the default (no-variant) case -- nothing extra to show next to the gateway/model. */
  label: string;
  /** Replaces the base prompt entirely when set (prompt-variants mode). */
  promptOverride?: string;
  paramsOverride?: Partial<RunParams>;
}

export const DEFAULT_VARIANT: RunVariant = { id: "default", label: "" };

/** One (gateway, model, variant) triple to run and compare -- a single column/tab in the results view. */
export interface RunCell {
  key: string;
  gateway: GatewayConfig;
  modelId: string;
  variant: RunVariant;
}

export function cellKey(gatewayId: string, modelId: string, variantId: string): string {
  return `${gatewayId}::${modelId}::${variantId}`;
}
