"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { McpServer, McpTestRun } from "@/lib/db/mcpServers";
import { RawTestPanel } from "@/components/mcp/RawTestPanel";
import { LlmTestPanel } from "@/components/mcp/LlmTestPanel";

/** Same per-kind color convention as the server list's capability disclosure, so a server's
 *  identity for "what kind of thing is this" stays consistent whether you're scanning the list
 *  or looking at one server's Capabilities tab. */
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
            const obj = item as { name?: string; uri?: string; description?: string };
            return (
              <li key={i} className="rounded-md border border-white/5 bg-white/[0.02] px-2 py-1 text-xs">
                <span className="font-mono text-cyan-200">{obj.name ?? obj.uri ?? "(unnamed)"}</span>
                {obj.description && <span className="ml-2 text-neutral-500">{obj.description}</span>}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard.writeText(text).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        });
      }}
      className="shrink-0 rounded-md p-1 text-neutral-600 transition-colors duration-150 hover:bg-white/[0.06] hover:text-neutral-300"
      aria-label="Copy connection string"
      title="Copy"
    >
      {copied ? (
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3.5 w-3.5 text-emerald-300">
          <path d="M3 8.5l3 3 7-7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-3.5 w-3.5">
          <rect x="5.5" y="5.5" width="8" height="8" rx="1.5" />
          <path d="M3.5 10.5h-1a1 1 0 0 1-1-1v-6a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v1" />
        </svg>
      )}
    </button>
  );
}

const TABS = ["capabilities", "raw", "llm"] as const;
type Tab = (typeof TABS)[number];
const TAB_LABEL: Record<Tab, string> = { capabilities: "Capabilities", raw: "Raw", llm: "LLM Test" };

export default function McpServerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [server, setServer] = useState<McpServer | null>(null);
  const [testRuns, setTestRuns] = useState<McpTestRun[]>([]);
  const [testing, setTesting] = useState(false);
  const [tab, setTab] = useState<Tab>("capabilities");
  const [notFound, setNotFound] = useState(false);

  function reload() {
    fetch(`/api/mcp/${id}`)
      .then((res) => {
        if (!res.ok) {
          setNotFound(true);
          throw new Error("not found");
        }
        return res.json();
      })
      .then((body) => {
        setServer(body.server);
        setTestRuns(body.testRuns ?? []);
      })
      .catch(() => {});
  }

  useEffect(reload, [id]);

  async function runTest() {
    setTesting(true);
    try {
      await fetch(`/api/mcp/${id}/test`, { method: "POST" });
      reload();
    } finally {
      setTesting(false);
    }
  }

  if (notFound) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-neutral-400">MCP server not found.</p>
        <Link href="/mcp" className="text-cyan-200 underline decoration-cyan-200/30 underline-offset-2 hover:text-cyan-100">
          Back to MCP servers
        </Link>
      </div>
    );
  }

  if (!server) {
    return <div className="animate-shimmer h-3 w-[40%] rounded-full" />;
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
    server.transport === "stdio" ? `${server.command} ${(server.args ?? []).join(" ")}` : (server.url ?? "");

  return (
    <div className="flex flex-col gap-6">
      <div className="animate-fade-up flex flex-col gap-3">
        <Link href="/mcp" className="w-fit text-xs text-neutral-500 hover:text-neutral-300">
          ← MCP servers
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-2xl font-semibold tracking-tight text-neutral-50">{server.name}</h1>
              <span className="shrink-0 rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-cyan-200/80">
                {server.transport}
              </span>
            </div>
            {server.description && <p className="mt-1 text-sm text-neutral-500">{server.description}</p>}
            <div className="mt-2 flex items-center gap-1">
              <p className="truncate font-mono text-xs text-neutral-600">{connectionString}</p>
              <CopyButton text={connectionString} />
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2">
            <div
              className="flex items-center gap-1.5 rounded-full border border-white/10 bg-black/20 px-2.5 py-1"
              title={latest?.errorMessage}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${statusColor} ${testing ? "animate-pulse" : ""}`} />
              <span className="text-[11px] text-neutral-300">{statusLabel}</span>
            </div>
            <button
              onClick={runTest}
              disabled={testing}
              className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-neutral-300 transition-colors duration-150 hover:border-cyan-300/30 hover:text-cyan-100 disabled:opacity-50"
            >
              {testing ? "Testing..." : "Test connection"}
            </button>
          </div>
        </div>
        {latest?.errorMessage && (
          <p className="rounded-lg border border-red-500/20 bg-red-500/[0.07] px-3 py-2 text-xs text-red-300">
            {latest.errorMessage}
          </p>
        )}
      </div>

      <div className="flex w-fit gap-1 rounded-lg border border-white/10 bg-white/[0.03] p-1">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-md px-3 py-1.5 text-sm transition-colors duration-150 ${
              tab === t ? "bg-cyan-300/10 text-cyan-100" : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            {TAB_LABEL[t]}
          </button>
        ))}
      </div>

      {tab === "capabilities" && (
        <div className="flex flex-col gap-4">
          {!latest ? (
            <p className="text-sm text-neutral-500">No connection test recorded yet -- click &ldquo;Test connection&rdquo; above.</p>
          ) : latest.success ? (
            <div className="glass-panel grid gap-4 rounded-xl p-5 sm:grid-cols-3">
              <CapabilityList kind="tools" label="Tools" items={latest.tools} />
              <CapabilityList kind="resources" label="Resources" items={latest.resources} />
              <CapabilityList kind="prompts" label="Prompts" items={latest.prompts} />
            </div>
          ) : null}
        </div>
      )}

      {tab === "raw" && (
        <div className="glass-panel rounded-xl p-5">
          <RawTestPanel serverId={server.id} tools={latest?.tools} resources={latest?.resources} prompts={latest?.prompts} />
        </div>
      )}

      {tab === "llm" && <LlmTestPanel serverId={server.id} tools={latest?.tools} />}
    </div>
  );
}
