"use client";

import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { GatewayConfig } from "@/lib/gateways/types";
import { useAnchoredPosition } from "@/components/useAnchoredPosition";

interface Props {
  gateways: GatewayConfig[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  onSelectAll: () => void;
  onSelectNone: () => void;
  className?: string;
}

/** Dropdown trigger + checklist panel for picking which gateways to run against
 *  -- replaces the old always-expanded list of toggle pills with a compact select. */
export function GatewayMultiSelect({ gateways, selected, onToggle, onSelectAll, onSelectNone, className }: Props) {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);
  const position = useAnchoredPosition(anchorRef, open);

  const summary =
    selected.size === 0
      ? "Select gateways"
      : selected.size === gateways.length
        ? `All ${gateways.length} selected`
        : `${selected.size} of ${gateways.length} selected`;

  return (
    <div ref={anchorRef} className={`relative ${className ?? ""}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setOpen(false)}
        className="flex w-full items-center justify-between gap-2 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-left text-sm text-neutral-100 transition-colors duration-150 focus:border-cyan-300/40 focus:outline-none focus:ring-2 focus:ring-cyan-300/15"
      >
        <span className={selected.size === 0 ? "text-neutral-600" : "text-neutral-100"}>{summary}</span>
        <svg
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          className={`h-3 w-3 shrink-0 text-neutral-500 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
        >
          <path d="M4 6l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {selected.size > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {gateways
            .filter((gw) => selected.has(gw.id))
            .map((gw) => (
              <span
                key={gw.id}
                className="inline-flex max-w-full items-center gap-1 rounded-md border border-cyan-300/30 bg-cyan-300/10 py-1 pl-2 pr-1 text-xs text-cyan-100"
              >
                <span className="min-w-0 truncate">{gw.name}</span>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => onToggle(gw.id)}
                  className="shrink-0 rounded p-0.5 text-cyan-300/70 transition-colors hover:bg-cyan-300/20 hover:text-cyan-100"
                  aria-label={`Remove ${gw.name}`}
                >
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-3 w-3">
                    <path d="M4 4l8 8M12 4l-8 8" strokeLinecap="round" />
                  </svg>
                </button>
              </span>
            ))}
        </div>
      )}

      {open &&
        position &&
        createPortal(
          <div
            style={{ position: "fixed", top: position.top, left: position.left, width: position.width }}
            className="z-[100] overflow-hidden rounded-lg border border-white/10 bg-[#0a0a0d] shadow-[0_20px_50px_-20px_rgba(0,0,0,0.8)]"
          >
            <div className="flex items-center justify-between border-b border-white/5 px-3 py-1.5">
              <span className="text-[11px] text-neutral-500">
                {gateways.length} gateway{gateways.length === 1 ? "" : "s"}
              </span>
              <div className="flex items-center gap-1 text-xs">
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={onSelectAll}
                  className="rounded-md px-1.5 py-0.5 text-neutral-400 transition-colors hover:text-cyan-200"
                >
                  All
                </button>
                <span className="text-neutral-700">·</span>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={onSelectNone}
                  className="rounded-md px-1.5 py-0.5 text-neutral-400 transition-colors hover:text-cyan-200"
                >
                  None
                </button>
              </div>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {gateways.length === 0 && <p className="px-3 py-3 text-xs text-neutral-500">No gateways configured</p>}
              {gateways.map((gw) => {
                const checked = selected.has(gw.id);
                return (
                  <button
                    key={gw.id}
                    type="button"
                    aria-pressed={checked}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => onToggle(gw.id)}
                    className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors duration-100 ${
                      checked ? "bg-cyan-300/[0.07]" : "hover:bg-white/[0.04]"
                    }`}
                  >
                    <span
                      className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border transition-colors ${
                        checked ? "border-cyan-300 bg-cyan-300/20" : "border-neutral-600"
                      }`}
                    >
                      {checked && (
                        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" className="h-2.5 w-2.5 text-cyan-200">
                          <path d="M3 8.5l3 3 7-7" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </span>
                    <span className={`min-w-0 flex-1 truncate ${checked ? "text-cyan-100" : "text-neutral-300"}`}>{gw.name}</span>
                    <span className="shrink-0 font-mono text-[10px] uppercase tracking-wide text-neutral-600">{gw.protocol}</span>
                  </button>
                );
              })}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
