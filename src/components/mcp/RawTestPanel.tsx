"use client";

import { useState } from "react";
import { extractMcpText, isMcpError } from "./mcpFormat";
import { generateExamplePromptArgs, generateExampleToolArgs } from "./jsonSchemaExample";

const inputClass =
  "w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-600 transition-colors duration-150 focus:border-cyan-300/40 focus:outline-none focus:ring-2 focus:ring-cyan-300/15";

interface McpToolInfo {
  name: string;
  description?: string;
  inputSchema?: unknown;
}
interface McpResourceInfo {
  uri: string;
  name?: string;
  description?: string;
}
interface McpPromptInfo {
  name: string;
  description?: string;
  arguments?: unknown;
}

type CallState = { status: "idle" } | { status: "loading" } | { status: "done"; result: unknown; latencyMs: number } | { status: "error"; message: string };

function CallResultView({ state }: { state: CallState }) {
  if (state.status === "idle") return null;
  if (state.status === "loading") return <p className="text-xs text-neutral-500">Calling...</p>;
  if (state.status === "error") {
    return <p className="rounded-lg border border-red-500/20 bg-red-500/[0.07] px-3 py-2 text-sm text-red-300">{state.message}</p>;
  }
  const text = extractMcpText(state.result);
  const errored = isMcpError(state.result);
  return (
    <div className={`rounded-lg border p-3 ${errored ? "border-red-500/20 bg-red-500/[0.05]" : "border-white/5 bg-white/[0.02]"}`}>
      <div className="mb-1 flex items-center justify-between text-[10px] uppercase tracking-wide">
        <span className={errored ? "text-red-300" : "text-neutral-500"}>{errored ? "Error result" : "Result"}</span>
        <span className="text-neutral-600">{state.latencyMs}ms</span>
      </div>
      {text && <p className="mb-2 whitespace-pre-wrap text-sm text-neutral-200">{text}</p>}
      <pre className="max-h-64 overflow-auto rounded-md border border-white/5 bg-black/40 p-2 text-[11px] leading-relaxed text-neutral-300">
        {JSON.stringify(state.result, null, 2)}
      </pre>
    </div>
  );
}

function argsTextFor(tool: McpToolInfo | undefined): string {
  return tool ? JSON.stringify(generateExampleToolArgs(tool.inputSchema), null, 2) : "{}";
}

function ToolsSection({ serverId, tools }: { serverId: string; tools: McpToolInfo[] }) {
  const [selected, setSelected] = useState<string | null>(tools[0]?.name ?? null);
  const [argsText, setArgsText] = useState(() => argsTextFor(tools[0]));
  const [state, setState] = useState<CallState>({ status: "idle" });
  const tool = tools.find((t) => t.name === selected);

  async function call() {
    if (!tool) return;
    let args: unknown;
    try {
      args = argsText.trim() ? JSON.parse(argsText) : {};
    } catch {
      setState({ status: "error", message: "Arguments must be valid JSON" });
      return;
    }
    setState({ status: "loading" });
    try {
      const res = await fetch(`/api/mcp/${serverId}/tools/call`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: tool.name, args }),
      });
      const body = await res.json();
      if (body.success) setState({ status: "done", result: body.result, latencyMs: body.latencyMs });
      else setState({ status: "error", message: body.errorMessage ?? "Call failed" });
    } catch (err) {
      setState({ status: "error", message: err instanceof Error ? err.message : String(err) });
    }
  }

  if (tools.length === 0) return <p className="text-sm text-neutral-500">No tools exposed by this server.</p>;

  return (
    <div className="grid gap-4 sm:grid-cols-[200px_1fr]">
      <div className="flex flex-col gap-1">
        {tools.map((t) => (
          <button
            key={t.name}
            type="button"
            onClick={() => {
              setSelected(t.name);
              setArgsText(argsTextFor(t));
              setState({ status: "idle" });
            }}
            className={`rounded-md px-2 py-1.5 text-left font-mono text-xs transition-colors duration-150 ${
              selected === t.name ? "bg-cyan-300/10 text-cyan-100" : "text-neutral-400 hover:bg-white/[0.04]"
            }`}
          >
            {t.name}
          </button>
        ))}
      </div>
      {tool && (
        <div className="flex flex-col gap-3">
          {tool.description && <p className="text-xs text-neutral-500">{tool.description}</p>}
          {tool.inputSchema !== undefined && (
            <div>
              <p className="mb-1 text-[10px] uppercase tracking-wide text-neutral-600">Input schema</p>
              <pre className="max-h-40 overflow-auto rounded-md border border-white/5 bg-black/40 p-2 text-[11px] leading-relaxed text-neutral-400">
                {JSON.stringify(tool.inputSchema, null, 2)}
              </pre>
            </div>
          )}
          <div>
            <p className="mb-1 text-[10px] uppercase tracking-wide text-neutral-600">Arguments (JSON)</p>
            <p className="mb-1.5 text-xs text-neutral-500">
              Pre-filled with example values based on the schema above -- text in{" "}
              <span className="font-mono text-neutral-400">{"<angle brackets>"}</span> is a placeholder describing
              what goes there. Replace each placeholder with a real value (keep the quotes for text), then click
              &ldquo;Call tool&rdquo;.
            </p>
            <textarea
              rows={3}
              value={argsText}
              onChange={(e) => setArgsText(e.target.value)}
              className={`${inputClass} font-mono`}
            />
          </div>
          <button
            onClick={call}
            disabled={state.status === "loading"}
            className="btn-cta self-start rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-50"
          >
            {state.status === "loading" ? "Calling..." : "Call tool"}
          </button>
          <CallResultView state={state} />
        </div>
      )}
    </div>
  );
}

function ResourcesSection({ serverId, resources }: { serverId: string; resources: McpResourceInfo[] }) {
  const [selected, setSelected] = useState<string | null>(resources[0]?.uri ?? null);
  const [state, setState] = useState<CallState>({ status: "idle" });

  async function read() {
    if (!selected) return;
    setState({ status: "loading" });
    try {
      const res = await fetch(`/api/mcp/${serverId}/resources/read`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uri: selected }),
      });
      const body = await res.json();
      if (body.success) setState({ status: "done", result: body.result, latencyMs: body.latencyMs });
      else setState({ status: "error", message: body.errorMessage ?? "Read failed" });
    } catch (err) {
      setState({ status: "error", message: err instanceof Error ? err.message : String(err) });
    }
  }

  if (resources.length === 0) return <p className="text-sm text-neutral-500">No resources exposed by this server.</p>;

  return (
    <div className="grid gap-4 sm:grid-cols-[240px_1fr]">
      <div className="flex flex-col gap-1">
        {resources.map((r) => (
          <button
            key={r.uri}
            type="button"
            onClick={() => {
              setSelected(r.uri);
              setState({ status: "idle" });
            }}
            className={`rounded-md px-2 py-1.5 text-left transition-colors duration-150 ${
              selected === r.uri ? "bg-cyan-300/10 text-cyan-100" : "text-neutral-400 hover:bg-white/[0.04]"
            }`}
          >
            <span className="block truncate text-xs font-mono">{r.uri}</span>
            {r.name && <span className="block truncate text-[10px] text-neutral-600">{r.name}</span>}
          </button>
        ))}
      </div>
      <div className="flex flex-col gap-3">
        <button
          onClick={read}
          disabled={state.status === "loading" || !selected}
          className="btn-cta self-start rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-50"
        >
          {state.status === "loading" ? "Reading..." : "Read resource"}
        </button>
        <CallResultView state={state} />
      </div>
    </div>
  );
}

function argsTextForPrompt(prompt: McpPromptInfo | undefined): string {
  return prompt ? JSON.stringify(generateExamplePromptArgs(prompt.arguments), null, 2) : "{}";
}

function PromptsSection({ serverId, prompts }: { serverId: string; prompts: McpPromptInfo[] }) {
  const [selected, setSelected] = useState<string | null>(prompts[0]?.name ?? null);
  const [argsText, setArgsText] = useState(() => argsTextForPrompt(prompts[0]));
  const [state, setState] = useState<CallState>({ status: "idle" });
  const prompt = prompts.find((p) => p.name === selected);

  async function get() {
    if (!prompt) return;
    let args: Record<string, string> | undefined;
    try {
      args = argsText.trim() ? JSON.parse(argsText) : undefined;
    } catch {
      setState({ status: "error", message: "Arguments must be valid JSON" });
      return;
    }
    setState({ status: "loading" });
    try {
      const res = await fetch(`/api/mcp/${serverId}/prompts/get`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: prompt.name, args }),
      });
      const body = await res.json();
      if (body.success) setState({ status: "done", result: body.result, latencyMs: body.latencyMs });
      else setState({ status: "error", message: body.errorMessage ?? "Get prompt failed" });
    } catch (err) {
      setState({ status: "error", message: err instanceof Error ? err.message : String(err) });
    }
  }

  if (prompts.length === 0) return <p className="text-sm text-neutral-500">No prompts exposed by this server.</p>;

  return (
    <div className="grid gap-4 sm:grid-cols-[200px_1fr]">
      <div className="flex flex-col gap-1">
        {prompts.map((p) => (
          <button
            key={p.name}
            type="button"
            onClick={() => {
              setSelected(p.name);
              setArgsText(argsTextForPrompt(p));
              setState({ status: "idle" });
            }}
            className={`rounded-md px-2 py-1.5 text-left font-mono text-xs transition-colors duration-150 ${
              selected === p.name ? "bg-cyan-300/10 text-cyan-100" : "text-neutral-400 hover:bg-white/[0.04]"
            }`}
          >
            {p.name}
          </button>
        ))}
      </div>
      {prompt && (
        <div className="flex flex-col gap-3">
          {prompt.description && <p className="text-xs text-neutral-500">{prompt.description}</p>}
          {prompt.arguments !== undefined && (
            <div>
              <p className="mb-1 text-[10px] uppercase tracking-wide text-neutral-600">Arguments schema</p>
              <pre className="max-h-40 overflow-auto rounded-md border border-white/5 bg-black/40 p-2 text-[11px] leading-relaxed text-neutral-400">
                {JSON.stringify(prompt.arguments, null, 2)}
              </pre>
            </div>
          )}
          <div>
            <p className="mb-1 text-[10px] uppercase tracking-wide text-neutral-600">Arguments (JSON object of strings)</p>
            <p className="mb-1.5 text-xs text-neutral-500">
              Pre-filled with a placeholder for each argument, describing what to put there. Replace each{" "}
              <span className="font-mono text-neutral-400">{"<...>"}</span> placeholder with real text (every value
              must stay a string), then click &ldquo;Get prompt&rdquo;.
            </p>
            <textarea
              rows={3}
              value={argsText}
              onChange={(e) => setArgsText(e.target.value)}
              className={`${inputClass} font-mono`}
            />
          </div>
          <button
            onClick={get}
            disabled={state.status === "loading"}
            className="btn-cta self-start rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-50"
          >
            {state.status === "loading" ? "Fetching..." : "Get prompt"}
          </button>
          <CallResultView state={state} />
        </div>
      )}
    </div>
  );
}

export function RawTestPanel({
  serverId,
  tools,
  resources,
  prompts,
}: {
  serverId: string;
  tools?: unknown[];
  resources?: unknown[];
  prompts?: unknown[];
}) {
  const [section, setSection] = useState<"tools" | "resources" | "prompts">("tools");

  if (!tools && !resources && !prompts) {
    return (
      <p className="text-sm text-neutral-500">
        Run &ldquo;Test connection&rdquo; on the Capabilities tab first to discover what this server exposes.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        {(["tools", "resources", "prompts"] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSection(s)}
            className={`rounded-lg border px-3 py-1.5 text-xs capitalize transition-colors duration-150 ${
              section === s
                ? "border-cyan-300/30 bg-cyan-300/10 text-cyan-100"
                : "border-white/10 text-neutral-400 hover:border-white/20 hover:bg-white/[0.04]"
            }`}
          >
            {s} ({(s === "tools" ? tools : s === "resources" ? resources : prompts)?.length ?? 0})
          </button>
        ))}
      </div>

      {section === "tools" && <ToolsSection serverId={serverId} tools={(tools ?? []) as McpToolInfo[]} />}
      {section === "resources" && <ResourcesSection serverId={serverId} resources={(resources ?? []) as McpResourceInfo[]} />}
      {section === "prompts" && <PromptsSection serverId={serverId} prompts={(prompts ?? []) as McpPromptInfo[]} />}
    </div>
  );
}
