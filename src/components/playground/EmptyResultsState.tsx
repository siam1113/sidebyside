"use client";

interface Props {
  title: string;
  description: string;
}

/**
 * Shown in the results area before the first run -- otherwise that whole
 * section is just blank space now that configuration lives in an off-canvas
 * drawer instead of an always-visible column, which reads as broken rather
 * than "nothing run yet". No call-to-action here since the drawer is open
 * by default -- the configuration is already right there.
 */
export function EmptyResultsState({ title, description }: Props) {
  return (
    <div className="glass-panel animate-fade-up flex flex-col items-center gap-4 rounded-xl border-dashed p-10 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/[0.03]">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5 text-neutral-500">
          <path d="M4 5h16M4 5v14a1 1 0 0 0 1 1h9M4 5l7 6.5V19" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M14 15h6m-3-3v6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium text-neutral-200">{title}</p>
        <p className="max-w-sm text-sm text-neutral-500">{description}</p>
      </div>
    </div>
  );
}
