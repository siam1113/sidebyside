"use client";

import type { GatewayProtocol } from "@/lib/gateways/types";
import { PROTOCOL_PARAM_SUPPORT } from "@/lib/gateways/types";
import type { VariantAxisKind } from "./types";

export const MAX_REPEAT = 10;
export const MAX_PROMPT_VARIANTS = 8;
export const MAX_SYSTEM_PROMPTS = 8;
export const MAX_SWEEP_VALUES = 8;
export const MAX_TOTAL_VARIANTS = 24;

export type SweepableParam = "temperature" | "topP" | "maxTokens";

const SWEEP_PARAM_OPTIONS: Array<{ value: SweepableParam; label: string }> = [
  { value: "temperature", label: "Temperature" },
  { value: "topP", label: "Top P" },
  { value: "maxTokens", label: "Max tokens" },
];

const AXIS_OPTIONS: Array<{ value: VariantAxisKind; label: string }> = [
  { value: "repeat", label: "Repeat" },
  { value: "prompts", label: "Prompt variants" },
  { value: "systemPrompts", label: "System prompt variants" },
  { value: "paramSweep", label: "Param sweep" },
];

/** Parses a comma-separated list of numbers, dropping blanks and NaNs, capped to keep the run count sane. */
export function parseSweepValues(text: string): number[] {
  const values = text
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map(Number)
    .filter((n) => !Number.isNaN(n));
  return values.slice(0, MAX_SWEEP_VALUES);
}

function supportedByAny(protocols: GatewayProtocol[], key: "temperature" | "topP" | "maxTokens" | "systemPrompt"): boolean {
  if (protocols.length === 0) return true;
  return protocols.some((p) => PROTOCOL_PARAM_SUPPORT[p].includes(key));
}

const inputClass =
  "w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-600 transition-colors duration-150 focus:border-cyan-300/40 focus:outline-none focus:ring-2 focus:ring-cyan-300/15 disabled:cursor-not-allowed";

/** Shared add/remove list of textareas -- used for both prompt variants and system prompt variants. */
function TextListEditor({
  values,
  onChange,
  itemPlaceholder,
  addLabel,
  max,
  disabled,
}: {
  values: string[];
  onChange: (values: string[]) => void;
  itemPlaceholder: (index: number) => string;
  addLabel: string;
  max: number;
  disabled?: boolean;
}) {
  return (
    <div className={`flex flex-col gap-2 ${disabled ? "opacity-40" : ""}`}>
      {values.map((v, i) => (
        <div key={i} className="flex items-start gap-2">
          <textarea
            rows={2}
            placeholder={itemPlaceholder(i)}
            value={v}
            onChange={(e) => onChange(values.map((existing, idx) => (idx === i ? e.target.value : existing)))}
            disabled={disabled}
            className={`${inputClass} resize-y`}
          />
          {values.length > 2 && (
            <button
              type="button"
              onClick={() => onChange(values.filter((_, idx) => idx !== i))}
              disabled={disabled}
              aria-label="Remove"
              className="mt-1.5 shrink-0 rounded-md border border-white/10 p-1 text-neutral-500 transition-colors duration-150 hover:border-red-500/30 hover:text-red-300 disabled:cursor-not-allowed"
            >
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-3.5 w-3.5">
                <path d="M4 4l8 8M12 4l-8 8" strokeLinecap="round" />
              </svg>
            </button>
          )}
        </div>
      ))}
      {values.length < max && (
        <button
          type="button"
          onClick={() => onChange([...values, ""])}
          disabled={disabled}
          className="self-start text-xs font-medium text-cyan-200 transition-colors hover:text-cyan-100 disabled:cursor-not-allowed disabled:text-neutral-600"
        >
          {addLabel}
        </button>
      )}
    </div>
  );
}

interface Props {
  enabledAxes: Set<VariantAxisKind>;
  onToggleAxis: (axis: VariantAxisKind) => void;
  /** Which axis chips/configs to offer -- e.g. embeddings/images/evaluation only get
   *  Repeat + text variants, since system prompts and param sweeps are chat-only concepts. */
  axes?: VariantAxisKind[];

  repeatCount: number;
  onRepeatCountChange: (n: number) => void;

  promptVariants: string[];
  onPromptVariantsChange: (prompts: string[]) => void;
  /** Wording for the text-variants axis -- "Prompt" by default, but "Text" for embeddings'
   *  input or "State" for evaluation's judged text reads more naturally there. */
  promptAxisLabel?: string;
  promptItemLabel?: string;

  systemPrompts?: string[];
  onSystemPromptsChange?: (prompts: string[]) => void;

  sweepParam?: SweepableParam;
  onSweepParamChange?: (p: SweepableParam) => void;
  sweepValuesText?: string;
  onSweepValuesTextChange?: (v: string) => void;

  selectedProtocols: GatewayProtocol[];

  /** Actual variant count vs. the raw cross-product size, so a capped combo can say so. */
  variantCount: number;
  rawVariantCount: number;
  /** What one cell represents -- "gateway/model" for Chat (which has a model multi-select),
   *  just "gateway" for tabs that don't. */
  runUnitLabel?: string;
}

const ALL_AXES: VariantAxisKind[] = ["repeat", "prompts", "systemPrompts", "paramSweep"];

export function VariantsPanel({
  enabledAxes,
  onToggleAxis,
  axes = ALL_AXES,
  repeatCount,
  onRepeatCountChange,
  promptVariants,
  onPromptVariantsChange,
  promptAxisLabel = "Prompt",
  promptItemLabel = "Prompt",
  systemPrompts = [],
  onSystemPromptsChange = () => {},
  sweepParam = "temperature",
  onSweepParamChange = () => {},
  sweepValuesText = "",
  onSweepValuesTextChange = () => {},
  selectedProtocols,
  variantCount,
  rawVariantCount,
  runUnitLabel = "gateway/model",
}: Props) {
  const systemPromptsDisabled = !supportedByAny(selectedProtocols, "systemPrompt");
  const sweepDisabled = !supportedByAny(selectedProtocols, sweepParam);
  const repeats = enabledAxes.has("repeat") ? repeatCount : 1;
  const totalCalls = variantCount * repeats;
  const axisOptions = AXIS_OPTIONS.filter((opt) => axes.includes(opt.value)).map((opt) =>
    opt.value === "prompts" ? { ...opt, label: `${promptAxisLabel} variants` } : opt,
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-1.5">
        {axisOptions.map((opt) => {
          const active = enabledAxes.has(opt.value);
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onToggleAxis(opt.value)}
              aria-pressed={active}
              className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors duration-150 ${
                active
                  ? "border-cyan-300/30 bg-cyan-300/10 text-cyan-100"
                  : "border-white/10 text-neutral-500 hover:border-white/20 hover:text-neutral-300"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {enabledAxes.size === 0 && (
        <p className="text-xs text-neutral-500">Each selected {runUnitLabel} runs once, as configured above.</p>
      )}

      {enabledAxes.has("repeat") && (
        <div>
          <label className="mb-1 block text-xs font-medium text-neutral-300">Repeat count</label>
          <input
            type="number"
            min={2}
            max={MAX_REPEAT}
            value={repeatCount}
            onChange={(e) => onRepeatCountChange(Math.max(2, Math.min(MAX_REPEAT, Number(e.target.value) || 2)))}
            className={inputClass}
          />
          <p className="mt-1.5 text-xs text-neutral-500">
            Runs each {runUnitLabel} {repeatCount} times and shows one aggregated column (success rate, average
            latency) instead of {repeatCount} separate ones -- expand it to see each individual run (up to{" "}
            {MAX_REPEAT}).
          </p>
        </div>
      )}

      {enabledAxes.has("prompts") && (
        <div className="flex flex-col gap-2">
          <TextListEditor
            values={promptVariants}
            onChange={onPromptVariantsChange}
            itemPlaceholder={(i) => `${promptItemLabel} ${i + 1}`}
            addLabel={`+ Add ${promptItemLabel.toLowerCase()}`}
            max={MAX_PROMPT_VARIANTS}
          />
          <p className="text-xs text-neutral-500">
            Runs once per non-empty {promptItemLabel.toLowerCase()} above, instead of the one in the section above
            (up to {MAX_PROMPT_VARIANTS}).
          </p>
        </div>
      )}

      {enabledAxes.has("systemPrompts") && (
        <div className="flex flex-col gap-2">
          {systemPromptsDisabled && (
            <p className="text-xs text-neutral-500">None of the selected gateways support a system prompt.</p>
          )}
          <TextListEditor
            values={systemPrompts}
            onChange={onSystemPromptsChange}
            itemPlaceholder={(i) => `System prompt ${i + 1}`}
            addLabel="+ Add system prompt"
            max={MAX_SYSTEM_PROMPTS}
            disabled={systemPromptsDisabled}
          />
          <p className="text-xs text-neutral-500">
            Runs once per non-empty system prompt above (up to {MAX_SYSTEM_PROMPTS}).
          </p>
        </div>
      )}

      {enabledAxes.has("paramSweep") && (
        <div className={`flex flex-col gap-2 ${sweepDisabled ? "opacity-40" : ""}`}>
          <div className="flex gap-1 rounded-lg border border-white/10 bg-black/20 p-1">
            {SWEEP_PARAM_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => onSweepParamChange(opt.value)}
                disabled={sweepDisabled}
                aria-pressed={sweepParam === opt.value}
                className={`flex-1 rounded-md px-2 py-1 text-xs font-medium transition-colors duration-150 disabled:cursor-not-allowed ${
                  sweepParam === opt.value ? "bg-cyan-300/15 text-cyan-100" : "text-neutral-500 hover:text-neutral-300"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <input
            type="text"
            placeholder={sweepParam === "maxTokens" ? "e.g. 64, 256, 1024" : "e.g. 0, 0.7, 1.4"}
            value={sweepValuesText}
            onChange={(e) => onSweepValuesTextChange(e.target.value)}
            disabled={sweepDisabled}
            className={inputClass}
          />
          <p className="text-xs text-neutral-500">
            Comma-separated values -- runs once per value (up to {MAX_SWEEP_VALUES}).
          </p>
        </div>
      )}

      {(variantCount > 1 || repeats > 1) && (
        <p className="rounded-lg border border-white/10 bg-black/20 px-2.5 py-1.5 text-xs text-neutral-400">
          {totalCalls} call{totalCalls === 1 ? "" : "s"} per {runUnitLabel}
          {variantCount > 1 && repeats > 1 ? ` (${variantCount} variants × ${repeats} repeats)` : ""}
          {repeats > 1 ? ", repeats aggregated into one column" : ""}
          {rawVariantCount > variantCount ? ` -- variants capped from ${rawVariantCount}, trim an axis to see the rest` : ""}
          .
        </p>
      )}
    </div>
  );
}
