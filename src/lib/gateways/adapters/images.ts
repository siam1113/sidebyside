import type { GatewayConfig, ImageResult } from "../types";
import { describeHttpError, errorMessage, normalizeBaseUrl, runHttpJson } from "./shared";

interface OpenAiImageResponse {
  data?: Array<{ url?: string; b64_json?: string }>;
}

function extractImages(data: OpenAiImageResponse): string[] {
  return (data.data ?? [])
    .map((d) => (d.url ? d.url : d.b64_json ? `data:image/png;base64,${d.b64_json}` : null))
    .filter((x): x is string => Boolean(x));
}

interface ImagenResponse {
  predictions?: Array<{ bytesBase64Encoded?: string; mimeType?: string }>;
}

function extractImagenImages(data: ImagenResponse): string[] {
  return (data.predictions ?? [])
    .map((p) => (p.bytesBase64Encoded ? `data:${p.mimeType || "image/png"};base64,${p.bytesBase64Encoded}` : null))
    .filter((x): x is string => Boolean(x));
}

interface GeminiGenerateResponse {
  candidates?: Array<{ content?: { parts?: Array<{ inlineData?: { data?: string; mimeType?: string } }> } }>;
}

function extractGeminiInlineImages(data: GeminiGenerateResponse): string[] {
  return (data.candidates ?? [])
    .flatMap((c) => c.content?.parts ?? [])
    .map((p) => (p.inlineData?.data ? `data:${p.inlineData.mimeType || "image/png"};base64,${p.inlineData.data}` : null))
    .filter((x): x is string => Boolean(x));
}

/** Imagen's `parameters.aspectRatio` takes a ratio, not pixels -- map the size
 *  select's OpenAI-shaped options onto the closest ratio it accepts. */
function sizeToAspectRatio(size?: string): string | undefined {
  switch (size) {
    case "1792x1024":
      return "16:9";
    case "1024x1792":
      return "9:16";
    case "1024x1024":
      return "1:1";
    default:
      return undefined;
  }
}

function unsupported(config: GatewayConfig, why: string): ImageResult {
  return { gatewayId: config.id, images: [], latencyMs: 0, raw: null, error: why };
}

export async function runImage(
  config: GatewayConfig,
  prompt: string,
  model?: string,
  size?: string,
): Promise<ImageResult> {
  const modelId = model || config.defaultModel;
  const baseUrl = normalizeBaseUrl(config.baseUrl);

  try {
    if (config.protocol === "openai") {
      const { res, latencyMs, raw, request, response } = await runHttpJson({
        apiKey: config.apiKey,
        method: "POST",
        url: `${baseUrl}/images/generations`,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.apiKey}`,
          ...config.extraHeaders,
        },
        body: JSON.stringify({ model: modelId, prompt, n: 1, size: size || "1024x1024" }),
      });
      if (!res.ok) {
        return { gatewayId: config.id, images: [], latencyMs, raw, request, response, error: describeHttpError(res.status, raw) };
      }
      const images = extractImages(raw as OpenAiImageResponse);
      return { gatewayId: config.id, images, latencyMs, raw, request, response };
    }

    if (config.protocol === "azure-openai") {
      if (!config.azure) return unsupported(config, "Missing Azure deployment/apiVersion configuration");
      const url = `${baseUrl}/openai/deployments/${encodeURIComponent(config.azure.deployment)}/images/generations?api-version=${encodeURIComponent(config.azure.apiVersion)}`;
      const { res, latencyMs, raw, request, response } = await runHttpJson({
        apiKey: config.apiKey,
        method: "POST",
        url,
        headers: { "Content-Type": "application/json", "api-key": config.apiKey, ...config.extraHeaders },
        body: JSON.stringify({ prompt, n: 1, size: size || "1024x1024" }),
      });
      if (!res.ok) {
        return { gatewayId: config.id, images: [], latencyMs, raw, request, response, error: describeHttpError(res.status, raw) };
      }
      const images = extractImages(raw as OpenAiImageResponse);
      return { gatewayId: config.id, images, latencyMs, raw, request, response };
    }

    if (config.protocol === "anthropic") {
      return unsupported(config, "Anthropic doesn't offer an image generation API.");
    }

    if (config.protocol === "google-gemini") {
      const aspectRatio = sizeToAspectRatio(size);

      // Standalone Imagen models expose a Vertex-style `:predict` endpoint (instances/predictions).
      // Gemini's own image-capable models (the "-image" family, e.g. Nano Banana) instead generate
      // images through the ordinary `:generateContent` call, returned as inlineData parts.
      if (/^imagen/i.test(modelId)) {
        const url = `${baseUrl}/v1beta/models/${encodeURIComponent(modelId)}:predict?key=${encodeURIComponent(config.apiKey)}`;
        const { res, latencyMs, raw, request, response } = await runHttpJson({
          apiKey: config.apiKey,
          method: "POST",
          url,
          headers: { "Content-Type": "application/json", ...config.extraHeaders },
          body: JSON.stringify({
            instances: [{ prompt }],
            parameters: { sampleCount: 1, ...(aspectRatio ? { aspectRatio } : {}) },
          }),
        });
        if (!res.ok) {
          return { gatewayId: config.id, images: [], latencyMs, raw, request, response, error: describeHttpError(res.status, raw) };
        }
        const images = extractImagenImages(raw as ImagenResponse);
        return { gatewayId: config.id, images, latencyMs, raw, request, response };
      }

      const url = `${baseUrl}/v1beta/models/${encodeURIComponent(modelId)}:generateContent?key=${encodeURIComponent(config.apiKey)}`;
      const { res, latencyMs, raw, request, response } = await runHttpJson({
        apiKey: config.apiKey,
        method: "POST",
        url,
        headers: { "Content-Type": "application/json", ...config.extraHeaders },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseModalities: ["TEXT", "IMAGE"],
            ...(aspectRatio ? { imageConfig: { aspectRatio } } : {}),
          },
        }),
      });
      if (!res.ok) {
        return { gatewayId: config.id, images: [], latencyMs, raw, request, response, error: describeHttpError(res.status, raw) };
      }
      const images = extractGeminiInlineImages(raw as GeminiGenerateResponse);
      return { gatewayId: config.id, images, latencyMs, raw, request, response };
    }

    return unsupported(
      config,
      "Custom gateways don't have a standard image-generation shape -- point a request/response template at your provider's image endpoint instead.",
    );
  } catch (err) {
    return { gatewayId: config.id, images: [], latencyMs: 0, raw: null, error: errorMessage(err) };
  }
}
