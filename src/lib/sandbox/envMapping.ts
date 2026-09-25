import type { GatewayConfig, GatewayProtocol } from "@/lib/gateways/types";

export type SandboxTool = "claude" | "codex" | "copilot";

export type EnvMappingResult =
  | { ok: true; env: Record<string, string>; model: string }
  | { ok: false; error: string };

const COPILOT_PROVIDER_TYPE: Partial<Record<GatewayProtocol, "openai" | "anthropic">> = {
  openai: "openai",
  anthropic: "anthropic",
  "azure-openai": "openai",
};

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, "");
}

export function buildToolEnv(
  tool: SandboxTool,
  gateway: GatewayConfig,
  modelOverride?: string,
): EnvMappingResult {
  const model = modelOverride || gateway.defaultModel;
  const baseUrl = normalizeBaseUrl(gateway.baseUrl);

  if (tool === "claude") {
    if (gateway.protocol !== "anthropic") {
      return {
        ok: false,
        error:
          "Claude Code only supports gateways speaking the Anthropic Messages API (protocol: anthropic).",
      };
    }
    return {
      ok: true,
      model,
      env: {
        ANTHROPIC_BASE_URL: baseUrl,
        ANTHROPIC_AUTH_TOKEN: gateway.apiKey,
        ANTHROPIC_MODEL: model,
        ANTHROPIC_SMALL_FAST_MODEL: model,
      },
    };
  }

  if (tool === "codex") {
    if (gateway.protocol !== "openai" && gateway.protocol !== "azure-openai") {
      return {
        ok: false,
        error: "Codex CLI requires an OpenAI-compatible or Azure OpenAI gateway.",
      };
    }
    return {
      ok: true,
      model,
      env: {
        OPENAI_BASE_URL: baseUrl,
        OPENAI_API_KEY: gateway.apiKey,
      },
    };
  }

  if (tool === "copilot") {
    const providerType = COPILOT_PROVIDER_TYPE[gateway.protocol];
    if (!providerType) {
      return {
        ok: false,
        error:
          "Copilot CLI requires an OpenAI-, Anthropic-, or Azure-OpenAI-compatible gateway.",
      };
    }
    return {
      ok: true,
      model,
      env: {
        COPILOT_PROVIDER_TYPE: providerType,
        COPILOT_PROVIDER_BASE_URL: baseUrl,
        COPILOT_PROVIDER_API_KEY: gateway.apiKey,
        COPILOT_MODEL: model,
      },
    };
  }

  return { ok: false, error: `Unknown tool: ${tool}` };
}
