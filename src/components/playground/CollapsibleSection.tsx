"use client";

import { useState, type CSSProperties, type ReactNode } from "react";

interface Props {
  title: string;
  defaultOpen?: boolean;
  /** Small muted text shown after the title, e.g. a selection count. */
  subtitle?: ReactNode;
  /** Small icon badge shown before the title. */
  icon?: ReactNode;
  /** Rendered next to the header, outside the toggle button (e.g. All/None actions). */
  accessory?: ReactNode;
  /** Passed through to the root element -- lets callers add e.g. a staggered entrance animation. */
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}

/** One accordion row: click the header to show/hide its body. Used to build up the sidebar's sections. */
export function CollapsibleSection({
  title,
  defaultOpen = true,
  subtitle,
  icon,
  accessory,
  className,
  style,
  children,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={`flex flex-col gap-3 py-5 first:pt-0 last:pb-0 ${className ?? ""}`} style={style}>
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex min-w-0 items-center gap-1.5 text-sm font-medium text-neutral-200 transition-colors hover:text-neutral-50"
        >
          <svg
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            className={`h-3 w-3 shrink-0 transition-transform duration-200 ${open ? "rotate-90" : ""}`}
          >
            <path d="M6 3l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {icon && (
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-white/10 bg-white/[0.04] text-cyan-200">
              {icon}
            </span>
          )}
          <span className="shrink-0">{title}</span>
          {subtitle && <span className="min-w-0 flex-1 truncate font-normal text-neutral-500">{subtitle}</span>}
        </button>
        {accessory && <div className="shrink-0">{accessory}</div>}
      </div>
      {open && children}
    </div>
  );
}
