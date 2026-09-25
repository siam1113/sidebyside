"use client";

import type { ImageResult } from "@/lib/gateways/types";
import { toFullJson } from "@/lib/gateways/snippets";
import type { AsyncState } from "./types";
import { AsyncResultBody } from "./AsyncResultBody";
import { SummaryStrip, type SummaryItem } from "./SummaryStrip";
import { JsonFlipCard } from "./JsonFlipCard";
import { IMAGE_SIZE_PX, type ImageSizePreset } from "./imageSize";

interface Props {
  modelId: string;
  state: AsyncState<ImageResult>;
  imageSize?: ImageSizePreset;
}

export function summaryItems(modelId: string, result: ImageResult): SummaryItem[] {
  const failed = Boolean(result.error);
  const items: SummaryItem[] = [
    { label: "Status", value: failed ? "Failed" : "Success", tone: failed ? "error" : "success" },
    { label: "Latency", value: `${result.latencyMs}ms` },
    { label: "HTTP", value: result.response ? `${result.response.status} ${result.response.statusText}` : "—" },
    { label: "Model", value: modelId || "—" },
  ];
  if (!failed) {
    items.push({ label: "Images", value: String(result.images.length) });
  }
  if (result.response?.timestampIso) {
    items.push({ label: "Time", value: new Date(result.response.timestampIso).toLocaleTimeString() });
  }
  return items;
}

export function ImageResultDetail({ modelId, state, imageSize = "md" }: Props) {
  const sizePx = IMAGE_SIZE_PX[imageSize];
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
              ) : result.images.length === 0 ? (
                <p className="text-sm leading-relaxed text-neutral-500">(no image returned)</p>
              ) : (
                <div className="flex flex-wrap justify-center gap-2">
                  {result.images.map((src, i) => (
                    // Fixed px size, not w-full/%: a percentage-sized <img> here forces Chromium's
                    // grid track auto-sizing (JsonFlipCard's [grid-area:1/1] flip faces sit inside a
                    // transform-style:preserve-3d ancestor) into a circular resolution that blows the
                    // image up to ~1-2 million px -- effectively invisible since it exceeds the
                    // browser's rasterization limit. An absolute size sidesteps the loop entirely.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={i}
                      src={src}
                      alt={`Generated ${i + 1}`}
                      style={{ width: sizePx, height: sizePx }}
                      className="rounded-lg border border-white/10 object-cover"
                    />
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
