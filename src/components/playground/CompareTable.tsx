"use client";

import { aggregateRunStates, type CellResults, type RunCell } from "./types";
import { formatCompactNumber } from "@/lib/format";

interface Props {
  cells: RunCell[];
  results: Record<string, CellResults>;
  prompt: string;
}

/** Token totals across a repeated cell's successful runs. */
function tokenTotals(states: CellResults): { promptTokens: number | null; completionTokens: number | null } {
  const succeeded = states.filter(
    (s): s is Extract<CellResults[number], { status: "done" }> => s.status === "done" && !s.result.error,
  );
  const sum = (nums: number[]) => (nums.length ? nums.reduce((a, b) => a + b, 0) : null);
  return {
    promptTokens: sum(succeeded.map((s) => s.result.usage?.promptTokens).filter((n): n is number => n != null)),
    completionTokens: sum(succeeded.map((s) => s.result.usage?.completionTokens).filter((n): n is number => n != null)),
  };
}

function cellFor(cell: RunCell, states: CellResults, field: string, basePrompt: string): string {
  if (field === "model") return cell.modelId || "—";
  if (field === "variant") return cell.variant.label || "—";
  if (field === "prompt") return cell.variant.promptOverride ?? basePrompt;

  if (states.length > 1) {
    const agg = aggregateRunStates(states);
    const tokens = tokenTotals(states);
    switch (field) {
      case "status":
        return agg.anyLoading ? "Running…" : `${agg.succeeded}/${agg.total} succeeded`;
      case "latency":
        return agg.avgLatencyMs != null ? `avg ${agg.avgLatencyMs}ms (${agg.minLatencyMs}–${agg.maxLatencyMs}ms)` : "—";
      case "tokensIn":
        return formatCompactNumber(tokens.promptTokens) ?? "—";
      case "tokensOut":
        return formatCompactNumber(tokens.completionTokens) ?? "—";
      case "tokensTotal":
        return tokens.promptTokens != null && tokens.completionTokens != null
          ? (formatCompactNumber(tokens.promptTokens + tokens.completionTokens) ?? "—")
          : "—";
      case "error":
        return agg.failed > 0 ? `${agg.failed} of ${agg.total} failed` : "—";
      case "response":
        return `${agg.total} runs — see tab view for individual responses`;
      default:
        return "—";
    }
  }

  const state = states[0] ?? { status: "idle" as const };
  if (state.status === "idle") return "—";
  if (state.status === "loading") return "Running…";
  if (state.status === "error") return field === "error" ? state.message : "—";

  const result = state.result;
  switch (field) {
    case "status":
      return result.error ? "Failed" : "Success";
    case "latency":
      return `${result.latencyMs}ms`;
    case "http":
      return result.response ? `${result.response.status} ${result.response.statusText}` : "—";
    case "tokensIn":
      return formatCompactNumber(result.usage?.promptTokens) ?? "—";
    case "tokensOut":
      return formatCompactNumber(result.usage?.completionTokens) ?? "—";
    case "tokensTotal":
      return formatCompactNumber(result.usage?.totalTokens) ?? "—";
    case "error":
      return result.error ?? "—";
    case "response":
      return result.text || "(empty response)";
    default:
      return "—";
  }
}

const BASE_ROWS: { field: string; label: string; mono?: boolean }[] = [
  { field: "status", label: "Status" },
  { field: "latency", label: "Latency", mono: true },
  { field: "http", label: "HTTP", mono: true },
  { field: "model", label: "Model", mono: true },
  { field: "tokensIn", label: "Tokens in", mono: true },
  { field: "tokensOut", label: "Tokens out", mono: true },
  { field: "tokensTotal", label: "Tokens total", mono: true },
  { field: "error", label: "Error" },
  { field: "response", label: "Response" },
];

/** Fastest successful run wins -- for a repeated cell that's fastest average, and it only
 *  counts once every run in it either succeeded or failed (not still loading). Only
 *  meaningful once at least two cells have a result. */
function winnerKey(cells: RunCell[], results: Record<string, CellResults>): string | null {
  let best: { key: string; latencyMs: number } | null = null;
  let successCount = 0;

  for (const cell of cells) {
    const states = results[cell.key];
    if (!states) continue;
    const latencyMs =
      states.length > 1
        ? aggregateRunStates(states).avgLatencyMs
        : states[0]?.status === "done" && !states[0].result.error
          ? states[0].result.latencyMs
          : null;
    if (latencyMs == null) continue;
    successCount += 1;
    if (!best || latencyMs < best.latencyMs) {
      best = { key: cell.key, latencyMs };
    }
  }

  return successCount >= 2 ? best?.key ?? null : null;
}

export function CompareTable({ cells, results, prompt }: Props) {
  const winner = winnerKey(cells, results);
  const showVariant = new Set(cells.map((c) => c.variant.id)).size > 1;
  const showPromptRow = new Set(cells.map((c) => c.variant.promptOverride ?? prompt)).size > 1;
  const extraRows: typeof BASE_ROWS = [
    ...(showPromptRow ? [{ field: "prompt", label: "Prompt" }] : []),
    ...(showVariant ? [{ field: "variant", label: "Variant" }] : []),
  ];
  const ROWS = extraRows.length > 0 ? [...BASE_ROWS.slice(0, 4), ...extraRows, ...BASE_ROWS.slice(4)] : BASE_ROWS;

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
        <p className="mb-1 text-[10px] uppercase tracking-wide text-neutral-600">Prompt</p>
        <p className="whitespace-pre-wrap text-sm text-neutral-300">
          {showPromptRow ? "Varies per column — see Prompt row below" : prompt}
        </p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-white/5">
        <table className="w-full min-w-[480px] border-collapse text-sm">
          <thead>
            <tr className="bg-white/[0.03]">
              <th className="sticky left-0 z-10 border-b border-r border-white/10 bg-[var(--surface-1)] px-3 py-2 text-left text-[11px] font-medium uppercase tracking-wide text-neutral-500">
                &nbsp;
              </th>
              {cells.map((cell) => {
                const isWinner = cell.key === winner;
                return (
                  <th
                    key={cell.key}
                    className={`border-b px-3 py-2 text-left text-xs font-medium ${
                      isWinner
                        ? "border-emerald-300/30 bg-emerald-300/[0.06] text-emerald-100"
                        : "border-white/10 text-neutral-200"
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      {isWinner && (
                        <span className="shrink-0 rounded-full bg-emerald-300/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-emerald-200">
                          Winner
                        </span>
                      )}
                      <div className="flex min-w-0 flex-1 items-baseline gap-1.5 overflow-x-auto whitespace-nowrap pb-0.5">
                        <span>{cell.gateway.name}</span>
                        <span
                          className={`font-mono text-[10px] font-normal ${
                            isWinner ? "text-emerald-200/70" : "text-neutral-500"
                          }`}
                        >
                          {cell.modelId}
                        </span>
                        {showVariant && cell.variant.label && (
                          <span
                            className={`font-normal ${isWinner ? "text-emerald-200/70" : "text-neutral-500"}`}
                          >
                            {cell.variant.label}
                          </span>
                        )}
                      </div>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => (
              <tr key={row.field} className="odd:bg-white/[0.015]">
                <th className="sticky left-0 z-10 border-b border-r border-white/10 bg-[var(--surface-1)] px-3 py-2 text-left text-xs font-medium text-neutral-500">
                  {row.label}
                </th>
                {cells.map((cell) => {
                  const states = results[cell.key] ?? [{ status: "idle" as const }];
                  const value = cellFor(cell, states, row.field, prompt);
                  const agg = states.length > 1 ? aggregateRunStates(states) : null;
                  const failed =
                    row.field === "status" &&
                    (agg ? agg.total > 0 && !agg.anyLoading && agg.succeeded === 0 : value === "Failed");
                  const isWinnerLatency = row.field === "latency" && cell.key === winner;
                  return (
                    <td
                      key={cell.key}
                      className={`max-w-xs border-b px-3 py-2 align-top text-xs ${
                        row.mono ? "font-mono" : ""
                      } ${
                        failed
                          ? "border-white/5 text-red-300"
                          : isWinnerLatency
                            ? "border-white/5 font-medium text-emerald-300"
                            : "border-white/5 text-neutral-300"
                      } ${row.field === "response" || row.field === "prompt" ? "whitespace-pre-wrap" : "truncate"}`}
                    >
                      {isWinnerLatency ? `${value} ⚡` : value}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
