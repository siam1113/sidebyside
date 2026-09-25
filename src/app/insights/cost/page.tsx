"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { InsightsTabs } from "@/components/InsightsTabs";
import { EmptyResultsState } from "@/components/playground/EmptyResultsState";
import { useGatewayModels, type GatewayModelRow } from "@/lib/gateways/useGatewayModels";
import { formatUsd } from "@/lib/format";

interface EditState {
  key: string;
  promptPer1M: string;
  completionPer1M: string;
}

function monthlyCost(pricePer1M: number | undefined, monthlyTokens: number): number | undefined {
  if (pricePer1M == null) return undefined;
  return (pricePer1M * monthlyTokens) / 1_000_000;
}

export default function InsightsCostPage() {
  const { gateways, rows, loading, reload } = useGatewayModels();
  const [promptVolume, setPromptVolume] = useState("1000000");
  const [completionVolume, setCompletionVolume] = useState("250000");
  const [refreshing, setRefreshing] = useState(false);
  const [refreshMessage, setRefreshMessage] = useState<string | null>(null);
  const [editing, setEditing] = useState<EditState | null>(null);
  const [saving, setSaving] = useState(false);

  const promptTokens = Number(promptVolume) || 0;
  const completionTokens = Number(completionVolume) || 0;

  const sorted = useMemo(() => {
    return [...rows].sort((a, b) => {
      const ac = monthlyCost(a.pricing?.promptPer1M, promptTokens) ?? 0;
      const bc = monthlyCost(b.pricing?.promptPer1M, promptTokens) ?? 0;
      const acAll = ac + (monthlyCost(a.pricing?.completionPer1M, completionTokens) ?? 0);
      const bcAll = bc + (monthlyCost(b.pricing?.completionPer1M, completionTokens) ?? 0);
      if (a.pricing == null && b.pricing == null) return a.gatewayName.localeCompare(b.gatewayName);
      if (a.pricing == null) return 1;
      if (b.pricing == null) return -1;
      return acAll - bcAll;
    });
  }, [rows, promptTokens, completionTokens]);

  async function refreshPricing() {
    setRefreshing(true);
    setRefreshMessage(null);
    try {
      const res = await fetch("/api/pricing/refresh", { method: "POST" });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Refresh failed");
      setRefreshMessage(`Fetched pricing for ${body.count} models from OpenRouter.`);
      reload();
    } catch (err) {
      setRefreshMessage(err instanceof Error ? err.message : String(err));
    } finally {
      setRefreshing(false);
    }
  }

  function startEdit(row: GatewayModelRow) {
    setEditing({
      key: `${row.gatewayId}::${row.id}`,
      promptPer1M: row.pricing?.promptPer1M != null ? String(row.pricing.promptPer1M) : "",
      completionPer1M: row.pricing?.completionPer1M != null ? String(row.pricing.completionPer1M) : "",
    });
  }

  async function saveEdit(row: GatewayModelRow) {
    if (!editing) return;
    setSaving(true);
    try {
      await fetch("/api/pricing/override", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gatewayId: row.gatewayId,
          modelId: row.id,
          promptPer1M: editing.promptPer1M ? Number(editing.promptPer1M) : undefined,
          completionPer1M: editing.completionPer1M ? Number(editing.completionPer1M) : undefined,
        }),
      });
      setEditing(null);
      reload();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-8 lg:h-full lg:min-h-0">
      <div className="animate-fade-up flex flex-col gap-1.5 shrink-0">
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-50">Insights</h1>
        <p className="max-w-xl text-sm text-neutral-400">
          Project monthly spend per gateway/model from OpenRouter&apos;s public pricing catalog. Azure/custom deployments
          rarely match a public listing -- click a price to enter one manually.
        </p>
      </div>

      <div className="animate-fade-up flex shrink-0 items-center justify-between gap-3">
        <InsightsTabs />
        <div className="flex items-center gap-2">
          {refreshMessage && <span className="text-xs text-neutral-500">{refreshMessage}</span>}
          <button
            onClick={refreshPricing}
            disabled={refreshing}
            className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-neutral-200 transition-colors hover:border-cyan-300/30 hover:text-cyan-100 disabled:opacity-50"
          >
            {refreshing ? "Refreshing…" : "Refresh pricing"}
          </button>
        </div>
      </div>

      {!loading && gateways.length === 0 ? (
        <p className="text-neutral-400">
          No gateways configured yet.{" "}
          <Link
            href="/settings"
            className="text-cyan-200 underline decoration-cyan-200/30 underline-offset-2 hover:text-cyan-100"
          >
            Add one in Settings
          </Link>
          .
        </p>
      ) : loading ? (
        <EmptyResultsState title="Loading models…" description="Fetching model lists and pricing." />
      ) : (
        <div className="flex min-w-0 flex-1 flex-col gap-4 lg:min-h-0 lg:overflow-y-auto">
          <div className="flex flex-wrap items-end gap-4 rounded-lg border border-white/5 bg-white/[0.02] p-3">
            <label className="flex flex-col gap-1 text-xs text-neutral-400">
              Prompt tokens / month
              <input
                value={promptVolume}
                onChange={(e) => setPromptVolume(e.target.value.replace(/[^0-9]/g, ""))}
                className="w-40 rounded-md border border-white/10 bg-white/[0.03] px-2 py-1 font-mono text-sm text-neutral-200 focus:border-cyan-300/30 focus:outline-none"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-neutral-400">
              Completion tokens / month
              <input
                value={completionVolume}
                onChange={(e) => setCompletionVolume(e.target.value.replace(/[^0-9]/g, ""))}
                className="w-40 rounded-md border border-white/10 bg-white/[0.03] px-2 py-1 font-mono text-sm text-neutral-200 focus:border-cyan-300/30 focus:outline-none"
              />
            </label>
          </div>

          <div className="overflow-x-auto rounded-lg border border-white/5">
            <table className="w-full min-w-[720px] border-collapse text-sm">
              <thead>
                <tr className="bg-white/[0.03]">
                  <th className="border-b border-white/10 px-3 py-2 text-left text-[11px] font-medium uppercase tracking-wide text-neutral-500">
                    Gateway
                  </th>
                  <th className="border-b border-white/10 px-3 py-2 text-left text-[11px] font-medium uppercase tracking-wide text-neutral-500">
                    Model
                  </th>
                  <th className="border-b border-white/10 px-3 py-2 text-left text-[11px] font-medium uppercase tracking-wide text-neutral-500">
                    Prompt $/1M
                  </th>
                  <th className="border-b border-white/10 px-3 py-2 text-left text-[11px] font-medium uppercase tracking-wide text-neutral-500">
                    Completion $/1M
                  </th>
                  <th className="border-b border-white/10 px-3 py-2 text-left text-[11px] font-medium uppercase tracking-wide text-neutral-500">
                    Projected $/month
                  </th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((row) => {
                  const key = `${row.gatewayId}::${row.id}`;
                  const isEditing = editing?.key === key;
                  const total =
                    (monthlyCost(row.pricing?.promptPer1M, promptTokens) ?? 0) +
                    (monthlyCost(row.pricing?.completionPer1M, completionTokens) ?? 0);
                  return (
                    <tr key={key} className="odd:bg-white/[0.015]">
                      <td className="border-b border-white/5 px-3 py-2 text-xs text-neutral-300">{row.gatewayName}</td>
                      <td className="border-b border-white/5 px-3 py-2 font-mono text-xs text-neutral-300">{row.id}</td>
                      {isEditing ? (
                        <>
                          <td className="border-b border-white/5 px-3 py-2">
                            <input
                              value={editing.promptPer1M}
                              onChange={(e) => setEditing({ ...editing, promptPer1M: e.target.value })}
                              placeholder="e.g. 3"
                              className="w-20 rounded-md border border-cyan-300/30 bg-white/[0.03] px-2 py-1 font-mono text-xs text-neutral-200 focus:outline-none"
                            />
                          </td>
                          <td className="border-b border-white/5 px-3 py-2">
                            <input
                              value={editing.completionPer1M}
                              onChange={(e) => setEditing({ ...editing, completionPer1M: e.target.value })}
                              placeholder="e.g. 15"
                              className="w-20 rounded-md border border-cyan-300/30 bg-white/[0.03] px-2 py-1 font-mono text-xs text-neutral-200 focus:outline-none"
                            />
                          </td>
                          <td className="border-b border-white/5 px-3 py-2">
                            <div className="flex gap-2">
                              <button
                                onClick={() => saveEdit(row)}
                                disabled={saving}
                                className="rounded-md bg-cyan-300/10 px-2 py-1 text-[11px] font-medium text-cyan-100 hover:bg-cyan-300/20 disabled:opacity-50"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditing(null)}
                                className="rounded-md px-2 py-1 text-[11px] text-neutral-400 hover:text-neutral-200"
                              >
                                Cancel
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td
                            onClick={() => startEdit(row)}
                            className="cursor-pointer border-b border-white/5 px-3 py-2 font-mono text-xs text-neutral-400 hover:text-cyan-200"
                            title="Click to set a manual price"
                          >
                            {row.pricing?.promptPer1M != null ? `$${row.pricing.promptPer1M}` : "— set"}
                          </td>
                          <td
                            onClick={() => startEdit(row)}
                            className="cursor-pointer border-b border-white/5 px-3 py-2 font-mono text-xs text-neutral-400 hover:text-cyan-200"
                            title="Click to set a manual price"
                          >
                            {row.pricing?.completionPer1M != null ? `$${row.pricing.completionPer1M}` : "— set"}
                          </td>
                          <td className="border-b border-white/5 px-3 py-2 font-mono text-xs text-neutral-200">
                            {row.pricing ? formatUsd(total) : "—"}
                            {row.pricing?.source === "manual" && (
                              <span className="ml-1.5 text-[10px] text-neutral-500">(manual)</span>
                            )}
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
