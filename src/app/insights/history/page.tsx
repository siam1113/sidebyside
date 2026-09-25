"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { InsightsTabs } from "@/components/InsightsTabs";
import { EmptyResultsState } from "@/components/playground/EmptyResultsState";
import type { RunHistoryEntry, RunHistoryKind } from "@/lib/db/runHistory";

const KINDS: { value: RunHistoryKind | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "chat", label: "Chat" },
  { value: "evaluate", label: "Evaluate" },
  { value: "embed", label: "Embed" },
  { value: "image", label: "Image" },
];

function relativeTime(iso: string): string {
  const deltaMs = Date.now() - new Date(iso).getTime();
  const seconds = Math.max(0, Math.round(deltaMs / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export default function InsightsHistoryPage() {
  const [entries, setEntries] = useState<RunHistoryEntry[] | null>(null);
  const [kind, setKind] = useState<RunHistoryKind | "all">("all");
  const [onlyFailed, setOnlyFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams();
    if (kind !== "all") params.set("kind", kind);
    if (onlyFailed) params.set("success", "false");
    params.set("limit", "200");
    fetch(`/api/run-history?${params}`)
      .then((res) => res.json())
      .then((body) => {
        if (!cancelled) setEntries(body.entries);
      });
    return () => {
      cancelled = true;
    };
  }, [kind, onlyFailed]);

  return (
    <div className="flex flex-col gap-8 lg:h-full lg:min-h-0">
      <div className="animate-fade-up flex flex-col gap-1.5 shrink-0">
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-50">Insights</h1>
        <p className="max-w-xl text-sm text-neutral-400">
          Every chat, evaluation, embedding, and image run made through any gateway -- persisted, so it survives a
          refresh.
        </p>
      </div>

      <div className="animate-fade-up shrink-0">
        <InsightsTabs />
      </div>

      <div className="animate-fade-up flex shrink-0 flex-wrap items-center gap-3">
        <div className="flex gap-1 rounded-lg border border-white/10 bg-white/[0.03] p-1">
          {KINDS.map((k) => (
            <button
              key={k.value}
              onClick={() => setKind(k.value)}
              className={`rounded-md px-3 py-1.5 text-xs transition-colors duration-150 ${
                kind === k.value ? "bg-cyan-300/10 text-cyan-100" : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              {k.label}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-xs text-neutral-400">
          <input type="checkbox" checked={onlyFailed} onChange={(e) => setOnlyFailed(e.target.checked)} />
          Failed only
        </label>
      </div>

      {entries === null ? (
        <EmptyResultsState title="Loading history…" description="Fetching past runs." />
      ) : entries.length === 0 ? (
        <EmptyResultsState
          title="No runs yet"
          description="Chat, Evaluation, Embeddings, and Image runs will show up here as you make them."
        />
      ) : (
        <div className="min-w-0 flex-1 overflow-x-auto rounded-lg border border-white/5 lg:min-h-0 lg:overflow-y-auto">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead>
              <tr className="bg-white/[0.03]">
                {["When", "Kind", "Gateway", "Model", "Status", "Latency", "Preview"].map((h) => (
                  <th
                    key={h}
                    className="sticky top-0 border-b border-white/10 bg-[var(--surface-1)] px-3 py-2 text-left text-[11px] font-medium uppercase tracking-wide text-neutral-500"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.id} className="odd:bg-white/[0.015]">
                  <td className="whitespace-nowrap border-b border-white/5 px-3 py-2 text-xs text-neutral-500">
                    {relativeTime(e.createdAt)}
                  </td>
                  <td className="border-b border-white/5 px-3 py-2 text-xs capitalize text-neutral-300">{e.kind}</td>
                  <td className="border-b border-white/5 px-3 py-2 text-xs text-neutral-300">{e.gatewayName}</td>
                  <td className="border-b border-white/5 px-3 py-2 font-mono text-xs text-neutral-400">
                    {e.model ?? "—"}
                  </td>
                  <td className="border-b border-white/5 px-3 py-2 text-xs">
                    <span className={e.success ? "text-emerald-300" : "text-red-300"}>
                      {e.success ? "Success" : "Failed"}
                    </span>
                  </td>
                  <td className="border-b border-white/5 px-3 py-2 font-mono text-xs text-neutral-400">
                    {e.latencyMs != null ? `${e.latencyMs}ms` : "—"}
                  </td>
                  <td className="max-w-xs truncate border-b border-white/5 px-3 py-2 text-xs text-neutral-400">
                    <Link href={`/insights/history/${e.id}`} className="hover:text-cyan-200 hover:underline">
                      {e.promptPreview || "(no preview)"}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
