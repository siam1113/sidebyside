export type GatewayProtocol =
  | "openai"
  | "anthropic"
  | "azure-openai"
  | "google-gemini"
  | "custom"
  | "typesafe-eval";

/** Core sampling parameters a run can override, on top of the gateway/model defaults. */
export interface RunParams {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  systemPrompt?: string;
  stopSequences?: string[];
}

/**
 * Which RunParams fields each protocol actually forwards to the provider.
 * Custom gateways use a user-authored body template, so params are only
 * passed through as extra {{...}} interpolation vars -- not guaranteed to
 * apply -- which is why it supports none of these "for sure".
 */
export const PROTOCOL_PARAM_SUPPORT: Record<GatewayProtocol, ReadonlyArray<keyof RunParams>> = {
  openai: ["temperature", "maxTokens", "topP", "systemPrompt", "stopSequences"],
  anthropic: ["temperature", "maxTokens", "topP", "systemPrompt", "stopSequences"],
  "azure-openai": ["temperature", "maxTokens", "topP", "systemPrompt", "stopSequences"],
  "google-gemini": ["temperature", "maxTokens", "topP", "systemPrompt", "stopSequences"],
  custom: [],
  "typesafe-eval": [],
};

export interface AzureOptions {
  deployment: string;
  apiVersion: string;
}

export interface CustomOptions {
  method: "GET" | "POST";
  /** Full URL. May reference {{baseUrl}}, {{apiKey}}, {{model}}. */
  url: string;
  /** Header values may reference {{apiKey}}. */
  headers: Record<string, string>;
  /** JSON body template. May reference {{prompt}} and {{model}}. Ignored for GET. */
  bodyTemplate: string;
  /** Dot-path into the JSON response to extract the reply text, e.g. "choices.0.message.content". */
  responsePath: string;
}

export interface GatewayConfig {
  id: string;
  name: string;
  protocol: GatewayProtocol;
  baseUrl: string;
  apiKey: string;
  defaultModel: string;
  extraHeaders?: Record<string, string>;
  /** Opt-in periodic model-list ping (no completion cost) recorded to the Latency dashboard, independent of real usage. */
  healthCheckEnabled?: boolean;
  azure?: AzureOptions;
  custom?: CustomOptions;
  createdAt: string;
  updatedAt: string;
}

export type GatewayConfigInput = Omit<
  GatewayConfig,
  "id" | "createdAt" | "updatedAt"
>;

export interface ConnectionTestResult {
  ok: boolean;
  message: string;
  modelCount?: number;
  latencyMs: number;
  checkedAt: string;
}

export interface UsageInfo {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
}

export interface CapturedRequest {
  method: string;
  url: string;
  /** Secret values (API keys) are already masked before this is constructed. */
  headers: Record<string, string>;
  body: string | null;
}

export interface CapturedResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  timestampIso: string;
}

export interface RunResult {
  gatewayId: string;
  text: string;
  latencyMs: number;
  usage?: UsageInfo;
  raw: unknown;
  error?: string;
  request?: CapturedRequest;
  response?: CapturedResponse;
  /** Inline images the model generated as part of its reply (e.g. Gemini's "-image" models). */
  images?: string[];
  /** Non-fatal notes -- e.g. an attachment this protocol can't accept was dropped from the request. */
  warnings?: string[];
}

/** A file the user attached to a chat prompt. `dataUrl` carries the base64-encoded bytes as a
 *  `data:<mimeType>;base64,...` URI for image/video/file kinds; `text` carries the raw string for
 *  a pasted-text chip (kept in full even though the composer only shows a collapsed label for it). */
export interface Attachment {
  id: string;
  kind: "image" | "video" | "file" | "text";
  name: string;
  mimeType: string;
  dataUrl?: string;
  text?: string;
  size?: number;
}

/** Protocols with a real chat-completion endpoint (Custom's body template and TypeSafe Eval's
 *  question/answer shape aren't a "send a prompt, get a reply" call). */
export const CHAT_CAPABLE = (protocol: GatewayProtocol) => protocol !== "typesafe-eval";

/** Chat-capable protocols with a documented tool/function-calling contract this app implements
 *  (see gateways/adapters/*.ts `runWithTools`). Custom gateways use a user-authored body
 *  template with no stable place to inject a tools array, so they're excluded here too. */
export const TOOL_CAPABLE = (protocol: GatewayProtocol) =>
  protocol === "openai" || protocol === "anthropic" || protocol === "azure-openai" || protocol === "google-gemini";

export interface RunRequestBody {
  prompt: string;
  model?: string;
  params?: RunParams;
  attachments?: Attachment[];
}

export interface EmbeddingResult {
  gatewayId: string;
  embedding: number[];
  dimensions: number;
  latencyMs: number;
  usage?: UsageInfo;
  raw: unknown;
  error?: string;
  request?: CapturedRequest;
  response?: CapturedResponse;
}

export interface EmbedRequestBody {
  input: string;
  model?: string;
}

export interface ImageResult {
  gatewayId: string;
  /** Each entry is either a remote URL or a data: URI (from b64_json), ready to use in <img src>. */
  images: string[];
  latencyMs: number;
  raw: unknown;
  error?: string;
  request?: CapturedRequest;
  response?: CapturedResponse;
}

export interface ImageRequestBody {
  prompt: string;
  model?: string;
  size?: string;
}

/** Question shapes for TypeSafe AI's System One evaluation API (POST /v1/systemone). */
export type EvalQuestion =
  | { type: "noul"; instructions: string; criteria: { true: string; false: string } }
  | { type: "choice"; instructions: string; criteria: Record<string, string | null> }
  | { type: "score"; instructions: string; criteria: string[] };

export interface EvalRequestBody {
  state: string;
  model?: string;
  questions: Record<string, EvalQuestion>;
}

export type EvalAnswer =
  | { type: "noul"; noul: number }
  | { type: "choice"; choice: string; confidence?: number; probabilities?: Record<string, number> }
  | { type: "score"; score: number; confidence?: number; legend?: Record<string, string>; probabilities?: Record<string, number> };

export interface EvalUsage {
  inputTokens?: number;
  outputTokens?: number;
}

export interface EvalResult {
  gatewayId: string;
  answers: Record<string, EvalAnswer>;
  latencyMs: number;
  usage?: EvalUsage;
  raw: unknown;
  error?: string;
  request?: CapturedRequest;
  response?: CapturedResponse;
}
