"use client";

import { useEffect, useState, type ReactNode } from "react";

interface Props {
  title?: string;
  children: ReactNode;
  /** Notified whenever the drawer opens/closes, so the page can reserve
   *  space beside it (push layout) instead of the drawer covering content. */
  onOpenChange?: (open: boolean) => void;
  /** Controlled open state -- lets a button elsewhere on the page (e.g. an
   *  empty-results CTA) open the drawer. Omit to keep the drawer fully
   *  self-contained, driven only by its own toggle tab. */
  open?: boolean;
}

function SlidersIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-3 w-3 shrink-0">
      <path d="M2 5h6m4 0h2M2 11h2m4 0h6" strokeLinecap="round" />
      <circle cx="9.5" cy="5" r="1.6" />
      <circle cx="6.5" cy="11" r="1.6" />
    </svg>
  );
}

/**
 * True off-canvas drawer pinned to the browser window's right edge, below
 * the sticky site header (position: fixed breaks it out of the page's
 * centered max-width container). Expanded by default as a push panel -- a
 * toggle tab re-opens it once dismissed. The drawer itself is max-w-[420px],
 * so callers reserve ~440px of right padding on their content area via
 * onOpenChange so the drawer never covers the results. On narrow viewports
 * (below lg, where there's no room to push) it falls back to an overlay
 * with a dismiss backdrop. Shared shell for every Playground tab's
 * configuration panel (Chat, Embeddings, Images, Evaluation) -- each just
 * supplies its own form content as children.
 */
export function ConfigDrawer({ title = "Configuration", children, onOpenChange, open: openProp }: Props) {
  const [openState, setOpenState] = useState(true);
  const isControlled = openProp !== undefined;
  const open = isControlled ? openProp : openState;

  function setOpen(next: boolean) {
    if (!isControlled) setOpenState(next);
    onOpenChange?.(next);
  }

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={`Open ${title.toLowerCase()} panel`}
          className="fixed right-0 top-24 z-[65] flex items-center gap-1.5 rounded-l-lg border border-r-0 border-white/10 bg-[#0a0a0d]/95 px-3 py-2.5 text-xs font-medium text-neutral-300 shadow-[-8px_0_24px_-12px_rgba(0,0,0,0.6)] backdrop-blur-xl transition-all duration-200 ease-[var(--ease-out-quart)] hover:border-cyan-300/25 hover:bg-white/[0.06] hover:text-neutral-100"
        >
          <SlidersIcon />
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-3 w-3 shrink-0">
            <path d="M10 3l-5 5 5 5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {title}
        </button>
      )}

      {/* Backdrop only shows below lg: on narrow viewports there's no room
          to push content aside, so the drawer falls back to overlaying it. */}
      {open && (
        <div
          className="animate-backdrop-in fixed inset-0 z-[55] bg-black/50 backdrop-blur-[1px] lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      <div
        className={`fixed right-0 top-16 bottom-0 z-[60] flex w-full max-w-[420px] flex-col border-l border-white/10 bg-[#0a0a0d] shadow-[-24px_0_60px_-24px_rgba(0,0,0,0.7)] transition-transform duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label={`${title} panel`}
      >
        <div aria-hidden="true" className="h-[2px] shrink-0 bg-gradient-to-r from-cyan-300/70 via-violet-400/60 to-transparent" />
        <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-4 py-3">
          <span className="flex min-w-0 items-center gap-2">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-cyan-300/20 bg-cyan-300/10 text-cyan-200">
              <SlidersIcon />
            </span>
            <span className="truncate text-sm font-medium text-neutral-200">{title}</span>
          </span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label={`Close ${title.toLowerCase()} panel`}
            className="group shrink-0 rounded-md p-1 text-neutral-500 transition-colors duration-150 hover:bg-white/[0.06] hover:text-neutral-200"
          >
            <svg
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              className="h-4 w-4 transition-transform duration-200 ease-[var(--ease-out-quart)] group-hover:rotate-90"
            >
              <path d="M4 4l8 8M12 4l-8 8" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-4">{children}</div>
      </div>
    </>
  );
}
