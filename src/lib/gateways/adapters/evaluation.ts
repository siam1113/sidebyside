import type { EvalAnswer, EvalQuestion, EvalResult, EvalUsage, GatewayConfig } from "../types";
import { describeHttpError, errorMessage, normalizeBaseUrl, runHttpJson } from "./shared";

interface SystemOneResponse {
  answers?: Record<string, EvalAnswer>;
  usage?: { input_tokens?: number; output_tokens?: number };
}

/**
 * TypeSafe AI's System One evaluation API -- structured yes/no, choice, and
 * score judgments (e.g. the "jev" model), not a chat-completions shape.
 * See https://vercel.com/docs/ai-gateway/sdks-and-apis/typesafe -- POST {baseUrl}/v1/systemone.
 */
export async function runEvaluation(
  config: GatewayConfig,
  state: string,
  questions: Record<string, EvalQuestion>,
  model?: string,
): Promise<EvalResult> {
  if (config.protocol !== "typesafe-eval") {
    return {
      gatewayId: config.id,
      answers: {},
      latencyMs: 0,
      raw: null,
      error: "This gateway isn't configured as a TypeSafe Evaluation protocol gateway.",
    };
  }

  const url = `${normalizeBaseUrl(config.baseUrl)}/v1/systemone`;
  try {
    const { res, latencyMs, raw, request, response } = await runHttpJson({
      apiKey: config.apiKey,
      method: "POST",
      url,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
        ...config.extraHeaders,
      },
      body: JSON.stringify({
        state,
        model: model || config.defaultModel || "jev-latest",
        questions,
      }),
    });
    if (!res.ok) {
      return {
        gatewayId: config.id,
        answers: {},
        latencyMs,
        raw,
        request,
        response,
        error: describeHttpError(res.status, raw),
      };
    }
    const data = raw as SystemOneResponse;
    const usage: EvalUsage | undefined = data.usage
      ? { inputTokens: data.usage.input_tokens, outputTokens: data.usage.output_tokens }
      : undefined;
    return { gatewayId: config.id, answers: data.answers ?? {}, latencyMs, usage, raw, request, response };
  } catch (err) {
    return { gatewayId: config.id, answers: {}, latencyMs: 0, raw: null, error: errorMessage(err) };
  }
}
