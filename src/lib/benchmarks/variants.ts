import { DEFAULT_PROMPT_VARIANT, type PromptVariant } from "@/components/benchmarks/types";

function truncateLabel(s: string): string {
  return s.length > 40 ? `${s.slice(0, 40)}…` : s;
}

/** Turns a textarea's worth of system prompts (one per line) into named variants.
 *  Blank input means "no variants" -- a single default (no-op) entry, so the run
 *  isn't multiplied when the user hasn't opted into this axis. */
export function parseSystemPromptVariants(text: string): PromptVariant[] {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length === 0) return [DEFAULT_PROMPT_VARIANT];
  return lines.map((line, i) => ({ id: `sys-${i}`, label: truncateLabel(line), systemPrompt: line }));
}
