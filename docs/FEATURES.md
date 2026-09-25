# Features

## Playground (`/playground`)

Send one prompt to several configured gateways at once and compare the
replies side by side. Under the hood, `POST /api/run/[gatewayId]` calls
`runGateway()` (see [`docs/GATEWAYS.md`](GATEWAYS.md)) per selected gateway
in parallel; each result carries latency, token usage, and the captured
raw request/response for a "show me exactly what was sent" view. Every run
is written to the `run_history` table so it shows up later in Insights'
history view.

Sibling tabs share the same run-history pattern for other request shapes:

- **Images** (`/playground/images`) — `POST /api/image/[gatewayId]`, results
  as either remote URLs or `data:` URIs.
- **Embeddings** (`/playground/embeddings`) — `POST /api/embed/[gatewayId]`.
- **Evaluation** (`/playground/evaluation`) — drives `typesafe-eval`
  gateways' structured question/answer API (`POST /api/evaluate/[gatewayId]`)
  directly; this is also what Benchmarks' "judge" grading strategy calls
  under the hood (see below).

`src/components/playground/variantEngine.ts` supports running prompt
*variants* (e.g. sweeping a parameter or template placeholder) across the
same gateway set in one batch — that's the "Variants" panel.

## Insights (`/insights`)

Every model across every configured gateway in one table: context window,
output cap, modality, and cost per million tokens. Model metadata comes
from each protocol's own listing endpoint
(`src/lib/gateways/adapters/models.ts`); pricing is matched in from
OpenRouter's public catalog or a manual override (see
[`docs/GATEWAYS.md`](GATEWAYS.md#model-listings-pricing-and-health-checks)).
`/insights/latency` and `/insights/cost` chart the `latency_samples` and
`run_history` tables over time; `/insights/history` is a raw browsable log
of every run ever made in the Playground.

## Sandbox (`/sandbox`)

Launches Claude Code, Codex CLI, or Copilot CLI inside a throwaway,
locked-down Docker container, wired to a gateway of your choice, driven from
an in-browser `xterm.js` terminal over a WebSocket. See
[`docs/ARCHITECTURE.md#sandbox-containers-not-subprocesses`](ARCHITECTURE.md#sandbox-containers-not-subprocesses)
for the full mechanics. Two entry points:

- **Single session** (`/sandbox`) — pick a tool, gateway, and model; get one
  terminal.
- **Compare** (`/sandbox/compare/[groupId]`) — launch several tools against
  the same prompt under a shared `groupId`, terminals side by side, to
  compare how different CLI harnesses handle the same task.

The Active Sessions panel polls `GET /api/sandbox/sessions` and can reattach
to any still-running session — a session's lifetime is independent of the
browser tab that started it (see the docstring on `attachPty` in
`ptyBridge.ts`).

## Benchmarks (`/benchmarks`)

Define a suite of prompt test cases, run them across a chosen set of
gateway configs, and grade every resulting cell. Two grading strategies
(`src/lib/benchmarks/grade.ts`):

- **Assertion** — deterministic: `contains`/`not-contains`/`equals`/`regex`
  against the response text. Instant, free, no extra API call.
- **Judge** — sends the prompt+response to a `typesafe-eval` gateway with a
  rubric and a 1–5 scoring question; passes if the score clears
  `passThreshold`.

`src/lib/benchmarks/techniques.ts` ships a library of pre-built test cases
(safety/robustness, quality/correctness, consistency/bias) you can drop into
a suite instead of writing prompts from scratch — each one bundles a prompt
template, suggested `RunParams`, and a grading strategy. Suites and their
run history live in the `bench_suites`/`bench_runs` tables; `/benchmarks/history`
browses past runs, `/benchmarks/execution` is the live run view.

## Decisions (`/decisions`)

A lightweight ADR-style log: title, which gateway/model was actually chosen,
rationale, alternatives considered, and links back to specific run IDs that
backed the choice up. Pure CRUD over the `decisions` table
(`src/lib/db/decisions.ts`) — no adapters or external calls involved. Useful
after a Benchmarks run or a Playground comparison session, to record *why*
a particular model won instead of leaving that context to fade.

## MCP Servers (`/mcp`)

Register an MCP server (stdio or HTTP transport), test the connection, and
inspect what it exposes:

- **Test connection** — `probeMcpServer()` lists tools/resources/prompts and
  records latency/success to `mcp_test_runs`.
- **Raw test panel** — call a tool, read a resource, or fetch a prompt
  directly, inspecting the raw MCP response.
- **LLM test panel / agent transcript** — `runMcpAgent()`
  (`src/lib/mcp/agentLoop.ts`) binds the server's tools to a chosen gateway
  and runs a real multi-turn tool-calling loop (default max 8 turns) so you
  can see how an actual model uses the server's tools, not just that they
  respond to a direct call. Recorded to `mcp_agent_runs`.

stdio-transport servers run inside the same sandbox container image as the
Sandbox feature rather than being exec'd on the host — see
[`docs/ARCHITECTURE.md#mcp-integration`](ARCHITECTURE.md#mcp-integration).

## Learn (`/learn`)

Self-contained lessons covering the concepts the rest of the app assumes:
gateways, tokens/context windows, evaluation, tools/agents, and putting it
all together — plus a per-lesson quiz, a per-module test, and a final exam.
Content is static (`src/lib/learn/modules/*.ts`, `src/lib/learn/content.ts`),
progress is tracked client-side (`useLearnProgress.ts`). No prior AI
knowledge assumed — this is meant to be a genuinely standalone way to learn
the domain, not just in-app help text.

## Settings (`/settings`)

CRUD for gateway configs (`GatewayCard`/`GatewayForm` components), backed by
`src/lib/gateways/store.ts` → `data/gateways.json`. This is the only place
API keys are entered; every other feature reads gateways by ID, never
re-prompts for a key.
