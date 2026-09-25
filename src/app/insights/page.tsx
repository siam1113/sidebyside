"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { InsightsTabs } from "@/components/InsightsTabs";
import { EmptyResultsState } from "@/components/playground/EmptyResultsState";
import { useGatewayModels, type GatewayModelRow } from "@/lib/gateways/useGatewayModels";
import { formatCompactNumber } from "@/lib/format";
import { capabilityMeta, capabilitiesMatch } from "@/lib/capabilities";
import { CapabilityChips } from "@/components/CapabilityChips";

type SortKey = "gateway" | "model" | "type" | "context" | "maxOutput";

/** Every non-capability field shown in the compare matrix, in display order. */
const COMPARE_FIELDS: { label: string; render: (r: GatewayModelRow) => string }[] = [
  { label: "Gateway", render: (r) => r.gatewayName },
  { label: "Protocol", render: (r) => r.protocol },
  { label: "Type", render: (r) => r.type ?? "—" },
  { label: "Label", render: (r) => r.label ?? "—" },
  { label: "Meta", render: (r) => r.meta ?? "—" },
  { label: "Description", render: (r) => r.description ?? "—" },
  { label: "Context", render: (r) => formatCompactNumber(r.contextLength) ?? "—" },
  { label: "Max output", render: (r) => formatCompactNumber(r.maxOutputTokens) ?? "—" },
  { label: "Prompt $/1M", render: (r) => (r.pricing?.promptPer1M != null ? `$${r.pricing.promptPer1M}` : "—") },
  {
    label: "Completion $/1M",
    render: (r) => (r.pricing?.completionPer1M != null ? `$${r.pricing.completionPer1M}` : "—"),
  },
  { label: "Pricing source", render: (r) => r.pricing?.source ?? "—" },
  {
    label: "Pricing updated",
    render: (r) => (r.pricing?.fetchedAt ? new Date(r.pricing.fetchedAt).toLocaleDateString() : "—"),
  },
];

function sortValue(row: GatewayModelRow, key: SortKey): string | number {
  switch (key) {
    case "gateway":
      return row.gatewayName.toLowerCase();
    case "model":
      return row.id.toLowerCase();
    case "type":
      return row.type ?? "";
    case "context":
      return row.contextLength ?? -1;
    case "maxOutput":
      return row.maxOutputTokens ?? -1;
  }
}

function rowKey(row: GatewayModelRow): string {
  return `${row.gatewayId}::${row.id}`;
}

/** Vendor prefix of an OpenRouter-style id (e.g. "openai/gpt-4o" -> "openai"); falls back to the
 *  configured gateway's name for ids with no "/" (native Anthropic/Gemini/Azure listings). */
function providerOf(row: GatewayModelRow): string {
  const slash = row.id.indexOf("/");
  return slash > 0 ? row.id.slice(0, slash) : row.gatewayName;
}

export default function InsightsMatrixPage() {
  const { gateways, rows, failed, loading } = useGatewayModels();
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("gateway");
  const [sortDir, setSortDir] = useState<1 | -1>(1);
  const [providerFilter, setProviderFilter] = useState("");
  const [capabilityFilter, setCapabilityFilter] = useState<Set<string>>(new Set());
  const [compareKeys, setCompareKeys] = useState<Set<string>>(new Set());
  const [showCompare, setShowCompare] = useState(false);

  const allProviders = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((r) => set.add(providerOf(r)));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [rows]);

  const allCapabilities = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((r) => r.capabilities?.forEach((c) => set.add(c)));
    return Array.from(set).sort();
  }, [rows]);

  const hasActiveFilters = Boolean(query) || Boolean(providerFilter) || capabilityFilter.size > 0;

  const filteredSorted = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = rows.filter((r) => {
      if (
        q &&
        !(
          r.gatewayName.toLowerCase().includes(q) ||
          r.id.toLowerCase().includes(q) ||
          (r.label ?? "").toLowerCase().includes(q) ||
          capabilitiesMatch(r.capabilities, q)
        )
      ) {
        return false;
      }
      if (providerFilter && providerOf(r) !== providerFilter) return false;
      if (capabilityFilter.size > 0 && !Array.from(capabilityFilter).every((c) => r.capabilities?.includes(c))) {
        return false;
      }
      return true;
    });
    return [...filtered].sort((a, b) => {
      const av = sortValue(a, sortKey);
      const bv = sortValue(b, sortKey);
      if (av < bv) return -1 * sortDir;
      if (av > bv) return 1 * sortDir;
      return a.id.localeCompare(b.id);
    });
  }, [rows, query, sortKey, sortDir, providerFilter, capabilityFilter]);

  const rowByKey = useMemo(() => new Map(rows.map((r) => [rowKey(r), r])), [rows]);
  const compareRows = useMemo(
    () => Array.from(compareKeys, (k) => rowByKey.get(k)).filter((r): r is GatewayModelRow => Boolean(r)),
    [compareKeys, rowByKey],
  );
  const compareCapabilities = useMemo(() => {
    const set = new Set<string>();
    compareRows.forEach((r) => r.capabilities?.forEach((c) => set.add(c)));
    return Array.from(set).sort();
  }, [compareRows]);

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === 1 ? -1 : 1));
    } else {
      setSortKey(key);
      setSortDir(1);
    }
  }

  function toggleCapabilityFilter(cap: string) {
    setCapabilityFilter((prev) => {
      const next = new Set(prev);
      if (next.has(cap)) next.delete(cap);
      else next.add(cap);
      return next;
    });
  }

  function toggleCompare(key: string) {
    setShowCompare(false);
    setCompareKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function clearCompareSelection() {
    setCompareKeys(new Set());
    setShowCompare(false);
  }

  const columns: { key: SortKey; label: string }[] = [
    { key: "gateway", label: "Gateway" },
    { key: "model", label: "Model" },
    { key: "type", label: "Type" },
    { key: "context", label: "Context" },
    { key: "maxOutput", label: "Max output" },
  ];

  return (
    <div className="flex flex-col gap-8 lg:h-full lg:min-h-0">
      <div className="animate-fade-up flex flex-col gap-1.5 shrink-0">
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-50">Insights</h1>
        <p className="max-w-xl text-sm text-neutral-400">
          Every model across every configured gateway, side by side -- context window, output cap, modality, and
          (once priced) cost per million tokens.
        </p>
      </div>

      <div className="animate-fade-up shrink-0">
        <InsightsTabs />
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
        <EmptyResultsState title="Loading models…" description="Fetching model lists from every configured gateway." />
      ) : rows.length === 0 ? (
        <EmptyResultsState
          title="No models found"
          description="None of your configured gateways returned a model list."
        />
      ) : (
        <div className="flex min-w-0 flex-1 flex-col gap-4 lg:min-h-0 lg:overflow-y-auto">
          <div className="flex flex-col gap-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Filter by gateway or model…"
                className="w-full max-w-sm rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-sm text-neutral-200 placeholder:text-neutral-600 focus:border-cyan-300/30 focus:outline-none"
              />
              <select
                value={providerFilter}
                onChange={(e) => setProviderFilter(e.target.value)}
                className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-sm text-neutral-200 focus:border-cyan-300/30 focus:outline-none"
              >
                <option value="">All providers</option>
                {allProviders.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    setProviderFilter("");
                    setCapabilityFilter(new Set());
                  }}
                  className="text-[11px] text-neutral-500 underline decoration-neutral-600 underline-offset-2 hover:text-neutral-300"
                >
                  Clear filters
                </button>
              )}
            </div>
            {allCapabilities.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] uppercase tracking-wide text-neutral-600">Capability</span>
                {allCapabilities.map((cap) => {
                  const active = capabilityFilter.has(cap);
                  const meta = capabilityMeta(cap);
                  return (
                    <button
                      key={cap}
                      type="button"
                      onClick={() => toggleCapabilityFilter(cap)}
                      className={`rounded border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide transition-colors ${
                        active ? "border-cyan-300/50 bg-cyan-300/15 text-cyan-100" : `${meta.className} opacity-60 hover:opacity-100`
                      }`}
                    >
                      {meta.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {compareKeys.size > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
              <span className="text-xs text-neutral-300">
                {compareKeys.size} model{compareKeys.size === 1 ? "" : "s"} selected
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowCompare(true)}
                  disabled={compareKeys.size < 2}
                  className="rounded-md border border-cyan-300/30 bg-cyan-300/10 px-3 py-1 text-xs font-medium text-cyan-200 transition-colors hover:bg-cyan-300/20 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-cyan-300/10"
                >
                  Compare
                </button>
                <button
                  type="button"
                  onClick={clearCompareSelection}
                  className="text-[11px] text-neutral-500 hover:text-neutral-300"
                >
                  Clear selection
                </button>
              </div>
            </div>
          )}

          {showCompare && compareRows.length >= 2 && (
            <div className="flex flex-col gap-3 rounded-lg border border-cyan-300/20 bg-cyan-300/[0.03] p-3">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-medium uppercase tracking-wide text-cyan-200">
                  Comparing {compareRows.length} model{compareRows.length === 1 ? "" : "s"}
                </p>
                <button
                  type="button"
                  onClick={clearCompareSelection}
                  className="text-[11px] text-neutral-500 hover:text-neutral-300"
                >
                  Clear comparison
                </button>
              </div>
              <div className="overflow-x-auto rounded-lg border border-white/5">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-white/[0.03]">
                      <th className="sticky left-0 z-10 border-b border-r border-white/10 bg-[var(--surface-1)] px-3 py-2 text-left text-[11px] font-medium uppercase tracking-wide text-neutral-500">
                        &nbsp;
                      </th>
                      {compareRows.map((r) => (
                        <th
                          key={rowKey(r)}
                          className="border-b border-white/10 px-3 py-2 text-left text-xs font-medium text-neutral-200"
                        >
                          <div className="flex flex-col gap-0.5">
                            <span className="max-w-[160px] truncate font-mono">{r.id}</span>
                            <span className="text-[10px] font-normal text-neutral-500">{r.gatewayName}</span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {COMPARE_FIELDS.map(({ label, render }) => (
                      <tr key={label} className="odd:bg-white/[0.015]">
                        <th className="sticky left-0 z-10 border-b border-r border-white/10 bg-[var(--surface-1)] px-3 py-2 text-left text-xs font-medium text-neutral-500">
                          {label}
                        </th>
                        {compareRows.map((r) => (
                          <td
                            key={rowKey(r)}
                            className={`max-w-[220px] border-b border-white/5 px-3 py-2 text-xs text-neutral-300 ${
                              label === "Description" ? "whitespace-pre-wrap break-words" : "truncate font-mono"
                            }`}
                          >
                            {render(r)}
                          </td>
                        ))}
                      </tr>
                    ))}
                    {compareCapabilities.length > 0 && (
                      <tr className="bg-white/[0.02]">
                        <th
                          colSpan={compareRows.length + 1}
                          className="sticky left-0 z-10 border-b border-white/10 bg-[var(--surface-1)] px-3 py-1.5 text-left text-[10px] font-medium uppercase tracking-wide text-neutral-600"
                        >
                          Capabilities
                        </th>
                      </tr>
                    )}
                    {compareCapabilities.map((cap) => (
                      <tr key={cap} className="odd:bg-white/[0.015]">
                        <th className="sticky left-0 z-10 border-b border-r border-white/10 bg-[var(--surface-1)] px-3 py-2 text-left text-xs font-medium text-neutral-500">
                          {capabilityMeta(cap).label}
                        </th>
                        {compareRows.map((r) => (
                          <td key={rowKey(r)} className="border-b border-white/5 px-3 py-2 text-center text-xs">
                            {r.capabilities?.includes(cap) ? (
                              <span className="text-emerald-300">✓</span>
                            ) : (
                              <span className="text-neutral-700">—</span>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="overflow-x-auto rounded-lg border border-white/5">
            <table className="w-full min-w-[720px] border-collapse text-sm">
              <thead>
                <tr className="bg-white/[0.03]">
                  <th className="border-b border-white/10 px-3 py-2 text-left text-[11px] font-medium uppercase tracking-wide text-neutral-500">
                    Compare
                  </th>
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      onClick={() => toggleSort(col.key)}
                      className="cursor-pointer select-none border-b border-white/10 px-3 py-2 text-left text-[11px] font-medium uppercase tracking-wide text-neutral-500 hover:text-neutral-300"
                    >
                      {col.label}
                      {sortKey === col.key && (sortDir === 1 ? " ↑" : " ↓")}
                    </th>
                  ))}
                  <th className="border-b border-white/10 px-3 py-2 text-left text-[11px] font-medium uppercase tracking-wide text-neutral-500">
                    Capabilities
                  </th>
                  <th className="border-b border-white/10 px-3 py-2 text-left text-[11px] font-medium uppercase tracking-wide text-neutral-500">
                    Prompt $/1M
                  </th>
                  <th className="border-b border-white/10 px-3 py-2 text-left text-[11px] font-medium uppercase tracking-wide text-neutral-500">
                    Completion $/1M
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredSorted.map((row) => {
                  const key = rowKey(row);
                  const checked = compareKeys.has(key);
                  return (
                    <tr key={key} className="odd:bg-white/[0.015]">
                      <td className="border-b border-white/5 px-3 py-2">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleCompare(key)}
                          className="h-3.5 w-3.5 accent-cyan-300"
                        />
                      </td>
                      <td className="border-b border-white/5 px-3 py-2 text-xs text-neutral-300">{row.gatewayName}</td>
                      <td className="border-b border-white/5 px-3 py-2 font-mono text-xs text-neutral-300">
                        {row.id}
                        {row.label && <span className="ml-1.5 font-sans text-neutral-500">({row.label})</span>}
                      </td>
                      <td className="border-b border-white/5 px-3 py-2 text-xs text-neutral-400">{row.type ?? "—"}</td>
                      <td className="border-b border-white/5 px-3 py-2 font-mono text-xs text-neutral-400">
                        {formatCompactNumber(row.contextLength) ?? "—"}
                      </td>
                      <td className="border-b border-white/5 px-3 py-2 font-mono text-xs text-neutral-400">
                        {formatCompactNumber(row.maxOutputTokens) ?? "—"}
                      </td>
                      <td className="border-b border-white/5 px-3 py-2 text-xs text-neutral-400">
                        <CapabilityChips capabilities={row.capabilities} />
                      </td>
                      <td className="border-b border-white/5 px-3 py-2 font-mono text-xs text-neutral-500">
                        {row.pricing?.promptPer1M != null ? `$${row.pricing.promptPer1M}` : "—"}
                      </td>
                      <td className="border-b border-white/5 px-3 py-2 font-mono text-xs text-neutral-500">
                        {row.pricing?.completionPer1M != null ? `$${row.pricing.completionPer1M}` : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {failed.length > 0 && (
            <p className="text-xs text-neutral-500">
              {failed.length} gateway{failed.length === 1 ? "" : "s"} couldn&apos;t list models:{" "}
              {failed.map((f) => `${f.gatewayName} (${f.error})`).join(", ")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
