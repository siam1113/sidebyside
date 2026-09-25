import { randomUUID } from "node:crypto";
import { getDb } from "./client";

export type McpTransport = "stdio" | "http";

export interface McpServerInput {
  name: string;
  description?: string;
  transport: McpTransport;
  /** stdio only: the command to run inside the sandbox container, e.g. "npx". */
  command?: string;
  args?: string[];
  /** http only. */
  url?: string;
  headers?: Record<string, string>;
}

export interface McpServer extends McpServerInput {
  id: string;
  createdAt: string;
}

interface McpServerRow {
  id: string;
  name: string;
  description: string | null;
  transport: McpTransport;
  command: string | null;
  args: string | null;
  url: string | null;
  headers: string | null;
  created_at: string;
}

function rowToServer(row: McpServerRow): McpServer {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? undefined,
    transport: row.transport,
    command: row.command ?? undefined,
    args: row.args ? JSON.parse(row.args) : undefined,
    url: row.url ?? undefined,
    headers: row.headers ? JSON.parse(row.headers) : undefined,
    createdAt: row.created_at,
  };
}

export function listMcpServers(): McpServer[] {
  const rows = getDb().prepare(`SELECT * FROM mcp_servers ORDER BY created_at DESC`).all() as McpServerRow[];
  return rows.map(rowToServer);
}

export function getMcpServer(id: string): McpServer | null {
  const row = getDb().prepare(`SELECT * FROM mcp_servers WHERE id = ?`).get(id) as McpServerRow | undefined;
  return row ? rowToServer(row) : null;
}

export function createMcpServer(input: McpServerInput): McpServer {
  const id = randomUUID();
  getDb()
    .prepare(
      `INSERT INTO mcp_servers (id, name, description, transport, command, args, url, headers, created_at)
       VALUES (@id, @name, @description, @transport, @command, @args, @url, @headers, @createdAt)`,
    )
    .run({
      id,
      name: input.name,
      description: input.description ?? null,
      transport: input.transport,
      command: input.command ?? null,
      args: input.args ? JSON.stringify(input.args) : null,
      url: input.url ?? null,
      headers: input.headers ? JSON.stringify(input.headers) : null,
      createdAt: new Date().toISOString(),
    });
  return getMcpServer(id)!;
}

export function deleteMcpServer(id: string): boolean {
  const info = getDb().prepare(`DELETE FROM mcp_servers WHERE id = ?`).run(id);
  return info.changes > 0;
}

export interface McpTestRunInput {
  serverId: string;
  success: boolean;
  errorMessage?: string;
  latencyMs?: number;
  tools?: unknown[];
  resources?: unknown[];
  prompts?: unknown[];
}

export interface McpTestRun extends McpTestRunInput {
  id: string;
  createdAt: string;
}

interface McpTestRunRow {
  id: string;
  server_id: string;
  success: number;
  error_message: string | null;
  latency_ms: number | null;
  tools: string | null;
  resources: string | null;
  prompts: string | null;
  created_at: string;
}

function rowToTestRun(row: McpTestRunRow): McpTestRun {
  return {
    id: row.id,
    serverId: row.server_id,
    success: Boolean(row.success),
    errorMessage: row.error_message ?? undefined,
    latencyMs: row.latency_ms ?? undefined,
    tools: row.tools ? JSON.parse(row.tools) : undefined,
    resources: row.resources ? JSON.parse(row.resources) : undefined,
    prompts: row.prompts ? JSON.parse(row.prompts) : undefined,
    createdAt: row.created_at,
  };
}

export function recordMcpTestRun(input: McpTestRunInput): McpTestRun {
  const id = randomUUID();
  const createdAt = new Date().toISOString();
  getDb()
    .prepare(
      `INSERT INTO mcp_test_runs (id, server_id, success, error_message, latency_ms, tools, resources, prompts, created_at)
       VALUES (@id, @serverId, @success, @errorMessage, @latencyMs, @tools, @resources, @prompts, @createdAt)`,
    )
    .run({
      id,
      serverId: input.serverId,
      success: input.success ? 1 : 0,
      errorMessage: input.errorMessage ?? null,
      latencyMs: input.latencyMs ?? null,
      tools: input.tools ? JSON.stringify(input.tools) : null,
      resources: input.resources ? JSON.stringify(input.resources) : null,
      prompts: input.prompts ? JSON.stringify(input.prompts) : null,
      createdAt,
    });
  return { ...input, id, createdAt };
}

export function listMcpTestRuns(serverId: string, limit = 10): McpTestRun[] {
  const rows = getDb()
    .prepare(`SELECT * FROM mcp_test_runs WHERE server_id = ? ORDER BY created_at DESC LIMIT ?`)
    .all(serverId, limit) as McpTestRunRow[];
  return rows.map(rowToTestRun);
}
