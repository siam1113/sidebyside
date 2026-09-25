export interface SummaryItem {
  label: string;
  value: string;
  tone?: "success" | "error";
}

/** The at-a-glance status/latency/model row shown above every result body, regardless of modality. */
export function SummaryStrip({ items }: { items: SummaryItem[] }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-2 rounded-lg border border-white/5 bg-white/[0.02] p-3 sm:grid-cols-3">
      {items.map((item) => (
        <div key={item.label} className="min-w-0">
          <p className="text-[10px] uppercase tracking-wide text-neutral-600">{item.label}</p>
          <p
            className={`truncate font-mono text-xs ${
              item.tone === "success"
                ? "text-emerald-300"
                : item.tone === "error"
                  ? "text-red-300"
                  : "text-neutral-300"
            }`}
          >
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
}
