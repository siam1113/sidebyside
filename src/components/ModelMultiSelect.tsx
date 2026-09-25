"use client";

import { useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { ModelInfo } from "@/lib/gateways/adapters/models";
import { useAnchoredPosition } from "@/components/useAnchoredPosition";
import { formatCompactNumber } from "@/lib/format";
import { capabilitiesMatch } from "@/lib/capabilities";
import { CapabilityChips } from "@/components/CapabilityChips";

interface Props {
  id?: string;
  values: string[];
  onChange: (values: string[]) => void;
  options: ModelInfo[];
  loading?: boolean;
  error?: string | null;
  placeholder?: string;
  disabled?: boolean;
  /** Called every time the panel opens -- caller can lazily kick off a cache-aware fetch. */
  onOpen?: () => void;
  /** When provided, shows a "Refresh" action that bypasses the cache. */
  onRefresh?: () => void;
  className?: string;
}

/** Same look as ModelCombobox, but clicking a row toggles membership instead of committing a single value. */
export function ModelMultiSelect({
  id,
  values,
  onChange,
  options,
  loading,
  error,
  placeholder,
  disabled,
  onOpen,
  onRefresh,
  className,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const anchorRef = useRef<HTMLDivElement>(null);
  const position = useAnchoredPosition(anchorRef, open);
  const selected = useMemo(() => new Set(values), [values]);
  const optionsById = useMemo(() => new Map(options.map((m) => [m.id, m])), [options]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (m) =>
        m.id.toLowerCase().includes(q) ||
        m.label?.toLowerCase().includes(q) ||
        capabilitiesMatch(m.capabilities, q),
    );
  }, [options, query]);

  function openPanel() {
    setOpen(true);
    onOpen?.();
  }

  function toggle(id: string) {
    onChange(selected.has(id) ? values.filter((v) => v !== id) : [...values, id]);
  }

  function remove(id: string) {
    onChange(values.filter((v) => v !== id));
  }

  return (
    <div ref={anchorRef} className={`relative ${className ?? ""}`}>
      {values.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {values.map((id) => {
            const model = optionsById.get(id);
            return (
              <span
                key={id}
                className="inline-flex max-w-full items-center gap-1 rounded-md border border-cyan-300/30 bg-cyan-300/10 py-1 pl-2 pr-1 text-xs text-cyan-100"
              >
                <span className="min-w-0 truncate font-mono">{model?.label ?? id}</span>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => remove(id)}
                  className="shrink-0 rounded p-0.5 text-cyan-300/70 transition-colors hover:bg-cyan-300/20 hover:text-cyan-100"
                  aria-label={`Remove ${id}`}
                >
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-3 w-3">
                    <path d="M4 4l8 8M12 4l-8 8" strokeLinecap="round" />
                  </svg>
                </button>
              </span>
            );
          })}
        </div>
      )}
      <input
        id={id}
        className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-600 transition-colors duration-150 focus:border-cyan-300/40 focus:outline-none focus:ring-2 focus:ring-cyan-300/15"
        value={query}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={openPanel}
        onBlur={() => setOpen(false)}
        autoComplete="off"
      />
      {open &&
        position &&
        createPortal(
          <div
            style={{ position: "fixed", top: position.top, left: position.left, width: position.width }}
            className="z-[100] overflow-hidden rounded-lg border border-white/10 bg-[#0a0a0d] shadow-[0_20px_50px_-20px_rgba(0,0,0,0.8)]"
          >
            <div className="flex items-center justify-between border-b border-white/5 px-3 py-1.5">
              <span className="text-[11px] text-neutral-500">
                {loading
                  ? "Fetching models..."
                  : `${filtered.length} model${filtered.length === 1 ? "" : "s"}${
                      values.length > 0 ? ` · ${values.length} selected` : ""
                    }`}
              </span>
              {onRefresh && (
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={onRefresh}
                  className="text-[11px] text-cyan-300 transition-colors hover:text-cyan-100"
                >
                  Refresh
                </button>
              )}
            </div>
            <div className="max-h-64 overflow-y-auto">
              {loading && options.length === 0 && (
                <div className="flex flex-col gap-1.5 p-2">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="animate-shimmer h-9 rounded-md" />
                  ))}
                </div>
              )}
              {!loading && error && <p className="px-3 py-3 text-xs text-red-400">{error}</p>}
              {!loading && !error && filtered.length === 0 && (
                <p className="px-3 py-3 text-xs text-neutral-500">
                  {options.length === 0 ? "No models fetched yet" : "No matches"}
                </p>
              )}
              {filtered.map((m) => {
                const isSelected = selected.has(m.id);
                const contextLabel = formatCompactNumber(m.contextLength);
                const outputLabel = formatCompactNumber(m.maxOutputTokens);
                return (
                  <button
                    key={m.id}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => toggle(m.id)}
                    className={`flex w-full flex-col gap-0.5 px-3 py-2 text-left transition-colors duration-100 ${
                      isSelected ? "bg-cyan-300/[0.07]" : "hover:bg-white/[0.04]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex min-w-0 items-center gap-1.5">
                        <span
                          className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border transition-colors ${
                            isSelected ? "border-cyan-300 bg-cyan-300/20" : "border-neutral-600"
                          }`}
                        >
                          {isSelected && (
                            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" className="h-2.5 w-2.5 text-cyan-200">
                              <path d="M3 8.5l3 3 7-7" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </span>
                        <span className="truncate font-mono text-xs text-neutral-200">{m.id}</span>
                      </span>
                      {(contextLabel || outputLabel) && (
                        <span className="shrink-0 font-mono text-[10px] text-neutral-500">
                          {contextLabel && `${contextLabel} ctx`}
                          {contextLabel && outputLabel && " · "}
                          {outputLabel && `${outputLabel} out`}
                        </span>
                      )}
                    </div>
                    {(m.label || m.meta || m.capabilities) && (
                      <div className="flex items-center gap-1.5 pl-5 text-[11px] text-neutral-500">
                        {m.label && <span className="truncate">{m.label}</span>}
                        {m.meta && <span className="shrink-0 text-neutral-600">{m.meta}</span>}
                        <CapabilityChips capabilities={m.capabilities} />
                      </div>
                    )}
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
