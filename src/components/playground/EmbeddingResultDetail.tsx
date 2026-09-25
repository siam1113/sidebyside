"use client";

import type { EmbeddingResult } from "@/lib/gateways/types";
import { toFullJson } from "@/lib/gateways/snippets";
import { formatCompactNumber } from "@/lib/format";
import type { AsyncState } from "./types";
import { AsyncResultBody } from "./AsyncResultBody";
import { SummaryStrip, type SummaryItem } from "./SummaryStrip";
import { JsonFlipCard } from "./JsonFlipCard";

interface Props {
  modelId: string;
  state: AsyncState<EmbeddingResult>;
}

function summaryItems(modelId: string, result: EmbeddingResult): SummaryItem[] {
  const failed = Boolean(result.error);
  const items: SummaryItem[] = [
    { label: "Status", value: failed ? "Failed" : "Success", tone: failed ? "error" : "success" },
    { label: "Latency", value: `${result.latencyMs}ms` },
    { label: "HTTP", value: result.response ? `${result.response.status} ${result.response.statusText}` : "—" },
    { label: "Model", value: modelId || "—" },
  ];
  if (!failed) {
    items.push({ label: "Dimensions", value: formatCompactNumber(result.dimensions) ?? String(result.dimensions) });
  }
  if (result.usage?.totalTokens != null) {
    items.push({ label: "Tokens", value: formatCompactNumber(result.usage.totalTokens) ?? String(result.usage.totalTokens) });
  }
  if (result.response?.timestampIso) {
    items.push({ label: "Time", value: new Date(result.response.timestampIso).toLocaleTimeString() });
  }
  return items;
}

export function EmbeddingResultDetail({ modelId, state }: Props) {
  return (
    <AsyncResultBody
      state={state}
      renderDone={(result) => {
        const failed = Boolean(result.error);
        return (
          <div className="flex flex-col gap-4">
            <SummaryStrip items={summaryItems(modelId, result)} />

            <JsonFlipCard failed={failed} json={toFullJson(result)}>
              {failed ? (
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-red-300">{result.error}</p>
              ) : (
                <p className="whitespace-pre-wrap break-words font-mono text-xs leading-relaxed text-neutral-300">
                  [{result.embedding.slice(0, 12).map((n) => n.toFixed(4)).join(", ")}
                  {result.embedding.length > 12 ? ", ..." : ""}]
                </p>
              )}
            </JsonFlipCard>
          </div>
        );
      }}
    />
  );
}
