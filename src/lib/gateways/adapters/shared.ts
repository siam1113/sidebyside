import type { CapturedRequest, CapturedResponse } from "../types";

const DEFAULT_TIMEOUT_MS = 30_000;
const MASK = "***MASKED***";

export function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, "");
}

export async function timedFetch(
  url: string,
  init: RequestInit,
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<{ res: Response; latencyMs: number }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const start = performance.now();
  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
    const latencyMs = Math.round(performance.now() - start);
    return { res, latencyMs };
  } finally {
    clearTimeout(timeout);
  }
}

export function describeHttpError(status: number, raw: unknown): string {
  const message =
    (raw &&
      typeof raw === "object" &&
      "error" in raw &&
      typeof (raw as { error: unknown }).error === "object" &&
      (raw as { error: { message?: string } }).error?.message) ||
    (raw &&
      typeof raw === "object" &&
      "message" in raw &&
      (raw as { message?: string }).message) ||
    undefined;
  if (status === 401 || status === 403) {
    return `Auth failed (HTTP ${status}): ${message ?? "check API key"}`;
  }
  if (status === 404) {
    return `Not found (HTTP ${status}): ${message ?? "check base URL"}`;
  }
  return `HTTP ${status}: ${message ?? "request failed"}`;
}

export function errorMessage(err: unknown): string {
  if (err instanceof Error) {
    if (err.name === "AbortError") return "Request timed out";
    return err.message;
  }
  return String(err);
}

export function getByPath(obj: unknown, dotPath: string): unknown {
  return dotPath.split(".").reduce<unknown>((acc, key) => {
    if (acc == null) return undefined;
    if (Array.isArray(acc)) return acc[Number(key)];
    if (typeof acc === "object") return (acc as Record<string, unknown>)[key];
    return undefined;
  }, obj);
}

export function interpolate(
  template: string,
  vars: Record<string, string>,
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? "");
}

const SENSITIVE_HEADER_NAMES = new Set(["authorization", "x-api-key", "api-key"]);

function maskAuthorizationHeader(value: string): string {
  const match = value.match(/^(Bearer\s+)/i);
  return match ? `${match[1]}${MASK}` : MASK;
}

/** Masks known secret-bearing headers and the Gemini `?key=` query param. */
export function defaultRedact(
  url: string,
  headers: Record<string, string>,
): { url: string; headers: Record<string, string> } {
  const redactedHeaders: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
    const lower = key.toLowerCase();
    if (lower === "authorization") {
      redactedHeaders[key] = maskAuthorizationHeader(value);
    } else if (SENSITIVE_HEADER_NAMES.has(lower)) {
      redactedHeaders[key] = MASK;
    } else {
      redactedHeaders[key] = value;
    }
  }

  let redactedUrl = url;
  try {
    const parsed = new URL(url);
    if (parsed.searchParams.has("key")) {
      parsed.searchParams.set("key", MASK);
      redactedUrl = parsed.toString();
    }
  } catch {
    // relative or malformed URL; leave as-is
  }

  return { url: redactedUrl, headers: redactedHeaders };
}

function scrubSecretValue<T extends string | null | undefined>(
  input: T,
  secret: string,
): T {
  if (!input || !secret) return input;
  return input.split(secret).join(MASK) as T;
}

export interface RunHttpJsonOptions {
  /** Used only to scrub the secret from captured request detail; never sent anywhere new. */
  apiKey: string;
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: string;
  redact?: (
    url: string,
    headers: Record<string, string>,
  ) => { url: string; headers: Record<string, string> };
  timeoutMs?: number;
}

export interface RunHttpJsonResult {
  res: Response;
  latencyMs: number;
  raw: unknown;
  request: CapturedRequest;
  response: CapturedResponse;
}

/**
 * Fetches JSON while capturing a redacted copy of the request and the response
 * metadata, so callers can shape a RunResult without duplicating this per adapter.
 * The real (unredacted) headers/url/body are still used for the actual fetch.
 */
export async function runHttpJson(
  opts: RunHttpJsonOptions,
): Promise<RunHttpJsonResult> {
  const { res, latencyMs } = await timedFetch(
    opts.url,
    { method: opts.method, headers: opts.headers, body: opts.body },
    opts.timeoutMs,
  );
  const raw = await res.json().catch(() => null);

  const redact = opts.redact ?? defaultRedact;
  const { url: redactedUrl, headers: redactedHeaders } = redact(opts.url, opts.headers);

  const scrubbedHeaders: Record<string, string> = {};
  for (const [key, value] of Object.entries(redactedHeaders)) {
    scrubbedHeaders[key] = scrubSecretValue(value, opts.apiKey);
  }

  return {
    res,
    latencyMs,
    raw,
    request: {
      method: opts.method,
      url: scrubSecretValue(redactedUrl, opts.apiKey),
      headers: scrubbedHeaders,
      body: scrubSecretValue(opts.body, opts.apiKey) ?? null,
    },
    response: {
      status: res.status,
      statusText: res.statusText,
      headers: Object.fromEntries(res.headers.entries()),
      timestampIso: new Date().toISOString(),
    },
  };
}
