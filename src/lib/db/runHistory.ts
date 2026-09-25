import { randomUUID } from "node:crypto";
import { getDb } from "./client";

export type RunHistoryKind = "chat" | "evaluate" | "embed" | "image";

export interface RecordRunInput {
  kind: RunHistoryKind;
  gatewayId: string;
  gatewayName: string;
  model?: string;
  latencyMs?: number;
  success: boolean;
  errorMessage?: string;
  promptPreview?: string;
  responseText?: string;
  usage?: object;
}

export interface RunHistoryEntry {
  id: string;
  kind: RunHistoryKind;
  gatewayId: string;
  gatewayName: string;
  model: string | null;
  latencyMs: number | null;
  success: boolean;
  errorMessage: string | null;
  promptPreview: string | null;
  responseText: string | null;
  usage: Record<string, unknown> | null;
  createdAt: string;
}

interface RunHistoryRow {
  id: string;
  kind: RunHistoryKind;
  gateway_id: string;
  gateway_name: string;
  model: string | null;
  latency_ms: number | null;
  success: number;
  error_message: string | null;
  prompt_preview: string | null;
  response_text: string | null;
  usage: string | null;
  created_at: string;
}

function rowToEntry(row: RunHistoryRow): RunHistoryEntry {
  return {
    id: row.id,
    kind: row.kind,
    gatewayId: row.gateway_id,
    gatewayName: row.gateway_name,
    model: row.model,
    latencyMs: row.latency_ms,
    success: Boolean(row.success),
    errorMessage: row.error_message,
    promptPreview: row.prompt_preview,
    responseText: row.response_text,
    usage: row.usage ? JSON.parse(row.usage) : null,
    createdAt: row.created_at,
  };
}

/** Truncates text to a length safe to store/render -- generous enough to still be useful in a detail view. */
export function previewText(text: string, maxLength = 4000): string {
  return text.length > maxLength ? `${text.slice(0, maxLength)}…` : text;
}

export function recordRun(input: RecordRunInput): void {
  const db = getDb();
  db.prepare(
    `INSERT INTO run_history
       (id, kind, gateway_id, gateway_name, model, latency_ms, success, error_message, prompt_preview, response_text, usage, created_at)
     VALUES
       (@id, @kind, @gatewayId, @gatewayName, @model, @latencyMs, @success, @errorMessage, @promptPreview, @responseText, @usage, @createdAt)`,
  ).run({
    id: randomUUID(),
    kind: input.kind,
    gatewayId: input.gatewayId,
    gatewayName: input.gatewayName,
    model: input.model ?? null,
    latencyMs: input.latencyMs ?? null,
    success: input.success ? 1 : 0,
    errorMessage: input.errorMessage ?? null,
    promptPreview: input.promptPreview ?? null,
    responseText: input.responseText ?? null,
    usage: input.usage ? JSON.stringify(input.usage) : null,
    createdAt: new Date().toISOString(),
  });
}

export interface ListRunHistoryQuery {
  gatewayId?: string;
  kind?: RunHistoryKind;
  success?: boolean;
  limit?: number;
  offset?: number;
}

export function listRunHistory(query: ListRunHistoryQuery = {}): RunHistoryEntry[] {
  const db = getDb();
  const clauses: string[] = [];
  const params: Record<string, unknown> = {};
  if (query.gatewayId) {
    clauses.push("gateway_id = @gatewayId");
    params.gatewayId = query.gatewayId;
  }
  if (query.kind) {
    clauses.push("kind = @kind");
    params.kind = query.kind;
  }
  if (query.success !== undefined) {
    clauses.push("success = @success");
    params.success = query.success ? 1 : 0;
  }
  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  params.limit = query.limit ?? 100;
  params.offset = query.offset ?? 0;
  const rows = db
    .prepare(`SELECT * FROM run_history ${where} ORDER BY created_at DESC LIMIT @limit OFFSET @offset`)
    .all(params) as RunHistoryRow[];
  return rows.map(rowToEntry);
}

export function getRunHistoryEntry(id: string): RunHistoryEntry | null {
  const row = getDb().prepare(`SELECT * FROM run_history WHERE id = ?`).get(id) as RunHistoryRow | undefined;
  return row ? rowToEntry(row) : null;
}
