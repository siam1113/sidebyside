"use client";

import { useEffect, useState, type ReactNode } from "react";

const CLOSE_ANIMATION_MS = 160;

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  /** Small icon badge shown before the title. */
  icon?: ReactNode;
  children: ReactNode;
  /** Tailwind max-width class for the dialog panel. */
  maxWidthClassName?: string;
}

/** Generic centered modal dialog -- backdrop click and Escape both close it.
 *  Plays a scale/fade entrance and a matching exit before unmounting. */
export function Modal({ open, onClose, title, icon, children, maxWidthClassName = "max-w-lg" }: Props) {
  const [mounted, setMounted] = useState(open);
  const [closing, setClosing] = useState(false);
  const [prevOpen, setPrevOpen] = useState(open);

  // Adjust mount/closing state in response to the `open` prop changing --
  // done during render (React's documented "storing info from previous
  // renders" pattern) rather than in an effect, avoiding an extra render pass.
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setMounted(true);
      setClosing(false);
    } else if (mounted) {
      setClosing(true);
    }
  }

  useEffect(() => {
    if (!closing) return;
    const timeout = setTimeout(() => {
      setMounted(false);
      setClosing(false);
    }, CLOSE_ANIMATION_MS);
    return () => clearTimeout(timeout);
  }, [closing]);

  useEffect(() => {
    if (!mounted) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mounted, onClose]);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm ${closing ? "animate-backdrop-out" : "animate-backdrop-in"}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`relative flex max-h-[85vh] w-full ${maxWidthClassName} flex-col overflow-hidden rounded-xl border border-white/10 bg-[#0a0a0d] shadow-[0_24px_80px_-24px_rgba(0,0,0,0.85)] ${
          closing ? "animate-modal-out" : "animate-modal-in"
        }`}
      >
        <div aria-hidden="true" className="h-[2px] shrink-0 bg-gradient-to-r from-cyan-300/70 via-violet-400/60 to-transparent" />
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
          <span className="flex min-w-0 items-center gap-2">
            {icon && (
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-cyan-300/20 bg-cyan-300/10 text-cyan-200">
                {icon}
              </span>
            )}
            <span className="truncate text-sm font-medium text-neutral-200">{title}</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label={`Close ${title.toLowerCase()}`}
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
    </div>
  );
}
