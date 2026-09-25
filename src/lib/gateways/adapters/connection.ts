import type { AzureOptions, ConnectionTestResult, GatewayProtocol } from "../types";
import { errorMessage, normalizeBaseUrl, timedFetch } from "./shared";
import { listModels } from "./models";

export interface ConnectionTestQuery {
  protocol: GatewayProtocol;
  baseUrl: string;
  apiKey: string;
  extraHeaders?: Record<string, string>;
  azure?: AzureOptions;
}

/**
 * Custom gateways don't have a models-listing endpoint (the whole point is
 * that only the user knows the shape of their API), so the best we can do
 * without spending money on the user's completion endpoint is a plain GET
 * against the base URL -- reachability, not auth/shape validation.
 */
async function testCustomReachability(baseUrl: string, checkedAt: string): Promise<ConnectionTestResult> {
  try {
    const { res, latencyMs } = await timedFetch(normalizeBaseUrl(baseUrl), { method: "GET" }, 10_000);
    return {
      ok: res.status < 500,
      message: res.status < 500 ? `Base URL reachable (HTTP ${res.status})` : `Server error (HTTP ${res.status})`,
      latencyMs,
      checkedAt,
    };
  } catch (err) {
    return { ok: false, message: errorMessage(err), latencyMs: 0, checkedAt };
  }
}

export async function testConnection(query: ConnectionTestQuery): Promise<ConnectionTestResult> {
  const checkedAt = new Date().toISOString();

  if (query.protocol === "custom") {
    return testCustomReachability(query.baseUrl, checkedAt);
  }

  const start = performance.now();
  const result = await listModels(query);
  const latencyMs = Math.round(performance.now() - start);

  if ("error" in result) {
    return { ok: false, message: result.error, latencyMs, checkedAt };
  }
  return {
    ok: true,
    message: `${result.models.length} model${result.models.length === 1 ? "" : "s"} available`,
    modelCount: result.models.length,
    latencyMs,
    checkedAt,
  };
}
