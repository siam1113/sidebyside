# Architecture

## Why there's a custom server at all

Most Next.js apps run `next dev` / `next start` and never think about the
HTTP server underneath. This one can't, for two reasons:

1. **Long-lived WebSocket connections.** The Sandbox feature streams a
   terminal (keystrokes in, ANSI output back) over a raw WebSocket for as
   long as a coding-agent CLI session runs — minutes to hours, not a
   request/response cycle.
2. **A Docker daemon on the same host.** Sandbox sessions run
   `docker run`/`docker stop` directly against whatever Docker the server
   process can reach. That's not expressible as a Next.js API route.

So `server.ts` (run via `tsx`, see `package.json`'s `dev`/`start` scripts)
creates a raw `node:http` server, hands normal page/API requests to Next's
request handler, and intercepts WebSocket upgrades on `/ws/sandbox/:id`
itself before Next ever sees them.

```
Browser
  │  HTTP (pages, most API routes)
  │  WS   /ws/sandbox/:sessionId
  ▼
server.ts (node:http + ws)
  ├─ Next.js request handler ──────────────► App Router pages, most /api/* routes
  ├─ POST/GET/DELETE /api/sandbox/* ───────► sessionManager.ts (handled here directly — see below)
  └─ WS upgrade /ws/sandbox/:id ───────────► ptyBridge.ts ──► node-pty ──► `docker run` (per-session container)
```

## Gotcha #1: two module graphs, one process

Next.js API routes run through **Next's own bundler/module graph** — a
different module instance from anything `server.ts` imports directly via
`tsx`'s Node loader, even though both live in the same OS process. That
means in-memory state (like the sandbox session `Map` in
`src/lib/sandbox/sessionManager.ts`) does **not** get shared between a
Next API route and server.ts-owned code.

Concretely: if `POST /api/sandbox/sessions` were a normal
`src/app/api/.../route.ts`, it would populate a session Map that the WS
upgrade handler (which runs on server.ts's module graph) could never see —
"create session" and "attach terminal" would silently talk to two different
Maps.

**The fix, and the rule going forward:** `server.ts` intercepts
`POST/GET /api/sandbox/sessions`, `POST /api/sandbox/groups`, and
`DELETE /api/sandbox/sessions/:id` directly in its raw `createServer`
callback (see the `handle*` functions near the top of `server.ts`), instead
of as Next routes. If you add more WebSocket endpoints or more
session-state-touching APIs, put them in `server.ts` too, not
`src/app/api/`, unless they're stateless.

## Gotcha #2: `node-pty`'s executable bit

`node-pty`'s prebuilt `spawn-helper`/`pty.node` binaries can lose their
executable bit during `npm install` on some machines/filesystems — every PTY
spawn then fails with a generic `posix_spawnp failed.` that has nothing to
do with the command being run. `scripts/fix-node-pty-permissions.mjs` runs
as a `postinstall` hook to work around it; don't remove that script or the
hook without understanding why it's there.

## Data layer

Two separate stores, both under gitignored `data/`, both created lazily on
first use (no separate DB setup step):

- **`data/gateways.json`** — gateway configs (name, protocol, base URL, API
  key, default model). Plain JSON via `src/lib/gateways/store.ts` — small,
  edited constantly through the Settings UI, no need for a real DB. This
  file contains real API keys; it is never read by anything outside this
  process and must never be committed.
- **`data/app.db`** — a `better-sqlite3` database (WAL mode) via
  `src/lib/db/client.ts`, holding everything that's actually a history of
  events rather than config: `run_history`, `latency_samples`,
  `model_pricing`, `decisions`, `mcp_servers`, `mcp_test_runs`,
  `mcp_agent_runs`, `bench_suites`, `bench_runs`. Schema lives inline in
  `client.ts`'s `migrate()` — new columns are added with
  `addColumnIfMissing()` since SQLite's `ALTER TABLE ADD COLUMN` has no
  `IF NOT EXISTS` form.

## Gateway adapter pattern

`src/lib/gateways/types.ts` defines `GatewayProtocol` (`openai`,
`anthropic`, `azure-openai`, `google-gemini`, `custom`, `typesafe-eval`) and
the shared `RunResult`/`EmbeddingResult`/`ImageResult`/`EvalResult` shapes
every protocol returns, regardless of how different the underlying provider
API is.

`src/lib/gateways/adapters/index.ts` is the single dispatch point —
`runGateway()` and `runGatewayWithTools()` switch on `config.protocol` and
delegate to one adapter module per protocol
(`adapters/openai.ts`, `adapters/anthropic.ts`, `adapters/azureOpenai.ts`,
`adapters/googleGemini.ts`, `adapters/custom.ts`). Every call site in the
app (Playground, Benchmarks, the MCP agent loop, Sandbox's model listing)
goes through this dispatcher rather than knowing about individual providers.
See [`docs/GATEWAYS.md`](GATEWAYS.md) for what each protocol supports and
how to add a new one.

`custom` gateways use a user-authored request template
(`CustomOptions.bodyTemplate` with `{{prompt}}`/`{{model}}` interpolation and
a `responsePath` dot-path to pluck the reply out of an arbitrary JSON
response) — there's no fixed contract, so they don't support tool calling or
the Sandbox/MCP integrations that need one.

## Sandbox: containers, not subprocesses

`src/lib/sandbox/` wires a chosen gateway to one of three CLI tools
(`claude`, `codex`, `copilot`) and runs it inside a container, never on the
host:

- **`envMapping.ts`** — maps a `GatewayConfig` to the env vars each CLI
  expects (e.g. `ANTHROPIC_BASE_URL`/`ANTHROPIC_AUTH_TOKEN` for Claude Code,
  which only works with `protocol: anthropic` gateways; `OPENAI_BASE_URL`/
  `OPENAI_API_KEY` for Codex). Returns a typed error instead of silently
  misconfiguring the CLI when the gateway's protocol doesn't match what the
  tool needs.
- **`dockerArgs.ts`** — builds the `docker run` argv: image
  `ai-gateway-sandbox:latest` (built from `docker/sandbox.Dockerfile`, which
  installs Claude Code/Codex/Copilot CLIs on top of `node:22-bookworm-slim`),
  `--rm` (never persists), resource limits (`--cpus 2`, `--memory 2g`,
  `--pids-limit 256`), `--cap-drop ALL` + `--security-opt no-new-privileges`,
  and a `ai-gateway-sandbox=true` label used for orphan cleanup. No host
  volumes are ever mounted.
- **`sessionManager.ts`** — an in-memory `Map<sessionId, SessionRecord>`
  (intentionally in-memory: sessions don't need to survive a server
  restart). `sweepOrphans()` runs on server startup and kills any labeled
  container the current process doesn't know about, since a crash wipes the
  Map but not the containers.
- **`ptyBridge.ts`** — the WebSocket↔PTY glue: a tiny framed protocol (one
  control byte + JSON, or one data byte + raw terminal bytes) over the WS
  connection, decoupled from the PTY's lifetime so a session survives a
  client disconnect/reconnect (and React StrictMode's double-mount in dev).

## MCP integration

`src/lib/mcp/client.ts` wraps the official `@modelcontextprotocol/sdk`
client. HTTP-transport servers connect directly; **stdio-transport servers
run inside the same sandbox container image** rather than being exec'd on
the host (`--entrypoint <command>` overrides the sandbox image's normal
interactive-shell entrypoint) — the app never runs an arbitrary
user-supplied command directly on the host machine. `src/lib/mcp/agentLoop.ts`
drives a multi-turn tool-calling loop against a chosen gateway using
`runGatewayWithTools()`, recording each run to `mcp_agent_runs`.

## Request/response capture

Every gateway adapter call captures the outbound request (method, URL,
headers with the API key already masked, body) and inbound response
(status, headers, timestamp) onto the result (`CapturedRequest`/
`CapturedResponse` in `types.ts`). This is what lets the Playground show a
"raw request" view per result without a separate logging/proxy layer.
