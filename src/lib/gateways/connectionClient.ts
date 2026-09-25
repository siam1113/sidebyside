import type { ConnectionTestResult } from "./types";
import type { DraftModelQuery } from "./modelsClient";

export async function testGatewayConnection(gatewayId: string): Promise<ConnectionTestResult> {
  const res = await fetch(`/api/gateways/${gatewayId}/test`);
  const body = await res.json();
  if (!res.ok) throw new Error(body.error ?? "Connection test failed");
  return body as ConnectionTestResult;
}

export async function testDraftConnection(query: DraftModelQuery): Promise<ConnectionTestResult> {
  const res = await fetch("/api/gateways/test", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(query),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error ?? "Connection test failed");
  return body as ConnectionTestResult;
}
