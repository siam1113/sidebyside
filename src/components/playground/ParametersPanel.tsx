"use client";

import type { GatewayProtocol, RunParams } from "@/lib/gateways/types";
import { PROTOCOL_PARAM_SUPPORT } from "@/lib/gateways/types";

interface Props {
  value: RunParams;
  onChange: (next: RunParams) => void;
  selectedProtocols: GatewayProtocol[];
}

function supportedByAny(protocols: GatewayProtocol[], key: keyof RunParams): boolean {
  if (protocols.length === 0) return true;
  return protocols.some((p) => PROTOCOL_PARAM_SUPPORT[p].includes(key));
}

function RangeField({
  label,
  value,
  onChange,
  min,
  max,
  step,
  defaultPosition,
  disabled,
}: {
  label: string;
  value: number | undefined;
  onChange: (v: number | undefined) => void;
  min: number;
  max: number;
  step: number;
  defaultPosition: number;
  disabled?: boolean;
}) {
  const active = value != null;
  return (
    <div className={disabled ? "opacity-40" : ""}>
      <div className="mb-1 flex items-center justify-between">
        <label className="text-xs font-medium text-neutral-300">{label}</label>
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-[11px] text-neutral-500">{active ? value.toFixed(2) : "default"}</span>
          {active && (
            <button
              type="button"
              onClick={() => onChange(undefined)}
              disabled={disabled}
              className="text-[10px] text-neutral-600 transition-colors hover:text-neutral-300"
            >
              reset
            </button>
          )}
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value ?? defaultPosition}
        onChange={(e) => onChange(Number(e.target.value))}
        disabled={disabled}
        className="w-full accent-cyan-300 disabled:cursor-not-allowed"
      />
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  min,
  placeholder,
  disabled,
}: {
  label: string;
  value: number | undefined;
  onChange: (v: number | undefined) => void;
  min?: number;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <div className={disabled ? "opacity-40" : ""}>
      <label className="mb-1 block text-xs font-medium text-neutral-300">{label}</label>
      <input
        type="number"
        min={min}
        placeholder={placeholder}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value === "" ? undefined : Number(e.target.value))}
        disabled={disabled}
        className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-600 transition-colors duration-150 focus:border-cyan-300/40 focus:outline-none focus:ring-2 focus:ring-cyan-300/15 disabled:cursor-not-allowed"
      />
    </div>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <div className={disabled ? "opacity-40" : ""}>
      <label className="mb-1 block text-xs font-medium text-neutral-300">{label}</label>
      <textarea
        rows={2}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full resize-y rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-600 transition-colors duration-150 focus:border-cyan-300/40 focus:outline-none focus:ring-2 focus:ring-cyan-300/15 disabled:cursor-not-allowed"
      />
    </div>
  );
}

function TextField({
  label,
  hint,
  value,
  onChange,
  placeholder,
  disabled,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <div className={disabled ? "opacity-40" : ""}>
      <label className="mb-1 block text-xs font-medium text-neutral-300">
        {label} {hint && <span className="font-normal text-neutral-500">({hint})</span>}
      </label>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-600 transition-colors duration-150 focus:border-cyan-300/40 focus:outline-none focus:ring-2 focus:ring-cyan-300/15 disabled:cursor-not-allowed"
      />
    </div>
  );
}

export function ParametersPanel({ value, onChange, selectedProtocols }: Props) {
  function set<K extends keyof RunParams>(key: K, v: RunParams[K]) {
    onChange({ ...value, [key]: v });
  }

  const customOnly = selectedProtocols.length > 0 && selectedProtocols.every((p) => p === "custom");

  return (
    <div className="flex flex-col gap-4">
      {customOnly && (
        <p className="text-xs text-neutral-500">
          Custom gateways use their own body template — these only apply if it references{" "}
          <code className="font-mono text-neutral-400">{"{{temperature}}"}</code>,{" "}
          <code className="font-mono text-neutral-400">{"{{maxTokens}}"}</code>, etc.
        </p>
      )}

      <RangeField
        label="Temperature"
        value={value.temperature}
        onChange={(v) => set("temperature", v)}
        min={0}
        max={2}
        step={0.01}
        defaultPosition={1}
        disabled={!supportedByAny(selectedProtocols, "temperature")}
      />
      <RangeField
        label="Top P"
        value={value.topP}
        onChange={(v) => set("topP", v)}
        min={0}
        max={1}
        step={0.01}
        defaultPosition={1}
        disabled={!supportedByAny(selectedProtocols, "topP")}
      />
      <NumberField
        label="Max tokens"
        value={value.maxTokens}
        onChange={(v) => set("maxTokens", v)}
        min={1}
        placeholder="model default"
        disabled={!supportedByAny(selectedProtocols, "maxTokens")}
      />
      <TextAreaField
        label="System prompt"
        value={value.systemPrompt ?? ""}
        onChange={(v) => set("systemPrompt", v || undefined)}
        placeholder="Optional system/instructions message"
        disabled={!supportedByAny(selectedProtocols, "systemPrompt")}
      />
      <TextField
        label="Stop sequences"
        hint="comma-separated"
        value={(value.stopSequences ?? []).join(", ")}
        onChange={(v) =>
          set(
            "stopSequences",
            v.trim()
              ? v
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean)
              : undefined,
          )
        }
        placeholder="e.g. \n, END"
        disabled={!supportedByAny(selectedProtocols, "stopSequences")}
      />
    </div>
  );
}
