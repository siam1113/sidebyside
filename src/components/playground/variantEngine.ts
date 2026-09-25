import { DEFAULT_VARIANT, type RunVariant } from "./types";

export const MAX_TEXT_VARIANTS = 8;

export function truncateLabel(s: string): string {
  return s.length > 28 ? `${s.slice(0, 28)}…` : s;
}

/** A list of alternate texts (prompts, embedding inputs, eval states, ...) as a variant axis --
 *  each non-empty entry replaces the base text entirely for that cell. Empty/blank entries are
 *  dropped; an axis with nothing usable yet falls back to DEFAULT_VARIANT so it doesn't zero out
 *  other axes it's combined with. */
export function textAxisVariants(idPrefix: string, values: string[]): RunVariant[] {
  const items = values.map((v) => v.trim()).filter(Boolean).slice(0, MAX_TEXT_VARIANTS);
  if (items.length === 0) return [DEFAULT_VARIANT];
  return items.map((v, i) => ({ id: `${idPrefix}-${i}`, label: truncateLabel(v), promptOverride: v }));
}

/** Cross product of every axis's variant list, merging overrides and joining labels with " · ".
 *  Capped to `max` -- the caller can compare against the raw (uncapped) size to warn. */
export function combineVariants(axisLists: RunVariant[][], max: number): { variants: RunVariant[]; rawCount: number } {
  const combined = axisLists.reduce<RunVariant[]>(
    (acc, list) =>
      acc.flatMap((a) =>
        list.map((b) => ({
          id: `${a.id}+${b.id}`,
          label: [a.label, b.label].filter(Boolean).join(" · "),
          promptOverride: b.promptOverride ?? a.promptOverride,
          paramsOverride: { ...a.paramsOverride, ...b.paramsOverride },
        })),
      ),
    [DEFAULT_VARIANT],
  );
  return { variants: combined.slice(0, max), rawCount: combined.length };
}
