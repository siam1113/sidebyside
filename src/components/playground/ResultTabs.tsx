"use client";

import { aggregateRunStates, type CellResults, type RunCell } from "./types";
import { formatCompactNumber } from "@/lib/format";
import { ResultDetail } from "./ResultDetail";
import { RepeatSummary } from "./RepeatSummary";
import { GatewayTabStrip, type TabItem, type TabStatus } from "./GatewayTabStrip";

interface Props {
  cells: RunCell[];
  results: Record<string, CellResults>;
  activeKey: string | null;
  onSelectCell: (key: string) => void;
}

function tabStatusFor(states: CellResults): { status: TabStatus; failed: boolean } {
  if (states.some((s) => s.status === "loading")) return { status: "loading", failed: false };
  if (states.every((s) => s.status === "idle")) return { status: "idle", failed: false };
  const agg = aggregateRunStates(states);
  return { status: "done", failed: agg.failed > 0 };
}

/** Token totals across a repeated cell's successful runs -- chat-only, since only RunResult
 *  carries this usage shape (embeddings/images/eval have their own or none). */
function tokenTotals(states: CellResults): { promptTokens: number | null; completionTokens: number | null } {
  const succeeded = states.filter((s): s is Extract<CellResults[number], { status: "done" }> => s.status === "done" && !s.result.error);
  const sum = (nums: number[]) => (nums.length ? nums.reduce((a, b) => a + b, 0) : null);
  return {
    promptTokens: sum(succeeded.map((s) => s.result.usage?.promptTokens).filter((n): n is number => n != null)),
    completionTokens: sum(succeeded.map((s) => s.result.usage?.completionTokens).filter((n): n is number => n != null)),
  };
}

export function ResultTabs({ cells, results, activeKey, onSelectCell }: Props) {
  const active = cells.find((c) => c.key === activeKey) ?? cells[0];
  // Only show the model/variant as part of the tab label when it actually varies --
  // a single-model, single-variant run just needs the gateway name.
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

  const activeStates = active ? (results[active.key] ?? [{ status: "idle" as const }]) : [{ status: "idle" as const }];

  return (
    <div className="flex flex-col gap-4">
      {cells.length > 1 && <GatewayTabStrip items={items} activeKey={active?.key ?? null} onSelect={onSelectCell} />}

      {active &&
        (activeStates.length > 1 ? (
          <RepeatSummary
            states={activeStates}
            renderDetail={(s) => <ResultDetail modelId={active.modelId} state={s} />}
            extraSummary={(() => {
              const tokens = tokenTotals(activeStates);
              return tokens.promptTokens != null || tokens.completionTokens != null ? (
                <span className="font-mono text-neutral-500">
                  {formatCompactNumber(tokens.promptTokens) ?? "?"} in /{" "}
                  {formatCompactNumber(tokens.completionTokens) ?? "?"} out total
                </span>
              ) : null;
            })()}
          />
        ) : (
          <ResultDetail modelId={active.modelId} state={activeStates[0]} />
        ))}
    </div>
  );
}
