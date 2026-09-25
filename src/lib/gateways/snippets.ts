import type { CapturedRequest, CapturedResponse } from "./types";

/** Shape shared by RunResult, EvalResult, EmbeddingResult, and ImageResult. */
export interface JsonableResult {
  request?: CapturedRequest;
  response?: CapturedResponse;
  raw: unknown;
}

/**
 * Pure formatter for the playground's raw-JSON view. Operates only on the
 * already-redacted request/response data -- never on a GatewayConfig or its
 * apiKey -- so a real secret can never reach this string.
 */
export function toFullJson(result: JsonableResult): string {
  return JSON.stringify(
    {
      request: result.request ?? null,
      response: result.response ?? null,
      body: result.raw ?? null,
    },
    null,
    2,
  );
}
