"use client";

import type { RunResult } from "@/lib/gateways/types";
import { toFullJson } from "@/lib/gateways/snippets";
import { formatCompactNumber } from "@/lib/format";
import type { RunState } from "./types";
import { AsyncResultBody } from "./AsyncResultBody";
import { SummaryStrip, type SummaryItem } from "./SummaryStrip";
import { JsonFlipCard } from "./JsonFlipCard";
import { Markdown } from "./Markdown";
import { IMAGE_SIZE_PX } from "./imageSize";

interface Props {
  modelId: string;
  state: RunState;
}

function summaryItems(modelId: string, result: RunResult): SummaryItem[] {
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
      value: `${formatCompactNumber(result.usage.promptTokens) ?? "?"} in / ${
        formatCompactNumber(result.usage.completionTokens) ?? "?"
      } out${
        result.usage.totalTokens != null ? ` / ${formatCompactNumber(result.usage.totalTokens)} total` : ""
      }`,
    });
  }
  if (result.response?.timestampIso) {
    items.push({
      label: "Time",
      value: new Date(result.response.timestampIso).toLocaleTimeString(),
    });
  }
  return items;
}

export function ResultDetail({ modelId, state }: Props) {
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
                <div className="flex flex-col gap-3">
                  {result.text ? (
                    <div className="text-sm leading-relaxed text-neutral-200">
                      <Markdown text={result.text} />
                    </div>
                  ) : !result.images?.length ? (
                    <p className="text-sm leading-relaxed text-neutral-500">(empty response)</p>
                  ) : null}
                  {result.images && result.images.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-2">
                      {result.images.map((src, i) => (
                        // Fixed px size, not w-full/%: see ImageResultDetail.tsx for why a
                        // percentage-sized image inside JsonFlipCard's flip transform blows up
                        // to a rasterization-limit-exceeding size and never paints.
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          key={i}
                          src={src}
                          alt={`Generated ${i + 1}`}
                          style={{ width: IMAGE_SIZE_PX.md, height: IMAGE_SIZE_PX.md }}
                          className="rounded-lg border border-white/10 object-cover"
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </JsonFlipCard>

            {result.warnings && result.warnings.length > 0 && (
              <div className="rounded-lg border border-amber-500/20 bg-amber-500/[0.07] px-3 py-2 text-xs text-amber-300">
                {result.warnings.map((w, i) => (
                  <p key={i} className={i > 0 ? "mt-1" : undefined}>
                    {w}
                  </p>
                ))}
              </div>
            )}
          </div>
        );
      }}
    />
  );
}
