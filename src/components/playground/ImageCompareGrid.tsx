"use client";

import type { ImageResult } from "@/lib/gateways/types";
import { aggregateRunStates, type CellResults, type RunCell } from "./types";
import { IMAGE_SIZE_PX, type ImageSizePreset } from "./imageSize";
import { SummaryStrip, type SummaryItem } from "./SummaryStrip";
import { summaryItems } from "./ImageResultDetail";

interface Props {
  cells: RunCell[];
  results: Record<string, CellResults<ImageResult>>;
  imageSize: ImageSizePreset;
}

/** All of a cell's generated images across every repeat run, flattened into one strip -- keeps
 *  the compare grid simple (no separate per-repeat sub-view) while still surfacing every image a
 *  repeated cell produced. */
function imagesFor(states: CellResults<ImageResult>): string[] {
  return states
    .filter((s): s is Extract<CellResults<ImageResult>[number], { status: "done" }> => s.status === "done" && !s.result.error)
    .flatMap((s) => s.result.images);
}

/** Same metadata shown in the single-cell tab view (ImageResultDetail's summaryItems), but
 *  collapsed across repeats when the repeat axis is on -- status becomes a success ratio and
 *  latency an average/spread, matching how Chat's CompareTable aggregates repeated cells. */
function metadataItems(modelId: string, states: CellResults<ImageResult>): SummaryItem[] | null {
  if (states.length === 1) {
    return states[0].status === "done" ? summaryItems(modelId, states[0].result) : null;
  }
  const agg = aggregateRunStates(states);
  if (agg.anyLoading) return null;
  const totalImages = imagesFor(states).length;
  return [
    {
      label: "Status",
      value: `${agg.succeeded}/${agg.total} succeeded`,
      tone: agg.succeeded === agg.total ? "success" : agg.succeeded === 0 ? "error" : undefined,
    },
    {
      label: "Latency",
      value: agg.avgLatencyMs != null ? `avg ${agg.avgLatencyMs}ms (${agg.minLatencyMs}–${agg.maxLatencyMs}ms)` : "—",
    },
    { label: "Model", value: modelId || "—" },
    { label: "Images", value: String(totalImages) },
  ];
}

/** Side-by-side visual comparison for the Images tab -- every cell's generated image(s) and full
 *  metadata shown at once in a centered grid, the way Chat's CompareTable pivots text responses
 *  into a table. Images (and their stats) don't fit a data table well, so this is a card grid
 *  instead: one card per (gateway, model, variant) cell with its image(s), status, and latency. */
export function ImageCompareGrid({ cells, results, imageSize }: Props) {
  const sizePx = IMAGE_SIZE_PX[imageSize];
  const showModel = new Set(cells.map((c) => c.modelId)).size > 1;
  const showVariant = new Set(cells.map((c) => c.variant.id)).size > 1;

  return (
    <div className="flex flex-wrap justify-center gap-4">
      {cells.map((cell) => {
        const states = results[cell.key] ?? [{ status: "idle" as const }];
        const agg = aggregateRunStates(states);
        const anyLoading = agg.anyLoading;
        const images = imagesFor(states);
        const failed = !anyLoading && agg.total > 0 && agg.succeeded === 0;
        const metadata = metadataItems(cell.modelId, states);

        return (
          <div
            key={cell.key}
            className="flex flex-col items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.02] p-3"
            style={{ width: Math.max(sizePx + 24, 220) }}
          >
            <div className="w-full text-center">
              <p className="truncate text-xs font-medium text-neutral-200">{cell.gateway.name}</p>
              {showModel && <p className="truncate font-mono text-[10px] text-neutral-500">{cell.modelId}</p>}
              {showVariant && cell.variant.label && (
                <p className="truncate text-[10px] text-neutral-500">{cell.variant.label}</p>
              )}
            </div>

            {anyLoading ? (
              <div className="animate-shimmer rounded-lg" style={{ width: sizePx, height: sizePx }} />
            ) : failed ? (
              <div
                className="flex items-center justify-center rounded-lg border border-red-500/20 bg-red-500/[0.07] p-2 text-center text-[11px] leading-relaxed text-red-300"
                style={{ width: sizePx, height: sizePx }}
              >
                {states.find((s) => s.status === "error")?.message ??
                  (states.find((s) => s.status === "done") as { result: ImageResult } | undefined)?.result.error ??
                  "Failed"}
              </div>
            ) : images.length === 0 ? (
              <div
                className="flex items-center justify-center rounded-lg border border-white/10 bg-black/20 text-xs text-neutral-500"
                style={{ width: sizePx, height: sizePx }}
              >
                (no image)
              </div>
            ) : (
              <div className="flex flex-wrap justify-center gap-1.5">
                {images.map((src, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={i}
                    src={src}
                    alt={`${cell.gateway.name} Generated ${i + 1}`}
                    style={{ width: sizePx, height: sizePx }}
                    className="rounded-lg border border-white/10 object-cover"
                  />
                ))}
              </div>
            )}

            {metadata && <SummaryStrip items={metadata} />}
          </div>
        );
      })}
    </div>
  );
}
