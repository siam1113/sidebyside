"use client";

import { useState } from "react";
import type { CellResults, RunCell } from "./types";
import { ResultTabs } from "./ResultTabs";
import { CompareTable } from "./CompareTable";

interface Props {
  cells: RunCell[];
  results: Record<string, CellResults>;
  prompt: string;
}

export function ResultsPanel({ cells, results, prompt }: Props) {
  const [compareMode, setCompareMode] = useState(false);
  const [activeKey, setActiveKey] = useState<string | null>(cells[0]?.key ?? null);

  if (cells.length === 0) return null;

  const canCompare = cells.length >= 2;
  const gatewayCount = new Set(cells.map((c) => c.gateway.id)).size;
  const modelCount = new Set(cells.map((c) => c.modelId)).size;

  return (
    <div className="glass-panel animate-fade-up flex flex-col gap-4 rounded-xl p-4" style={{ animationDelay: "180ms" }}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 text-sm font-medium text-neutral-200">
          Results
          <span className="font-normal text-neutral-500">
            ({cells.length} run{cells.length === 1 ? "" : "s"}
            {modelCount > 1 ? ` · ${gatewayCount} gateway${gatewayCount === 1 ? "" : "s"} × ${modelCount} models` : ""})
          </span>
        </div>

        {canCompare && (
          <button
            type="button"
            onClick={() => setCompareMode((v) => !v)}
            className={`shrink-0 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors duration-150 ${
              compareMode
                ? "border-cyan-300/30 bg-cyan-300/10 text-cyan-100"
                : "border-white/10 text-neutral-400 hover:border-white/20 hover:text-neutral-200"
            }`}
          >
            {compareMode ? "Back to tabs" : "Compare"}
          </button>
        )}
      </div>

      {compareMode ? (
        <CompareTable cells={cells} results={results} prompt={prompt} />
      ) : (
        <ResultTabs cells={cells} results={results} activeKey={activeKey} onSelectCell={setActiveKey} />
      )}
    </div>
  );
}
