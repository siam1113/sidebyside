"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { InsightsTabs } from "@/components/InsightsTabs";
import { EmptyResultsState } from "@/components/playground/EmptyResultsState";
import { LatencySparkline } from "@/components/insights/LatencySparkline";
import type { GatewayLatencySummary } from "@/lib/db/latency";

const WINDOWS = [
  { days: 1, label: "24h" },
  { days: 7, label: "7d" },
  { days: 30, label: "30d" },
];

function formatMs(n: number | null): string {
  return n == null ? "—" : `${Math.round(n)}ms`;
}

export function GatewayLatencyCard({ summary }: { summary: GatewayLatencySummary }) {
  const [showTable, setShowTable] = useState(false);
  const successPct = Math.round(summary.successRate * 100);

  return (
    <div className="glass-panel flex flex-col gap-4 rounded-xl p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-medium text-neutral-200">{summary.gatewayName}</h2>
        <button
          onClick={() => setShowTable((s) => !s)}
          className="text-[11px] text-neutral-500 underline decoration-neutral-700 underline-offset-2 hover:text-neutral-300"
        >
          {showTable ? "Show chart" : "Show table"}
        </button>
      </div>

      <div className="flex flex-wrap gap-6 text-xs">
        <div>
          <p className="text-neutral-500">Success rate</p>
          <p className={`mt-0.5 font-mono text-sm ${successPct >= 99 ? "text-emerald-300" : successPct >= 90 ? "text-amber-300" : "text-red-300"}`}>
            {successPct}%
          </p>
        </div>
        <div>
          <p className="text-neutral-500">p50</p>
          <p className="mt-0.5 font-mono text-sm text-neutral-200">{formatMs(summary.p50)}</p>
        </div>
        <div>
          <p className="text-neutral-500">p95</p>
          <p className="mt-0.5 font-mono text-sm text-neutral-200">{formatMs(summary.p95)}</p>
        </div>
        <div>
          <p className="text-neutral-500">Samples</p>
          <p className="mt-0.5 font-mono text-sm text-neutral-200">{summary.sampleCount}</p>
        </div>
      </div>

      {showTable ? (
        <div className="max-h-48 overflow-y-auto rounded-lg border border-white/5">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-white/[0.03]">
                <th className="border-b border-white/10 px-2 py-1 text-left text-neutral-500">When</th>
                <th className="border-b border-white/10 px-2 py-1 text-left text-neutral-500">Latency</th>
                <th className="border-b border-white/10 px-2 py-1 text-left text-neutral-500">Status</th>
                <th className="border-b border-white/10 px-2 py-1 text-left text-neutral-500">Source</th>
              </tr>
            </thead>
            <tbody>
              {[...summary.points].reverse().map((p, i) => (
                <tr key={i} className="odd:bg-white/[0.015]">
                  <td className="border-b border-white/5 px-2 py-1 text-neutral-400">
                    {new Date(p.createdAt).toLocaleString()}
                  </td>
                  <td className="border-b border-white/5 px-2 py-1 font-mono text-neutral-300">
                    {p.latencyMs != null ? `${p.latencyMs}ms` : "—"}
                  </td>
                  <td className={`border-b border-white/5 px-2 py-1 ${p.success ? "text-emerald-300" : "text-red-300"}`}>
                    {p.success ? "ok" : "failed"}
                  </td>
                  <td className="border-b border-white/5 px-2 py-1 text-neutral-500">{p.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <LatencySparkline points={summary.points} />
      )}
    </div>
  );
}

export default function InsightsLatencyPage() {
  const [days, setDays] = useState(7);
  const [gateways, setGateways] = useState<GatewayLatencySummary[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setGateways(null);
      const res = await fetch(`/api/latency?days=${days}`);
      const body = await res.json();
      if (!cancelled) setGateways(body.gateways);
    })();
    return () => {
      cancelled = true;
    };
  }, [days]);

  return (
    <div className="flex flex-col gap-8 lg:h-full lg:min-h-0">
      <div className="animate-fade-up flex flex-col gap-1.5 shrink-0">
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-50">Insights</h1>
        <p className="max-w-xl text-sm text-neutral-400">
          Latency and success rate per gateway, from real usage plus any opt-in periodic health checks. Enable a
          health check per gateway in{" "}
          <Link href="/settings" className="text-cyan-200 underline decoration-cyan-200/30 underline-offset-2 hover:text-cyan-100">
            Settings
          </Link>
          .
        </p>
      </div>

      <div className="animate-fade-up flex shrink-0 flex-wrap items-center justify-between gap-3">
        <InsightsTabs />
        <div className="flex gap-1 rounded-lg border border-white/10 bg-white/[0.03] p-1">
          {WINDOWS.map((w) => (
            <button
              key={w.days}
              onClick={() => setDays(w.days)}
              className={`rounded-md px-3 py-1.5 text-xs transition-colors duration-150 ${
                days === w.days ? "bg-cyan-300/10 text-cyan-100" : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              {w.label}
            </button>
          ))}
        </div>
      </div>

      {gateways === null ? (
        <EmptyResultsState title="Loading…" description="Aggregating latency and success rate." />
      ) : gateways.length === 0 ? (
        <EmptyResultsState
          title="No data in this window"
          description="Make some runs in the Playground, or enable a health check for a gateway in Settings."
        />
      ) : (
        <div className="flex min-w-0 flex-1 flex-col gap-4 lg:min-h-0 lg:overflow-y-auto">
          {gateways.map((g) => (
            <GatewayLatencyCard key={g.gatewayId} summary={g} />
          ))}
        </div>
      )}
    </div>
  );
}
