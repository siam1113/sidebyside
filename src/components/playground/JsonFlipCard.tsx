"use client";

import { useState, type ReactNode } from "react";
import { CopyButton } from "./CopyButton";
import { JsonToggleButton } from "./JsonToggleButton";

interface Props {
  failed: boolean;
  json: string;
  children: ReactNode;
}

/**
 * The card body shared by every result detail view: front face is
 * caller-supplied content, back face is the raw JSON, flipped via the
 * JsonToggleButton. Lifted out of Chat's ResultDetail so every modality
 * (embeddings, images, evaluation) gets the same interaction and chrome.
 */
export function JsonFlipCard({ failed, json, children }: Props) {
  const [showJson, setShowJson] = useState(false);

  return (
    <div
      className={`relative rounded-lg border p-3 pr-12 ${
        failed ? "border-red-500/20 bg-red-500/[0.07]" : "border-white/5 bg-white/[0.02]"
      }`}
      style={{ perspective: "1600px" }}
    >
      <JsonToggleButton active={showJson} onClick={() => setShowJson((v) => !v)} />
      {showJson && (
        <div className="absolute right-12 top-2">
          <CopyButton text={json} />
        </div>
      )}

      <div
        className="grid transition-transform duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] motion-reduce:transition-none [transform-style:preserve-3d]"
        style={{ transform: showJson ? "rotateY(180deg)" : "rotateY(0deg)" }}
      >
        <div
          className={`[backface-visibility:hidden] [grid-area:1/1] ${showJson ? "pointer-events-none" : ""}`}
          aria-hidden={showJson}
        >
          {children}
        </div>

        <div
          className={`[backface-visibility:hidden] [grid-area:1/1] [transform:rotateY(180deg)] ${
            showJson ? "" : "pointer-events-none"
          }`}
          aria-hidden={!showJson}
        >
          <pre className="max-h-96 overflow-auto whitespace-pre-wrap break-words pr-28 font-mono text-xs leading-relaxed text-neutral-300">
            {json}
          </pre>
        </div>
      </div>
    </div>
  );
}
