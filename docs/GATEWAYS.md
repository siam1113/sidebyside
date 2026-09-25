# Gateways

A "gateway" (`GatewayConfig` in `src/lib/gateways/types.ts`) is just: a
protocol, a base URL, an API key, and a default model. Configs are added
through **Settings** and stored in gitignored `data/gateways.json` — nothing
here is a real backend service, "gateway" just means "an LLM API endpoint
this app knows how to talk to."

## Supported protocols

| `protocol` | Talks to | Notes |
|---|---|---|
| `openai` | Any OpenAI-compatible chat completions API | Also what you point at LiteLLM/OpenRouter/Portkey-style proxies, since most speak this shape. |
| `anthropic` | Anthropic Messages API | Required if you want to drive the Sandbox's Claude Code CLI (`src/lib/sandbox/envMapping.ts` hard-requires this protocol for the `claude` tool). |
| `azure-openai` | Azure OpenAI | Wire-compatible with `openai`'s chat completions shape, just reached through a deployment-scoped URL (`AzureOptions.deployment` + `.apiVersion`). |
| `google-gemini` | Google Gemini API | |
| `custom` | Anything else | User-authored request: `method`, `url`, `headers`, and a `bodyTemplate`/`responsePath` (see below). No tool-calling, no Sandbox/MCP integration — there's no fixed contract to hook those into. |
| `typesafe-eval` | TypeSafe AI's System One evaluation API | Not a chat protocol at all — only usable from the Evaluation tab, not Chat/Sandbox/MCP. |

Every protocol funnels through `runGateway()` /
`runGatewayWithTools()` in `src/lib/gateways/adapters/index.ts`; nothing
else in the app should call an adapter module directly.

### What each protocol supports

`PROTOCOL_PARAM_SUPPORT` and `TOOL_CAPABLE()`/`CHAT_CAPABLE()` in
`src/lib/gateways/types.ts` are the source of truth:

- `openai`, `anthropic`, `azure-openai`, `google-gemini`: full `RunParams`
  (temperature, maxTokens, topP, systemPrompt, stopSequences) and tool
  calling.
- `custom`: none of the above guaranteed — params are passed as
  `{{...}}` template variables only if your template happens to reference
  them.
- `typesafe-eval`: not chat-capable at all; it only answers structured
  yes/no, multiple-choice, or score questions (see `EvalQuestion` in
  `types.ts`).

### `custom` gateway templates

A custom gateway's request is built by interpolating `{{baseUrl}}`,
`{{apiKey}}`, `{{prompt}}`, `{{model}}`, and (best-effort) the run params
into `url`, `headers`, and `bodyTemplate`. The reply is pulled back out of
the raw JSON response with a dot-path (`responsePath`, e.g.
`choices.0.message.content`). See `src/lib/gateways/adapters/custom.ts`.
Text-like attachments get folded into `{{prompt}}`; anything else (images,
binary files) is silently dropped with a warning, since there's no stable
place to inject media into an arbitrary template.

## Model listings, pricing, and health checks

- **Model listing** (`src/lib/gateways/adapters/models.ts`) — each protocol
  knows how to list its own models (context window, output cap, modality)
  where the provider's API supports it.
- **Pricing** (`src/lib/pricing/openrouter.ts`) — cost-per-million-token
  figures come from OpenRouter's public model catalog (no auth required),
  matched by model ID, and cached in the `model_pricing` SQLite table. You
  can also override pricing manually per gateway+model (`source: "manual"`
  rows in the same table) — useful for gateways OpenRouter doesn't cover.
- **Health checks** (`src/lib/gateways/healthCheck.ts`) — if
  `healthCheckEnabled` is set on a gateway, `server.ts` pings it with a
  model-list call (no completion cost) every 5 minutes and records the
  latency/success to the `latency_samples` table that backs the Insights
  latency dashboard.

## Adding a new protocol

1. Add the value to `GatewayProtocol` in `src/lib/gateways/types.ts`, and
   its entry in `PROTOCOL_PARAM_SUPPORT` (and `TOOL_CAPABLE`/`CHAT_CAPABLE`
   if applicable).
2. Create `src/lib/gateways/adapters/<protocol>.ts` exporting `run()` (and
   `runWithTools()` if it supports tool calling) with the same signature as
   the existing adapters.
3. Wire both into the `switch` statements in
   `src/lib/gateways/adapters/index.ts` — this is the only place that needs
   to know every protocol exists.
4. If it should list models for Insights, add a case in
   `src/lib/gateways/adapters/models.ts`.
5. If it should be usable from Sandbox, add a mapping in
   `src/lib/sandbox/envMapping.ts` for whichever CLI tool(s) it's compatible
   with.

TypeScript's exhaustiveness check in `adapters/index.ts` (`const
exhaustiveCheck: never = config.protocol`) will fail to compile if you add a
protocol without handling it there — that's intentional, not a bug to work
around.
