import { listModels } from "./adapters/models";
import { recordLatencySample } from "@/lib/db/latency";
import type { GatewayConfig } from "./types";

/** Pings a gateway with a model-list call (no completion cost) and records the result to the Latency dashboard. */
export async function pingGateway(gateway: GatewayConfig): Promise<void> {
  const start = Date.now();
  const result = await listModels(gateway);
  const latencyMs = Date.now() - start;
  recordLatencySample({
    gatewayId: gateway.id,
    gatewayName: gateway.name,
    latencyMs,
    success: !("error" in result),
    errorMessage: "error" in result ? result.error : undefined,
  });
}

export async function pingEnabledGateways(gateways: GatewayConfig[]): Promise<void> {
  const enabled = gateways.filter((g) => g.healthCheckEnabled);
  await Promise.all(enabled.map((g) => pingGateway(g)));
}
