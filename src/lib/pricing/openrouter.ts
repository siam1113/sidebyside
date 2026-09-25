export interface OpenRouterModelPrice {
  modelId: string;
  promptPer1M?: number;
  completionPer1M?: number;
  /** Modality/tool-support tags, e.g. "text", "image", "audio", "tool". */
  capabilities: string[];
}

interface OpenRouterModel {
  id?: string;
  pricing?: { prompt?: string; completion?: string };
  architecture?: { input_modalities?: string[]; output_modalities?: string[] };
  supported_parameters?: string[];
}

function perTokenToPer1M(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return undefined;
  return Math.round(n * 1_000_000 * 1_000_000) / 1_000_000;
}

/** Modalities the model reads/writes, plus "tool" when it supports function calling. */
function deriveCapabilities(m: OpenRouterModel): string[] {
  const tags = new Set<string>([
    ...(m.architecture?.input_modalities ?? []),
    ...(m.architecture?.output_modalities ?? []),
  ]);
  if (m.supported_parameters?.includes("tools")) tags.add("tool");
  return Array.from(tags).sort();
}

/** Fetches OpenRouter's public model/pricing catalog -- no auth required. */
export async function fetchOpenRouterCatalog(): Promise<OpenRouterModelPrice[]> {
  const res = await fetch("https://openrouter.ai/api/v1/models", {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    throw new Error(`OpenRouter models request failed: ${res.status} ${res.statusText}`);
  }
  const body = (await res.json()) as { data?: OpenRouterModel[] };
  return (body.data ?? [])
    .filter((m): m is OpenRouterModel & { id: string } => Boolean(m.id))
    .map((m) => ({
      modelId: m.id,
      promptPer1M: perTokenToPer1M(m.pricing?.prompt),
      completionPer1M: perTokenToPer1M(m.pricing?.completion),
      capabilities: deriveCapabilities(m),
    }));
}
