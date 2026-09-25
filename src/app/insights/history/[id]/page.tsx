"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import type { RunHistoryEntry } from "@/lib/db/runHistory";

export default function RunHistoryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [entry, setEntry] = useState<RunHistoryEntry | null | "loading">("loading");

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/run-history/${id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((body) => {
        if (!cancelled) setEntry(body);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (entry === "loading") {
    return (
      <div className="flex flex-col gap-2">
        <div className="animate-shimmer h-3 w-[40%] rounded-full" />
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-lg font-semibold tracking-tight text-neutral-50">Run not found</h1>
        <Link
          href="/insights/history"
          className="text-sm text-cyan-200 underline decoration-cyan-200/30 underline-offset-2 hover:text-cyan-100"
        >
          Back to History
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="animate-fade-up flex items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-neutral-50 capitalize">{entry.kind} run</h1>
          <p className="mt-0.5 text-xs text-neutral-500">
            {entry.gatewayName} &middot; <span className="font-mono">{entry.model ?? "—"}</span> &middot;{" "}
            {new Date(entry.createdAt).toLocaleString()}
          </p>
        </div>
        <Link
          href="/insights/history"
          className="rounded-lg border border-white/10 px-3 py-1.5 text-sm text-neutral-300 transition-colors duration-150 hover:border-white/20 hover:bg-white/[0.04]"
        >
          Back to History
        </Link>
      </div>

      <div className="glass-panel animate-fade-up flex flex-col gap-4 rounded-xl p-5" style={{ animationDelay: "60ms" }}>
        <div className="flex flex-wrap gap-6 text-xs text-neutral-400">
          <span>
            Status:{" "}
            <span className={entry.success ? "text-emerald-300" : "text-red-300"}>
              {entry.success ? "Success" : "Failed"}
            </span>
          </span>
          <span>Latency: <span className="font-mono text-neutral-300">{entry.latencyMs ?? "—"}ms</span></span>
          {entry.usage && (
            <span className="font-mono text-neutral-300">{JSON.stringify(entry.usage)}</span>
          )}
        </div>

        {entry.errorMessage && (
          <div>
            <p className="mb-1 text-[10px] uppercase tracking-wide text-neutral-600">Error</p>
            <p className="whitespace-pre-wrap rounded-lg border border-red-500/20 bg-red-500/[0.07] p-3 text-sm text-red-300">
              {entry.errorMessage}
            </p>
          </div>
        )}

        <div>
          <p className="mb-1 text-[10px] uppercase tracking-wide text-neutral-600">Prompt / input</p>
          <p className="whitespace-pre-wrap rounded-lg border border-white/5 bg-white/[0.02] p-3 text-sm text-neutral-300">
            {entry.promptPreview || "—"}
          </p>
        </div>

        {entry.responseText && (
          <div>
            <p className="mb-1 text-[10px] uppercase tracking-wide text-neutral-600">Response</p>
            <p className="whitespace-pre-wrap rounded-lg border border-white/5 bg-white/[0.02] p-3 text-sm text-neutral-300">
              {entry.responseText}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
