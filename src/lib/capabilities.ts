interface CapabilityMeta {
  label: string;
  className: string;
}

const NEUTRAL = "border-white/10 bg-white/[0.03] text-neutral-400";

const CAPABILITY_META: Record<string, CapabilityMeta> = {
  text: { label: "text", className: NEUTRAL },
  language: { label: "text", className: NEUTRAL },
  image: { label: "img", className: "border-sky-400/20 bg-sky-400/10 text-sky-300" },
  video: { label: "video", className: "border-fuchsia-400/20 bg-fuchsia-400/10 text-fuchsia-300" },
  audio: { label: "audio", className: "border-pink-400/20 bg-pink-400/10 text-pink-300" },
  file: { label: "file", className: NEUTRAL },
  tool: { label: "tool", className: "border-violet-400/20 bg-violet-400/10 text-violet-300" },
  embedding: { label: "embed", className: "border-teal-400/20 bg-teal-400/10 text-teal-300" },
  evaluation: { label: "eval", className: "border-amber-400/20 bg-amber-400/10 text-amber-300" },
  speech: { label: "speech", className: "border-pink-400/20 bg-pink-400/10 text-pink-300" },
  transcription: { label: "transcribe", className: "border-pink-400/20 bg-pink-400/10 text-pink-300" },
  realtime: { label: "realtime", className: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300" },
  reranking: { label: "rerank", className: "border-teal-400/20 bg-teal-400/10 text-teal-300" },
};

/** Display label + pill styling for a capability tag; unknown tags render as-is in a neutral pill. */
export function capabilityMeta(tag: string): CapabilityMeta {
  return CAPABILITY_META[tag] ?? { label: tag, className: NEUTRAL };
}

/** True if any of a model's capability tags matches the given search query (already lowercased). */
export function capabilitiesMatch(capabilities: string[] | undefined, query: string): boolean {
  if (!capabilities) return false;
  return capabilities.some(
    (c) => c.toLowerCase().includes(query) || capabilityMeta(c).label.toLowerCase().includes(query),
  );
}
