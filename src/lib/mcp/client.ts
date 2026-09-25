import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import type { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";
import { IMAGE_NAME } from "@/lib/sandbox/dockerArgs";
import type { McpServer } from "@/lib/db/mcpServers";

export interface McpProbeResult {
  success: boolean;
  errorMessage?: string;
  latencyMs: number;
  tools?: unknown[];
  resources?: unknown[];
  prompts?: unknown[];
}

function buildTransport(server: McpServer): Transport {
  if (server.transport === "http") {
    if (!server.url) throw new Error("HTTP MCP server is missing a URL");
    return new StreamableHTTPClientTransport(new URL(server.url), {
      requestInit: server.headers ? { headers: server.headers } : undefined,
    });
  }

  if (!server.command) throw new Error("stdio MCP server is missing a command");
  // Never exec arbitrary stdio commands on host -- run them inside the same
  // throwaway sandbox container used for CLI harnesses (see src/lib/sandbox),
  // which already ships node/npx, so `npx <server>`-style commands work as-is.
  // --entrypoint overrides docker/entrypoint.sh, which always drops into an
  // interactive bash shell for the Sandbox feature -- an MCP stdio server
  // needs a clean stdin/stdout JSON-RPC stream, not a shell banner in the way.
  return new StdioClientTransport({
    command: "docker",
    args: [
      "run",
      "--rm",
      "-i",
      "--network",
      "bridge",
      "--entrypoint",
      server.command,
      IMAGE_NAME,
      ...(server.args ?? []),
    ],
  });
}

export type McpCallResult =
  | { success: true; latencyMs: number; result: unknown }
  | { success: false; latencyMs: number; errorMessage: string };

/** Opens a fresh connection, runs `fn`, and always disconnects -- shared by the probe, every
 *  raw-call helper below, and the agent loop (which needs one connection for several calls)
 *  so connect/close bookkeeping only lives in one place. Never throws. */
export async function withMcpClient<T>(
  server: McpServer,
  fn: (client: Client) => Promise<T>,
): Promise<{ ok: true; value: T; latencyMs: number } | { ok: false; error: string; latencyMs: number }> {
  const start = Date.now();
  const client = new Client({ name: "side-by-side", version: "0.1.0" });
  try {
    const transport = buildTransport(server);
    await client.connect(transport);
    const value = await fn(client);
    return { ok: true, value, latencyMs: Date.now() - start };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err), latencyMs: Date.now() - start };
  } finally {
    await client.close().catch(() => {});
  }
}

/** Connects to an MCP server, lists its tools/resources/prompts, and disconnects. Never throws -- errors land in the result. */
export async function probeMcpServer(server: McpServer): Promise<McpProbeResult> {
  const outcome = await withMcpClient(server, async (client) => {
    const [tools, resources, prompts] = await Promise.all([
      client.listTools().then((r) => r.tools).catch(() => undefined),
      client.listResources().then((r) => r.resources).catch(() => undefined),
      client.listPrompts().then((r) => r.prompts).catch(() => undefined),
    ]);
    return { tools, resources, prompts };
  });

  if (!outcome.ok) {
    return { success: false, latencyMs: outcome.latencyMs, errorMessage: outcome.error };
  }
  return { success: true, latencyMs: outcome.latencyMs, ...outcome.value };
}

/** Calls a single tool by name with the given arguments. Never throws -- errors land in the result. */
export async function callMcpTool(server: McpServer, name: string, args: unknown): Promise<McpCallResult> {
  const outcome = await withMcpClient(server, (client) =>
    client.callTool({ name, arguments: args as Record<string, unknown> | undefined }),
  );
  return outcome.ok
    ? { success: true, latencyMs: outcome.latencyMs, result: outcome.value }
    : { success: false, latencyMs: outcome.latencyMs, errorMessage: outcome.error };
}

/** Reads a resource by URI. Never throws -- errors land in the result. */
export async function readMcpResource(server: McpServer, uri: string): Promise<McpCallResult> {
  const outcome = await withMcpClient(server, (client) => client.readResource({ uri }));
  return outcome.ok
    ? { success: true, latencyMs: outcome.latencyMs, result: outcome.value }
    : { success: false, latencyMs: outcome.latencyMs, errorMessage: outcome.error };
}

/** Fetches a rendered prompt by name with the given arguments. Never throws -- errors land in the result. */
export async function getMcpPrompt(
  server: McpServer,
  name: string,
  args?: Record<string, string>,
): Promise<McpCallResult> {
  const outcome = await withMcpClient(server, (client) => client.getPrompt({ name, arguments: args }));
  return outcome.ok
    ? { success: true, latencyMs: outcome.latencyMs, result: outcome.value }
    : { success: false, latencyMs: outcome.latencyMs, errorMessage: outcome.error };
}
