import type { ReactNode } from "react";

interface Props {
  count: number;
  /** Rendered on the header row, right-aligned next to the run count (e.g. Images' Compare toggle
   *  and size control). Embeddings/Evaluation don't pass one -- there's nothing to pivot there. */
  accessory?: ReactNode;
  children: ReactNode;
}

/**
 * Results shell for the non-chat playground tabs (embeddings, images, evaluation) -- same
 * glass-panel header chrome as Chat's ResultsPanel.
 */
export function SimpleResultsPanel({ count, accessory, children }: Props) {
  if (count === 0) return null;

  return (
    <div className="glass-panel animate-fade-up flex flex-col gap-4 rounded-xl p-4" style={{ animationDelay: "180ms" }}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 text-sm font-medium text-neutral-200">
          Results
          <span className="font-normal text-neutral-500">
            ({count} run{count === 1 ? "" : "s"})
          </span>
        </div>
        {accessory}
      </div>
      {children}
    </div>
  );
}
