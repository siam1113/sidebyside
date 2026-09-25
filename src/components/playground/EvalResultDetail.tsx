"use client";

import type { EvalResult } from "@/lib/gateways/types";
import { toFullJson } from "@/lib/gateways/snippets";
import { formatCompactNumber } from "@/lib/format";
import type { AsyncState } from "./types";
import { AsyncResultBody } from "./AsyncResultBody";
import { SummaryStrip, type SummaryItem } from "./SummaryStrip";
import { JsonFlipCard } from "./JsonFlipCard";
import { AnswerView } from "./AnswerView";

interface Props {
  modelId: string;
  state: AsyncState<EvalResult>;
}

function summaryItems(modelId: string, result: EvalResult): SummaryItem[] {
  const failed = Boolean(result.error);
  const items: SummaryItem[] = [
    { label: "Status", value: failed ? "Failed" : "Success", tone: failed ? "error" : "success" },
    { label: "Latency", value: `${result.latencyMs}ms` },
    { label: "HTTP", value: result.response ? `${result.response.status} ${result.response.statusText}` : "—" },
    { label: "Model", value: modelId || "—" },
  ];
  if (result.usage) {
    items.push({
      label: "Tokens",
      value: `${formatCompactNumber(result.usage.inputTokens) ?? "?"} in / ${
        formatCompactNumber(result.usage.outputTokens) ?? "?"
      } out`,
    });
  }
  if (result.response?.timestampIso) {
    items.push({ label: "Time", value: new Date(result.response.timestampIso).toLocaleTimeString() });
  }
  return items;
}

export function EvalResultDetail({ modelId, state }: Props) {
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
                <div className="flex flex-col gap-2">
                  {Object.entries(result.answers).map(([key, answer]) => (
                    <AnswerView key={key} questionKey={key} answer={answer} />
                  ))}
                </div>
              )}
            </JsonFlipCard>
          </div>
        );
      }}
    />
  );
}
