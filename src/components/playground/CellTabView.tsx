"use client";

import { useState, type ReactNode } from "react";
import { aggregateRunStates, type CellResults, type RunCell } from "./types";
import { RepeatSummary } from "./RepeatSummary";
import { GatewayTabStrip, type TabItem, type TabStatus } from "./GatewayTabStrip";

interface Props<T extends { error?: string; latencyMs: number }> {
  cells: RunCell[];
  results: Record<string, CellResults<T>>;
  renderDetail: (cell: RunCell, state: CellResults<T>[number]) => ReactNode;
}

function tabStatusFor<T extends { error?: string; latencyMs: number }>(
  states: CellResults<T>,
): { status: TabStatus; failed: boolean } {
  if (states.some((s) => s.status === "loading")) return { status: "loading", failed: false };
  if (states.every((s) => s.status === "idle")) return { status: "idle", failed: false };
  const agg = aggregateRunStates(states);
  return { status: "done", failed: agg.failed > 0 };
}

/**
 * Generic per-cell tab strip + detail view -- the embeddings/images/evaluation equivalent of
 * Chat's ResultTabs, keyed by (gateway, model, variant) cell so a gateway x model cross product
 * shows up as one tab per combination, same as Chat.
 */
export function CellTabView<T extends { error?: string; latencyMs: number }>({ cells, results, renderDetail }: Props<T>) {
  const [activeKey, setActiveKey] = useState<string | null>(cells[0]?.key ?? null);
  const active = cells.find((c) => c.key === activeKey) ?? cells[0];
  // Only show the model as part of the tab label when it actually varies -- a single-model
  // run just needs the gateway name.
  const showModel = new Set(cells.map((c) => c.modelId)).size > 1;
  const showVariant = new Set(cells.map((c) => c.variant.id)).size > 1;

  const items: TabItem[] = cells.map((cell) => {
    const states = results[cell.key] ?? [{ status: "idle" as const }];
    const repeatNote = states.length > 1 ? `${aggregateRunStates(states).succeeded}/${states.length}` : null;
    const subtitleParts = [showModel ? cell.modelId : null, showVariant ? cell.variant.label : null, repeatNote].filter(
      (v): v is string => Boolean(v),
    );
    return {
      key: cell.key,
      title: cell.gateway.name,
      subtitle: subtitleParts.length > 0 ? subtitleParts.join(" · ") : undefined,
      ...tabStatusFor(states),
    };
  });

  const activeStates: CellResults<T> = active ? (results[active.key] ?? [{ status: "idle" as const }]) : [{ status: "idle" as const }];

  return (
    <div className="flex flex-col gap-4">
      {cells.length > 1 && <GatewayTabStrip items={items} activeKey={active?.key ?? null} onSelect={setActiveKey} />}

      {active &&
        (activeStates.length > 1 ? (
          <RepeatSummary states={activeStates} renderDetail={(s) => renderDetail(active, s)} />
        ) : (
          renderDetail(active, activeStates[0])
        ))}
    </div>
  );
}
