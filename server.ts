import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { randomUUID } from "node:crypto";
import { parse } from "node:url";
import next from "next";
import { WebSocketServer } from "ws";
import { handleSandboxUpgrade } from "./src/lib/sandbox/ptyBridge";
import {
  createSession,
  getSession,
  listSessions,
  stopSession,
  sweepOrphans,
  stopAllSessions,
} from "./src/lib/sandbox/sessionManager";
import type { SandboxTool } from "./src/lib/sandbox/envMapping";
import { listGateways } from "./src/lib/gateways/store";
import { pingEnabledGateways } from "./src/lib/gateways/healthCheck";

const dev = process.env.NODE_ENV !== "production";
const hostname = "127.0.0.1";
const port = Number(process.env.PORT) || 3000;
const HEALTH_CHECK_INTERVAL_MS = 5 * 60 * 1000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

const SANDBOX_WS_PATH = /^\/ws\/sandbox\/([^/]+)$/;
const SANDBOX_SESSION_PATH = /^\/api\/sandbox\/sessions\/([^/]+)$/;
const SANDBOX_TOOLS: SandboxTool[] = ["claude", "codex", "copilot"];

function readJsonBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      if (!body) return resolve(null);
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(err);
      }
    });
    req.on("error", reject);
  });
}

function sendJson(res: ServerResponse, status: number, payload: unknown): void {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(payload));
}

/**
 * Handled directly here (not as a Next.js API route) because Next runs route
 * handlers through its own bundler/module graph, which is a *separate*
 * module instance from anything server.ts imports via tsx's Node loader.
 * The in-memory session Map in sessionManager.ts would otherwise be
 * duplicated -- one copy for API routes, one for the WS/PTY bridge -- and
 * "create session" + "attach WS" would never see the same state.
 */
async function handleCreateSandboxSession(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  let body: unknown;
  try {
    body = await readJsonBody(req);
  } catch {
    sendJson(res, 400, { error: "Invalid JSON body" });
    return;
  }
  if (!body || typeof body !== "object") {
    sendJson(res, 400, { error: "Invalid request body" });
    return;
  }
  const { tool, gatewayId, model } = body as {
    tool?: string;
    gatewayId?: string;
    model?: string;
  };
  if (!tool || !SANDBOX_TOOLS.includes(tool as SandboxTool)) {
    sendJson(res, 400, { error: `tool must be one of ${SANDBOX_TOOLS.join(", ")}` });
    return;
  }
  if (!gatewayId || typeof gatewayId !== "string") {
    sendJson(res, 400, { error: "gatewayId is required" });
    return;
  }

  const result = await createSession(tool as SandboxTool, gatewayId, model);
  if (!result.ok) {
    sendJson(res, 400, { error: result.error });
    return;
  }
  sendJson(res, 201, { sessionId: result.sessionId });
}

function handleListSandboxSessions(res: ServerResponse): void {
  sendJson(res, 200, { sessions: listSessions() });
}

interface HarnessRequest {
  tool?: string;
  gatewayId?: string;
  model?: string;
}

/**
 * Launches one session per requested harness under a shared groupId so
 * /sandbox/compare/[groupId] can render them side by side -- same
 * same-module-graph reasoning as handleCreateSandboxSession above.
 */
async function handleCreateSandboxGroup(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  let body: unknown;
  try {
    body = await readJsonBody(req);
  } catch {
    sendJson(res, 400, { error: "Invalid JSON body" });
    return;
  }
  if (!body || typeof body !== "object") {
    sendJson(res, 400, { error: "Invalid request body" });
    return;
  }
  const { harnesses, prompt } = body as { harnesses?: HarnessRequest[]; prompt?: string };
  if (!Array.isArray(harnesses) || harnesses.length === 0) {
    sendJson(res, 400, { error: "harnesses must be a non-empty array" });
    return;
  }

  const groupId = randomUUID();
  const results: Array<{ tool: string; sessionId: string } | { tool: string; error: string }> = [];

  for (const h of harnesses) {
    if (!h.tool || !SANDBOX_TOOLS.includes(h.tool as SandboxTool)) {
      results.push({ tool: h.tool ?? "unknown", error: `tool must be one of ${SANDBOX_TOOLS.join(", ")}` });
      continue;
    }
    if (!h.gatewayId || typeof h.gatewayId !== "string") {
      results.push({ tool: h.tool, error: "gatewayId is required" });
      continue;
    }
    const result = await createSession(h.tool as SandboxTool, h.gatewayId, h.model, {
      groupId,
      label: h.tool,
      initialPrompt: typeof prompt === "string" && prompt.trim() ? prompt : undefined,
    });
    results.push(result.ok ? { tool: h.tool, sessionId: result.sessionId } : { tool: h.tool, error: result.error });
  }

  sendJson(res, 201, { groupId, sessions: results });
}

async function handleStopSandboxSession(id: string, res: ServerResponse): Promise<void> {
  if (!getSession(id)) {
    sendJson(res, 404, { error: "Session not found" });
    return;
  }
  await stopSession(id);
  sendJson(res, 200, { ok: true });
}

async function main() {
  await app.prepare();
  const handleUpgrade = app.getUpgradeHandler();
  await sweepOrphans();

  const server = createServer((req, res) => {
    if (req.method === "POST" && req.url === "/api/sandbox/sessions") {
      void handleCreateSandboxSession(req, res);
      return;
    }
    if (req.method === "GET" && req.url === "/api/sandbox/sessions") {
      handleListSandboxSessions(res);
      return;
    }
    if (req.method === "POST" && req.url === "/api/sandbox/groups") {
      void handleCreateSandboxGroup(req, res);
      return;
    }
    const sessionMatch = req.url ? SANDBOX_SESSION_PATH.exec(req.url) : null;
    if (req.method === "DELETE" && sessionMatch) {
      void handleStopSandboxSession(sessionMatch[1], res);
      return;
    }
    const parsedUrl = parse(req.url ?? "/", true);
    void handle(req, res, parsedUrl);
  });

  const wss = new WebSocketServer({ noServer: true });

  server.on("upgrade", (req, socket, head) => {
    const { pathname } = parse(req.url ?? "", true);
    const match = pathname ? SANDBOX_WS_PATH.exec(pathname) : null;
    if (!match) {
      // Not our sandbox WS path -- let Next handle it (e.g. its own dev-mode
      // HMR websocket). Destroying the socket here would silently break
      // Turbopack's HMR connection.
      void handleUpgrade(req, socket, head);
      return;
    }
    const sessionId = match[1];
    wss.handleUpgrade(req, socket, head, (ws) => {
      handleSandboxUpgrade(sessionId, ws);
    });
  });

  server.listen(port, hostname, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });

  const healthCheckInterval = setInterval(() => {
    listGateways()
      .then(pingEnabledGateways)
      .catch((err) => console.warn("[latency] Health check sweep failed:", err));
  }, HEALTH_CHECK_INTERVAL_MS);
  healthCheckInterval.unref();

  let shuttingDown = false;
  const shutdown = async (signal: string) => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`\n[server] ${signal} received, stopping sandbox sessions...`);
    clearInterval(healthCheckInterval);
    await stopAllSessions();
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 3000).unref();
  };
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
  process.on("SIGINT", () => void shutdown("SIGINT"));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
