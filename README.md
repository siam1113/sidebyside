# SideBySide

A local-first workbench for comparing LLM API gateways and models side by
side — send one prompt to several gateways at once, see cost/latency/context
differences at a glance, sandbox coding-agent CLIs against a chosen gateway,
benchmark prompts across configs, and record the decisions that came out of
it. Nothing here talks to a shared backend: gateway configs and run history
live only in this repo's gitignored `data/` folder, on your machine.

**Why this exists:** trying out different LLM API gateways (LiteLLM,
OpenRouter, Portkey, Azure OpenAI, Google Gemini, or any custom HTTP
endpoint) without touching the real global config/credentials that Claude
Code, Codex CLI, or Copilot CLI use on your machine day to day.

## Features

| Page | What it does |
|---|---|
| **Playground** (`/playground`) | Send one prompt to multiple configured gateways at once; compare replies, latency, token usage, and cost side by side. Also has tabs for image generation, embeddings, and LLM-judge evaluation. |
| **Insights** (`/insights`) | Every model across every gateway in one table — context window, output cap, modality, and cost per million tokens once priced. Plus latency history and cost dashboards. |
| **Sandbox** (`/sandbox`) | Launches Claude Code, Codex CLI, or Copilot CLI inside a locked-down, throwaway Docker container wired to a gateway of your choice via env vars — driven from an in-browser terminal over a WebSocket↔PTY bridge. Your real local CLI configs are never touched. |
| **Benchmarks** (`/benchmarks`) | Define prompt test cases, run them across gateway configs, and grade each response with a deterministic assertion or an LLM judge. |
| **Decisions** (`/decisions`) | Record which model/gateway was chosen and why — rationale, alternatives considered, links back to the runs that backed it up. |
| **MCP Servers** (`/mcp`) | Register MCP servers (stdio or HTTP), test the connection live, inspect exposed tools/resources/prompts, and run an agent loop against them. |
| **Learn** (`/learn`) | Self-contained lessons + quizzes covering the concepts behind the rest of the app (gateways, tokens, benchmarks, MCP) — no prior AI knowledge assumed. |
| **Settings** (`/settings`) | Register/edit gateway configs used everywhere else. |

See [`docs/FEATURES.md`](docs/FEATURES.md) for how each of these actually works under the hood.

## Quick start

Requires **Node.js 20+** (22 recommended) and, optionally, **Docker** (only the Sandbox tab needs it).

```bash
./scripts/setup.sh   # checks Node/Docker, npm install, builds the sandbox image if Docker is available
npm run dev
```

Then open http://localhost:3000, go to **Settings**, and add your first gateway. No API keys or `.env` file are needed to get the rest of the app running — gateway configs are added at runtime through the UI and stored in `data/gateways.json` (gitignored, never committed).

## Documentation

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — how the custom server, data layer, gateway adapters, and sandbox/MCP pieces fit together, and the two non-obvious gotchas you'll hit if you extend them.
- [`docs/FEATURES.md`](docs/FEATURES.md) — a walkthrough of each feature and the code behind it.
- [`docs/GATEWAYS.md`](docs/GATEWAYS.md) — supported gateway protocols and how to add a new one.
- [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md) — running locally, project scripts, and known environment gotchas.
- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) — why this needs a real VM (not serverless), and the $0 Oracle Cloud path in [`deploy/oracle/`](deploy/oracle/README.md).

## Tech stack

Next.js 16 (App Router) on a **custom Node server** (`server.ts`, run via `tsx`, not `next start`) — needed because this app holds long-lived WebSocket connections and shells out to Docker directly. React 19, Tailwind CSS 4, `better-sqlite3` for run history/decisions/benchmarks, `node-pty` + `xterm.js` for the in-browser terminal, `ws` for the WebSocket bridge, and the official MCP SDK for the MCP Servers feature.

## Not built for

Multi-tenant or public hosting as-is: the Sandbox feature runs `docker run`/`docker stop` directly against whatever Docker daemon the server process can reach, and gateway configs hold real API keys in a local JSON file. Fine for personal/local use or a single-operator VM behind auth (see [Deployment](docs/DEPLOYMENT.md)); not fine to expose to the open internet without access control in front of it.
