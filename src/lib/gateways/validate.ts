import type { GatewayConfigInput } from "./types";

const PROTOCOLS = new Set([
  "openai",
  "anthropic",
  "azure-openai",
  "google-gemini",
  "custom",
  "typesafe-eval",
]);

export function validateGatewayInput(body: unknown): {
  ok: true;
  value: GatewayConfigInput;
} | { ok: false; error: string } {
  if (typeof body !== "object" || body === null) {
    return { ok: false, error: "Request body must be an object" };
  }
  const b = body as Record<string, unknown>;

  if (typeof b.name !== "string" || !b.name.trim()) {
    return { ok: false, error: "name is required" };
  }
  if (typeof b.protocol !== "string" || !PROTOCOLS.has(b.protocol)) {
    return {
      ok: false,
      error: `protocol must be one of ${[...PROTOCOLS].join(", ")}`,
    };
  }
  if (typeof b.baseUrl !== "string" || !b.baseUrl.trim()) {
    return { ok: false, error: "baseUrl is required" };
  }
  if (typeof b.apiKey !== "string") {
    return { ok: false, error: "apiKey is required (use an empty string if none)" };
  }
  if (typeof b.defaultModel !== "string" || !b.defaultModel.trim()) {
    return { ok: false, error: "defaultModel is required" };
  }
  if (b.protocol === "azure-openai") {
    const azure = b.azure as { deployment?: unknown; apiVersion?: unknown } | undefined;
    if (
      !azure ||
      typeof azure.deployment !== "string" ||
      !azure.deployment.trim() ||
      typeof azure.apiVersion !== "string" ||
      !azure.apiVersion.trim()
    ) {
      return {
        ok: false,
        error: "azure.deployment and azure.apiVersion are required for azure-openai",
      };
    }
  }
  if (b.protocol === "custom") {
    const custom = b.custom as
      | {
          method?: unknown;
          url?: unknown;
          headers?: unknown;
          bodyTemplate?: unknown;
          responsePath?: unknown;
        }
      | undefined;
    if (
      !custom ||
      (custom.method !== "GET" && custom.method !== "POST") ||
      typeof custom.url !== "string" ||
      !custom.url.trim() ||
      typeof custom.headers !== "object" ||
      custom.headers === null ||
      typeof custom.bodyTemplate !== "string" ||
      typeof custom.responsePath !== "string" ||
      !custom.responsePath.trim()
    ) {
      return {
        ok: false,
        error:
          "custom.method (GET|POST), custom.url, custom.headers, custom.bodyTemplate, and custom.responsePath are required for custom",
      };
    }
  }

  return { ok: true, value: b as unknown as GatewayConfigInput };
}
