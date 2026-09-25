export function ProgressBar({ done, total, className = "" }: { done: number; total: number; className?: string }) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div className="h-1.5 w-full min-w-16 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-violet-400 transition-[width] duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="shrink-0 text-xs tabular-nums text-neutral-500">
        {done}/{total}
      </span>
    </div>
  );
}
