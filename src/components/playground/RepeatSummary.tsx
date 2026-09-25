"use client";

import { useState, type ReactNode } from "react";
import { aggregateRunStates, type CellResults } from "./types";

interface Props<T extends { error?: string; latencyMs: number }> {
  states: CellResults<T>;
  renderDetail: (state: CellResults<T>[number]) => ReactNode;
  /** Extra summary chip(s) appended after the built-in stats -- e.g. chat's token totals,
   *  which other tabs' result shapes don't have. */
  extraSummary?: ReactNode;
}

function dotClass<T extends { error?: string }>(state: CellResults<T>[number]): string {
  if (state.status === "loading") return "animate-pulse bg-cyan-300";
  if (state.status === "error") return "bg-red-400";
  if (state.status === "done") return state.result.error ? "bg-red-400" : "bg-emerald-400";
  return "bg-neutral-600";
}

/** Shown instead of a plain result detail for a cell with more than one run (the repeat axis) --
 *  an aggregate strip up top, then each individual run collapsed into a one-line row that
 *  expands to its full detail (via renderDetail) on click. Generic over the tab's result shape
 *  so chat, embeddings, images, and evaluation all share this instead of four copies. */
export function RepeatSummary<T extends { error?: string; latencyMs: number }>({
  states,
  renderDetail,
  extraSummary,
}: Props<T>) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const agg = aggregateRunStates(states);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-lg border border-white/5 bg-white/[0.02] p-3 text-xs">
        <span className="text-neutral-300">
          {agg.total} run{agg.total === 1 ? "" : "s"}
        </span>
        <span className={agg.failed > 0 ? "text-red-300" : "text-emerald-300"}>
          {agg.succeeded}/{agg.total} succeeded
        </span>
        {agg.avgLatencyMs != null && (
          <span className="font-mono text-neutral-400">
            avg {agg.avgLatencyMs}ms ({agg.minLatencyMs}–{agg.maxLatencyMs}ms)
          </span>
        )}
        {extraSummary}
        {agg.anyLoading && <span className="text-cyan-300">running…</span>}
      </div>

      <div className="flex flex-col gap-2">
        {states.map((state, i) => {
          const isOpen = openIndex === i;
          const latency = state.status === "done" ? `${state.result.latencyMs}ms` : state.status;
          return (
            <div key={i} className="overflow-hidden rounded-lg border border-white/10">
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : i)}
                className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-xs text-neutral-300 transition-colors duration-150 hover:bg-white/[0.03]"
              >
                <span className="flex items-center gap-2">
                  <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dotClass(state)}`} />
                  Run {i + 1}
                </span>
                <span className="font-mono text-neutral-500">{latency}</span>
              </button>
              {isOpen && <div className="border-t border-white/10 p-3">{renderDetail(state)}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
