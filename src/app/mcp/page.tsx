"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { McpServer, McpServerInput, McpTestRun } from "@/lib/db/mcpServers";
import { EmptyResultsState } from "@/components/playground/EmptyResultsState";

function formatRelativeTime(iso: string): string {
  const diffSec = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (diffSec < 5) return "just now";
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return `${Math.round(diffHr / 24)}d ago`;
}

const inputClass =
  "w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-600 transition-colors duration-150 focus:border-cyan-300/40 focus:outline-none focus:ring-2 focus:ring-cyan-300/15";
const labelClass = "block text-sm font-medium text-neutral-300 mb-1.5";

function NewServerForm({ onCreated, onCancel }: { onCreated: () => void; onCancel: () => void }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [transport, setTransport] = useState<"stdio" | "http">("stdio");
  const [command, setCommand] = useState("npx");
  const [argsText, setArgsText] = useState("-y @modelcontextprotocol/server-everything");
  const [url, setUrl] = useState("");
  const [headersText, setHeadersText] = useState("{}");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    setError(null);
    let headers: Record<string, string> | undefined;
    try {
      headers = headersText.trim() ? JSON.parse(headersText) : undefined;
    } catch {
      setError("Headers must be valid JSON");
      return;
    }
    const input: McpServerInput = {
      name,
      description: description || undefined,
      transport,
      command: transport === "stdio" ? command : undefined,
      args: transport === "stdio" ? argsText.split(/\s+/).filter(Boolean) : undefined,
      url: transport === "http" ? url : undefined,
      headers: transport === "http" ? headers : undefined,
    };
    setSubmitting(true);
    try {
      const res = await fetch("/api/mcp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? "Failed to add server");
      }
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="glass-panel animate-fade-up flex flex-col gap-4 rounded-xl p-5">
      <div>
        <label className={labelClass}>Name</label>
        <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Everything (reference server)" />
      </div>
      <div>
        <label className={labelClass}>Description (optional)</label>
        <input className={inputClass} value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>

      <div>
        <label className={labelClass}>Transport</label>
        <div className="flex gap-2">
          {(["stdio", "http"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTransport(t)}
              className={`rounded-lg border px-4 py-2 text-sm transition-colors duration-150 ${
                transport === t
                  ? "border-cyan-300/30 bg-cyan-300/10 text-cyan-100"
                  : "border-white/10 text-neutral-300 hover:border-white/20 hover:bg-white/[0.04]"
              }`}
            >
              {t === "stdio" ? "Local (stdio)" : "Remote (HTTP)"}
            </button>
          ))}
        </div>
        {transport === "stdio" && (
          <p className="mt-2 text-xs text-neutral-500">
            Runs inside the same throwaway Docker container used for the Sandbox -- never executes on your machine.
          </p>
        )}
      </div>

      {transport === "stdio" ? (
        <div className="grid gap-4 sm:grid-cols-[140px_1fr]">
          <div>
            <label className={labelClass}>Command</label>
            <input className={`${inputClass} font-mono`} value={command} onChange={(e) => setCommand(e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Arguments</label>
            <input className={`${inputClass} font-mono`} value={argsText} onChange={(e) => setArgsText(e.target.value)} />
          </div>
        </div>
      ) : (
        <>
          <div>
            <label className={labelClass}>URL</label>
            <input
              className={`${inputClass} font-mono`}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/mcp"
            />
          </div>
          <div>
            <label className={labelClass}>Headers (JSON, optional)</label>
            <textarea className={`${inputClass} font-mono`} rows={2} value={headersText} onChange={(e) => setHeadersText(e.target.value)} />
          </div>
        </>
      )}

      {error && (
        <p className="rounded-lg border border-red-500/20 bg-red-500/[0.07] px-3 py-2 text-sm text-red-300">{error}</p>
      )}

      <div className="flex gap-3">
        <button
          onClick={submit}
          disabled={submitting}
          className="btn-cta rounded-lg px-4 py-2 text-sm font-semibold"
        >
          {submitting ? "Adding..." : "Add server"}
        </button>
        <button
          onClick={onCancel}
          className="rounded-lg border border-white/10 px-4 py-2 text-sm text-neutral-300 transition-colors duration-150 hover:border-white/20 hover:bg-white/[0.04]"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

/** Per-kind identity so a glance at the disclosure tells Tools/Resources/Prompts apart without
 *  reading the label -- matches the dot-chip convention GatewayCard uses for connection status. */
const KIND_DOT: Record<"tools" | "resources" | "prompts", string> = {
  tools: "bg-cyan-300",
  resources: "bg-violet-400",
  prompts: "bg-emerald-400",
};

function CapabilityList({
  kind,
  label,
  items,
}: {
  kind: "tools" | "resources" | "prompts";
  label: string;
  items: unknown[] | undefined;
}) {
  if (!items) return null;
  return (
    <div>
      <p className="mb-1 flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-neutral-600">
        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${KIND_DOT[kind]}`} />
        {label} ({items.length})
      </p>
      {items.length === 0 ? (
        <p className="text-xs text-neutral-600">none</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {items.map((item, i) => {
            const obj = item as { name?: string; description?: string };
            return (
              <li key={i} className="rounded-md border border-white/5 bg-white/[0.02] px-2 py-1 text-xs">
                <span className="font-mono text-cyan-200">{obj.name ?? "(unnamed)"}</span>
                {obj.description && <span className="ml-2 text-neutral-500">{obj.description}</span>}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function McpServerCard({
  server,
  index,
  onDeleted,
}: {
  server: McpServer;
  index: number;
  onDeleted: () => void;
}) {
  const [testRuns, setTestRuns] = useState<McpTestRun[]>([]);
  const [testing, setTesting] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  function loadRuns() {
    fetch(`/api/mcp/${server.id}`)
      .then((res) => res.json())
      .then((body) => setTestRuns(body.testRuns ?? []));
  }

  useEffect(loadRuns, [server.id]);

  async function runTest() {
    setTesting(true);
    try {
      await fetch(`/api/mcp/${server.id}/test`, { method: "POST" });
      loadRuns();
    } finally {
      setTesting(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm(`Remove "${server.name}"?`)) return;
    await fetch(`/api/mcp/${server.id}`, { method: "DELETE" });
    onDeleted();
  }

  const latest = testRuns[0];
  const statusColor = testing
    ? "bg-amber-300"
    : !latest
      ? "bg-neutral-600"
      : latest.success
        ? "bg-emerald-400"
        : "bg-red-400";
  const statusLabel = testing ? "Testing..." : !latest ? "Not tested yet" : latest.success ? "Connected" : "Failed";
  const connectionString =
    server.transport === "stdio" ? `${server.command} ${(server.args ?? []).join(" ")}` : server.url;

  return (
    <div
      className="glass-panel glass-panel-hover animate-fade-up flex flex-col gap-4 rounded-xl p-5"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Link href={`/mcp/${server.id}`} className="truncate text-base font-semibold text-neutral-100 hover:text-cyan-100">
              {server.name}
            </Link>
            <span className="shrink-0 rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-cyan-200/80">
              {server.transport}
            </span>
          </div>
          {server.description && <p className="mt-0.5 truncate text-xs text-neutral-500">{server.description}</p>}
        </div>
        <div
          className="flex shrink-0 items-center gap-1.5 rounded-full border border-white/10 bg-black/20 px-2.5 py-1"
          title={latest?.errorMessage}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${statusColor} ${testing ? "animate-pulse" : ""}`} />
          <span className="text-[11px] text-neutral-300">{statusLabel}</span>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-white/5 bg-black/20 px-3 py-2.5">
          <p className="text-[10px] uppercase tracking-wide text-neutral-500">Connection</p>
          <p className="mt-1 truncate font-mono text-xs text-neutral-200">{connectionString}</p>
        </div>
        <div className="rounded-lg border border-white/5 bg-black/20 px-3 py-2.5">
          <p className="text-[10px] uppercase tracking-wide text-neutral-500">Last tested</p>
          <p className="mt-1 text-xs text-neutral-200">
            {latest ? formatRelativeTime(latest.createdAt) : "—"}
            {latest && !testing && ` · ${latest.latencyMs}ms`}
          </p>
        </div>
      </div>

      {latest?.errorMessage && (
        <p className="rounded-lg border border-red-500/20 bg-red-500/[0.07] px-3 py-2 text-xs text-red-300">
          {latest.errorMessage}
        </p>
      )}

      {latest?.success && (
        // <details> instead of a JS-toggled panel so the capability list stays collapsed by
        // default but is still in the DOM -- browser find-in-page (Cmd/Ctrl+F) can search it
        // and will auto-expand this block when it matches, unlike state-gated conditional
        // rendering which removes the content entirely while closed.
        <details className="group">
          <summary className="flex cursor-pointer list-none items-center gap-1.5 text-xs text-neutral-500 transition-colors duration-150 hover:text-neutral-300 [&::-webkit-details-marker]:hidden">
            <svg
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              className="h-3 w-3 shrink-0 transition-transform duration-200 group-open:rotate-90"
            >
              <path d="M6 3l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>Capabilities</span>
            <span className="text-neutral-600">
              ({(latest.tools ?? []).length} tools, {(latest.resources ?? []).length} resources,{" "}
              {(latest.prompts ?? []).length} prompts)
            </span>
          </summary>
          <div className="mt-3 grid gap-3 rounded-lg border border-white/5 bg-white/[0.015] p-3 sm:grid-cols-3">
            <CapabilityList kind="tools" label="Tools" items={latest.tools} />
            <CapabilityList kind="resources" label="Resources" items={latest.resources} />
            <CapabilityList kind="prompts" label="Prompts" items={latest.prompts} />
          </div>
        </details>
      )}

      {testRuns.length > 1 && (
        <div>
          <button
            onClick={() => setShowHistory((s) => !s)}
            className="text-xs text-neutral-500 underline decoration-neutral-700 underline-offset-2 hover:text-neutral-300"
          >
            {showHistory ? "Hide" : "Show"} history ({testRuns.length})
          </button>
          {showHistory && (
            <div className="mt-2 flex flex-col gap-1 border-t border-white/5 pt-2">
              {testRuns.slice(1).map((run) => (
                <div key={run.id} className="flex items-center gap-3 text-xs text-neutral-500">
                  <span className={run.success ? "text-emerald-400" : "text-red-400"}>{run.success ? "ok" : "failed"}</span>
                  <span>{run.latencyMs}ms</span>
                  <span>{new Date(run.createdAt).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-2 pt-1">
        <Link
          href={`/mcp/${server.id}`}
          className="rounded-lg border border-white/10 px-3 py-1.5 text-sm text-neutral-300 transition-colors duration-150 hover:border-white/20 hover:bg-white/[0.04]"
        >
          Open
        </Link>
        <button
          onClick={runTest}
          disabled={testing}
          className="rounded-lg border border-white/10 px-3 py-1.5 text-sm text-neutral-300 transition-colors duration-150 hover:border-white/20 hover:bg-white/[0.04] disabled:opacity-50"
        >
          {testing ? "Testing..." : "Test connection"}
        </button>
        <button
          onClick={handleDelete}
          className="rounded-lg border border-red-500/20 px-3 py-1.5 text-sm text-red-300 transition-colors duration-150 hover:bg-red-500/10"
        >
          Remove
        </button>
      </div>
    </div>
  );
}

export default function McpPage() {
  const [servers, setServers] = useState<McpServer[] | null>(null);
  const [showForm, setShowForm] = useState(false);

  function reload() {
    fetch("/api/mcp")
      .then((res) => res.json())
      .then(setServers);
  }

  useEffect(reload, []);

  return (
    <div className="flex flex-col gap-8">
      <div className="animate-fade-up flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-50">MCP Servers</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-neutral-400">
            Register MCP servers, test the connection live, and see exactly which tools/resources/prompts each one
            exposes before wiring it into a real agent config.
          </p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="btn-cta shrink-0 rounded-lg px-4 py-2 text-sm font-semibold"
          >
            Add server
          </button>
        )}
      </div>

      {showForm && (
        <NewServerForm
          onCreated={() => {
            setShowForm(false);
            reload();
          }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {servers === null ? (
        <div className="animate-shimmer h-3 w-[40%] rounded-full" />
      ) : servers.length === 0 ? (
        <EmptyResultsState
          title="No MCP servers yet"
          description="Register a server above to test its connection and start calling its tools, resources, and prompts."
        />
      ) : (
        <div className="flex flex-col gap-3">
          {servers.map((s, i) => (
            <McpServerCard key={s.id} server={s} index={i} onDeleted={reload} />
          ))}
        </div>
      )}
    </div>
  );
}
