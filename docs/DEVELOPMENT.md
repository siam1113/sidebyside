# Development

## Prerequisites

- **Node.js 22** (the repo is built/tested against it; 20+ works per
  `scripts/setup.sh`'s check, but 22 is what `docker/sandbox.Dockerfile` and
  the deploy scripts install).
- **Docker**, optional — only the Sandbox tab and MCP stdio-transport
  servers need it. Everything else (Playground, Insights, Benchmarks,
  Decisions, MCP HTTP servers, Learn) works without it.

## Setup

```bash
./scripts/setup.sh
```

Checks Node/Docker, runs `npm install` (which also fixes `node-pty`'s
executable bit via a `postinstall` hook — see below), and builds the sandbox
image (`ai-gateway-sandbox:latest`, from `docker/sandbox.Dockerfile`) if
Docker is available and running. Safe to re-run any time.

## Running

```bash
npm run dev     # tsx watch server.ts -- custom server, not `next dev`
npm run build   # next build
npm start       # NODE_ENV=production tsx server.ts
npm run lint    # eslint
```

There is no `next dev`/`next start` path for this app — see
[`docs/ARCHITECTURE.md`](ARCHITECTURE.md) for why a custom `server.ts`
exists at all.

## No API keys needed to start

Gateway configs (name, protocol, base URL, API key, default model) are
added at runtime through **Settings**, not through environment variables or
a `.env` file. They're stored in `data/gateways.json`, which is gitignored —
never commit it, and don't expect one to already exist on a fresh checkout.

## Known environment gotchas

These two have already cost real debugging time once; both have a fix
already in the repo, don't remove either without understanding why they're
there:

1. **`node-pty` loses its executable bit.** `node-pty`'s prebuilt
   `spawn-helper`/`pty.node` binaries can lose their executable permission
   during `npm install` on some machines/filesystems. Every PTY spawn then
   fails with a generic `posix_spawnp failed.` that has nothing to do with
   whatever command you were trying to run. Fixed by
   `scripts/fix-node-pty-permissions.mjs`, wired as npm's `postinstall`
   hook in `package.json` — it runs automatically on every `npm install`.
2. **Two module graphs, one process.** Next.js API routes run through
   Next's own bundler, a separate module instance from anything `server.ts`
   imports directly via `tsx`. In-memory state doesn't share between the
   two even though it's the same OS process — see
   [`docs/ARCHITECTURE.md`](ARCHITECTURE.md#gotcha-1-two-module-graphs-one-process)
   for the full explanation and the rule for where new stateful routes
   belong.

## Adding features

- **New gateway protocol** → [`docs/GATEWAYS.md`](GATEWAYS.md#adding-a-new-protocol).
- **New WebSocket endpoint or session-state-touching API** → put it in
  `server.ts` directly, not `src/app/api/`, unless it's stateless (see
  Gotcha #2 above).
- **New SQLite table** → add the `CREATE TABLE IF NOT EXISTS` to
  `migrate()` in `src/lib/db/client.ts`; new columns on an existing table go
  through `addColumnIfMissing()` since SQLite has no
  `ALTER TABLE ADD COLUMN IF NOT EXISTS`.
