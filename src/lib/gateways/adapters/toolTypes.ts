import type { CapturedRequest, CapturedResponse, UsageInfo } from "../types";

/** An MCP tool, shaped down to what every provider's tool-calling API needs. */
export interface ToolDef {
  name: string;
  description?: string;
  inputSchema: unknown;
}

export interface ToolCallRequest {
  id: string;
  name: string;
  args: unknown;
  /** Opaque per-provider data that has to be echoed back verbatim on the next turn for the
   *  call to replay correctly -- e.g. Gemini 3's `thoughtSignature` on function calls. Adapters
   *  that don't need this leave it undefined; the agent loop just carries it through untouched. */
  providerMeta?: unknown;
}

/** One turn of a tool-calling conversation, in a provider-agnostic shape the agent loop builds
 *  up turn by turn -- each adapter's runWithTools() re-serializes the whole history into its
 *  own wire format on every call (same stateless-per-call style as the plain run() adapters). */
export type ChatMessage =
  | { role: "user"; content: string }
  | { role: "assistant"; text?: string; toolCalls?: ToolCallRequest[] }
  | { role: "tool"; toolCallId: string; name: string; result: unknown; isError?: boolean };

export interface ToolTurnResult {
  text?: string;
  toolCalls?: ToolCallRequest[];
  latencyMs: number;
  usage?: UsageInfo;
  raw: unknown;
  request?: CapturedRequest;
  response?: CapturedResponse;
  error?: string;
}
