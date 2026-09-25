"use client";

import { useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { ModelInfo } from "@/lib/gateways/adapters/models";
import { formatCompactNumber } from "@/lib/format";
import { capabilitiesMatch } from "@/lib/capabilities";
import { CapabilityChips } from "@/components/CapabilityChips";
import { useAnchoredPosition } from "@/components/useAnchoredPosition";

interface Props {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  options: ModelInfo[];
  loading?: boolean;
  error?: string | null;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  /** Called every time the panel opens -- caller can lazily kick off a cache-aware fetch. */
  onOpen?: () => void;
  /** When provided, shows a "Refresh" action that bypasses the cache. */
  onRefresh?: () => void;
  className?: string;
}

export function ModelCombobox({
  id,
  value,
  onChange,
  options,
  loading,
  error,
  placeholder,
  disabled,
  required,
  onOpen,
  onRefresh,
  className,
}: Props) {
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const anchorRef = useRef<HTMLDivElement>(null);
  const position = useAnchoredPosition(anchorRef, open);

  // `value` is always the raw id (what actually gets sent to the API/onChange). While the field
  // isn't focused, show the model's friendly label instead so the box doesn't just read back an id.
  const matched = useMemo(() => options.find((m) => m.id === value), [options, value]);
  const displayValue = !focused && matched?.label ? matched.label : value;

  const filtered = useMemo(() => {
    const q = value.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (m) =>
        m.id.toLowerCase().includes(q) ||
        m.label?.toLowerCase().includes(q) ||
        capabilitiesMatch(m.capabilities, q),
    );
  }, [options, value]);

  function openPanel() {
    setOpen(true);
    setHighlighted(-1);
    onOpen?.();
  }

  function select(model: ModelInfo) {
    onChange(model.id);
    setOpen(false);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) {
        openPanel();
        return;
      }
      setHighlighted((h) => Math.min(h + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      if (open && highlighted >= 0 && filtered[highlighted]) {
        e.preventDefault();
        select(filtered[highlighted]);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={anchorRef} className={`relative ${className ?? ""}`}>
      <input
        id={id}
        className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-600 transition-colors duration-150 focus:border-cyan-300/40 focus:outline-none focus:ring-2 focus:ring-cyan-300/15"
        value={displayValue}
        disabled={disabled}
        required={required}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => {
          setFocused(true);
          openPanel();
        }}
        onBlur={() => {
          setFocused(false);
          setOpen(false);
        }}
        onKeyDown={onKeyDown}
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
                  : `${filtered.length} model${filtered.length === 1 ? "" : "s"}`}
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
              {filtered.map((m, i) => {
                const contextLabel = formatCompactNumber(m.contextLength);
                const outputLabel = formatCompactNumber(m.maxOutputTokens);
                const active = i === highlighted;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => select(m)}
                    onMouseEnter={() => setHighlighted(i)}
                    className={`flex w-full flex-col gap-0.5 px-3 py-2 text-left transition-colors duration-100 ${
                      active ? "bg-cyan-300/10" : "hover:bg-white/[0.04]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate font-mono text-xs text-neutral-200">{m.id}</span>
                      {(contextLabel || outputLabel) && (
                        <span className="shrink-0 font-mono text-[10px] text-neutral-500">
                          {contextLabel && `${contextLabel} ctx`}
                          {contextLabel && outputLabel && " · "}
                          {outputLabel && `${outputLabel} out`}
                        </span>
                      )}
                    </div>
                    {(m.label || m.meta || m.capabilities) && (
                      <div className="flex items-center gap-1.5 text-[11px] text-neutral-500">
                        {m.label && <span className="truncate">{m.label}</span>}
                        {m.meta && <span className="shrink-0 text-neutral-600">{m.meta}</span>}
                        <CapabilityChips capabilities={m.capabilities} />
                      </div>
                    )}
                    {m.description && (
                      <p className="truncate text-[11px] text-neutral-600">{m.description}</p>
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
