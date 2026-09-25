import { randomUUID } from "node:crypto";
import { getDb } from "./client";

export interface RecordLatencySampleInput {
  gatewayId: string;
  gatewayName: string;
  latencyMs?: number;
  success: boolean;
  errorMessage?: string;
}

export function recordLatencySample(input: RecordLatencySampleInput): void {
  getDb()
    .prepare(
      `INSERT INTO latency_samples (id, gateway_id, gateway_name, latency_ms, success, error_message, created_at)
       VALUES (@id, @gatewayId, @gatewayName, @latencyMs, @success, @errorMessage, @createdAt)`,
    )
    .run({
      id: randomUUID(),
      gatewayId: input.gatewayId,
      gatewayName: input.gatewayName,
      latencyMs: input.latencyMs ?? null,
      success: input.success ? 1 : 0,
      errorMessage: input.errorMessage ?? null,
      createdAt: new Date().toISOString(),
    });
}

export interface LatencyPoint {
  latencyMs: number | null;
  success: boolean;
  createdAt: string;
  source: "usage" | "heartbeat";
}

export interface GatewayLatencySummary {
  gatewayId: string;
  gatewayName: string;
  sampleCount: number;
  successRate: number;
  p50: number | null;
  p95: number | null;
  points: LatencyPoint[];
}

function percentile(sorted: number[], p: number): number | null {
  if (sorted.length === 0) return null;
  const idx = Math.min(sorted.length - 1, Math.floor(p * sorted.length));
  return sorted[idx];
}

/** Combines real-usage latency (run_history) and synthetic heartbeats (latency_samples) into one per-gateway summary. */
export function summarizeLatency(sinceIso: string): GatewayLatencySummary[] {
  const db = getDb();
  const usageRows = db
    .prepare(
      `SELECT gateway_id, gateway_name, latency_ms, success, created_at
       FROM run_history WHERE created_at >= ? ORDER BY created_at ASC`,
    )
    .all(sinceIso) as { gateway_id: string; gateway_name: string; latency_ms: number | null; success: number; created_at: string }[];
  const heartbeatRows = db
    .prepare(
      `SELECT gateway_id, gateway_name, latency_ms, success, created_at
       FROM latency_samples WHERE created_at >= ? ORDER BY created_at ASC`,
    )
    .all(sinceIso) as { gateway_id: string; gateway_name: string; latency_ms: number | null; success: number; created_at: string }[];

  const byGateway = new Map<string, GatewayLatencySummary>();

  function ensure(gatewayId: string, gatewayName: string): GatewayLatencySummary {
    let entry = byGateway.get(gatewayId);
    if (!entry) {
      entry = { gatewayId, gatewayName, sampleCount: 0, successRate: 0, p50: null, p95: null, points: [] };
      byGateway.set(gatewayId, entry);
    }
    return entry;
  }

  for (const r of usageRows) {
    ensure(r.gateway_id, r.gateway_name).points.push({
      latencyMs: r.latency_ms,
      success: Boolean(r.success),
      createdAt: r.created_at,
      source: "usage",
    });
  }
  for (const r of heartbeatRows) {
    ensure(r.gateway_id, r.gateway_name).points.push({
      latencyMs: r.latency_ms,
      success: Boolean(r.success),
      createdAt: r.created_at,
      source: "heartbeat",
    });
  }

  for (const entry of byGateway.values()) {
    entry.points.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    entry.sampleCount = entry.points.length;
    entry.successRate = entry.points.filter((p) => p.success).length / entry.points.length;
    const latencies = entry.points
      .filter((p) => p.success && p.latencyMs != null)
      .map((p) => p.latencyMs!)
      .sort((a, b) => a - b);
    entry.p50 = percentile(latencies, 0.5);
    entry.p95 = percentile(latencies, 0.95);
  }

  return [...byGateway.values()].sort((a, b) => a.gatewayName.localeCompare(b.gatewayName));
}
