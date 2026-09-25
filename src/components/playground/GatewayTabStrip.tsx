"use client";

export type TabStatus = "idle" | "loading" | "done" | "error";

export interface TabItem {
  key: string;
  title: string;
  subtitle?: string;
  status: TabStatus;
  /** true for a "done" state whose result carries an error field. */
  failed?: boolean;
}

function StatusDot({ status, failed }: { status: TabStatus; failed?: boolean }) {
  if (status === "loading") {
    return <span className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-cyan-300" />;
  }
  if (status === "done") {
    return <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${failed ? "bg-red-400" : "bg-emerald-400"}`} />;
  }
  if (status === "error") {
    return <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-400" />;
  }
  return <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-neutral-600" />;
}

interface Props {
  items: TabItem[];
  activeKey: string | null;
  onSelect: (key: string) => void;
}

/** The pill tab strip used to switch between per-gateway results -- shared across every playground tab. */
export function GatewayTabStrip({ items, activeKey, onSelect }: Props) {
  return (
    <div className="flex flex-nowrap gap-1.5 overflow-x-auto pb-1">
      {items.map((item) => {
        const isActive = item.key === activeKey;
        return (
          <button
            key={item.key}
            type="button"
            onClick={() => onSelect(item.key)}
            className={`flex shrink-0 items-center gap-2 rounded-lg border px-3 py-1.5 text-left text-sm transition-colors duration-150 ${
              isActive
                ? "border-cyan-300/30 bg-cyan-300/10 text-cyan-100"
                : "border-white/10 text-neutral-400 hover:border-white/20 hover:bg-white/[0.03] hover:text-neutral-200"
            }`}
          >
            <StatusDot status={item.status} failed={item.failed} />
            <span className="flex min-w-0 flex-col leading-tight">
              <span className="truncate">{item.title}</span>
              {item.subtitle && (
                <span className="truncate font-mono text-[10px] text-neutral-500">{item.subtitle}</span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
