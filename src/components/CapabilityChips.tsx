import { capabilityMeta } from "@/lib/capabilities";

interface Props {
  capabilities?: string[];
  className?: string;
}

/** Small pills for a model's modality/tool-support tags (e.g. text, img, tool). Renders nothing when empty. */
export function CapabilityChips({ capabilities, className }: Props) {
  if (!capabilities || capabilities.length === 0) return null;
  return (
    <div className={`flex flex-wrap items-center gap-1 ${className ?? ""}`}>
      {capabilities.map((tag) => {
        const meta = capabilityMeta(tag);
        return (
          <span
            key={tag}
            className={`shrink-0 rounded border px-1 py-0 text-[9px] font-medium uppercase tracking-wide ${meta.className}`}
          >
            {meta.label}
          </span>
        );
      })}
    </div>
  );
}
