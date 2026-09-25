"use client";

interface Props {
  active: boolean;
  onClick: () => void;
}

/** Small icon toggle pinned to the top-right of a response box -- reveals the raw JSON view. */
export function JsonToggleButton({ active, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      title={active ? "Hide raw JSON" : "Show raw JSON"}
      className={`absolute right-2 top-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border transition-colors duration-150 ${
        active
          ? "border-cyan-300/40 bg-cyan-300/10 text-cyan-200"
          : "border-white/10 text-neutral-500 hover:border-white/20 hover:text-neutral-200"
      }`}
    >
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" className="h-3.5 w-3.5">
        <path d="M6 2.5c-1.5 0-2 .7-2 2v2c0 .8-.3 1.2-1.5 1.5 1.2.3 1.5.7 1.5 1.5v2c0 1.3.5 2 2 2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M10 2.5c1.5 0 2 .7 2 2v2c0 .8.3 1.2 1.5 1.5-1.2.3-1.5.7-1.5 1.5v2c0 1.3-.5 2-2 2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}
