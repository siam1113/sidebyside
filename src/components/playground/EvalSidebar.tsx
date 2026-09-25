"use client";

import type { ReactNode } from "react";
import type { GatewayConfig } from "@/lib/gateways/types";
import { CollapsibleSection } from "./CollapsibleSection";
import { GatewayMultiSelect } from "./GatewayMultiSelect";
import { VariantsPanel } from "./VariantsPanel";
import type { VariantAxisKind } from "./types";
import type { EvalQuestion } from "@/lib/gateways/types";
import { ModelMultiSelect } from "@/components/ModelMultiSelect";
import type { ModelInfo } from "@/lib/gateways/adapters/models";

const inputClass =
  "rounded-md border border-white/10 bg-black/30 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-600 transition-colors duration-150 focus:border-cyan-300/40 focus:outline-none focus:ring-2 focus:ring-cyan-300/15";

function MessageIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-3 w-3">
      <path d="M2.5 4.5a1.5 1.5 0 0 1 1.5-1.5h8a1.5 1.5 0 0 1 1.5 1.5v5a1.5 1.5 0 0 1-1.5 1.5H6.5L4 13.5V11H4a1.5 1.5 0 0 1-1.5-1.5v-5Z" strokeLinejoin="round" />
    </svg>
  );
}

function ServerIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-3 w-3">
      <rect x="2.5" y="2.5" width="11" height="4.5" rx="1" />
      <rect x="2.5" y="9" width="11" height="4.5" rx="1" />
      <path d="M4.5 4.75h.01M4.5 11.25h.01" strokeLinecap="round" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-3 w-3">
      <path d="M5.5 4h7M5.5 8h7M5.5 12h7" strokeLinecap="round" />
      <path d="M2.5 4l.6.6L4.3 3.4M2.5 8l.6.6L4.3 7.4M2.5 12l.6.6L4.3 11.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CpuIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-3 w-3">
      <rect x="4.5" y="4.5" width="7" height="7" rx="1" />
      <path d="M6 1.5v2M10 1.5v2M6 12.5v2M10 12.5v2M1.5 6v2M1.5 10v2M12.5 6v2M12.5 10v2" strokeLinecap="round" />
    </svg>
  );
}

function RepeatIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-3 w-3">
      <path d="M11.5 5H4.8A2.3 2.3 0 0 0 2.5 7.3v.2M4.5 11H11.2a2.3 2.3 0 0 0 2.3-2.3v-.2" strokeLinecap="round" />
      <path d="M9.5 3l2 2-2 2M6.5 13l-2-2 2-2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const TYPE_OPTIONS: Array<{ value: EvalQuestion["type"]; label: string }> = [
  { value: "score", label: "Score" },
  { value: "choice", label: "Choice" },
  { value: "noul", label: "Yes/No" },
];

export interface QuestionDraft {
  id: string;
  key: string;
  type: EvalQuestion["type"];
  instructions: string;
  trueCriteria: string;
  falseCriteria: string;
  /** "key: description" per line. */
  optionsText: string;
  /** One criterion per line, low to high. */
  criteriaText: string;
}

function FieldLabel({ children }: { children: ReactNode }) {
  return <label className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-neutral-600">{children}</label>;
}

/** Compact pill toggle for the question type -- replaces the native select so it
 *  matches the icon-driven controls used everywhere else in the drawer. */
function TypeSegment({ value, onChange }: { value: EvalQuestion["type"]; onChange: (t: EvalQuestion["type"]) => void }) {
  return (
    <div className="flex shrink-0 gap-0.5 rounded-md border border-white/10 bg-black/30 p-0.5">
      {TYPE_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          aria-pressed={value === opt.value}
          className={`rounded px-2 py-1 text-[11px] font-medium transition-colors duration-150 ${
            value === opt.value ? "bg-cyan-300/15 text-cyan-100" : "text-neutral-500 hover:text-neutral-300"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function QuestionEditor({
  draft,
  index,
  onChange,
  onRemove,
  removable,
}: {
  draft: QuestionDraft;
  index: number;
  onChange: (patch: Partial<QuestionDraft>) => void;
  onRemove: () => void;
  removable: boolean;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-white/10 bg-black/20 p-3 transition-colors duration-150 hover:border-white/15">
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[10px] uppercase tracking-wide text-neutral-600">Question {index + 1}</span>
        {removable && (
          <button
            type="button"
            onClick={onRemove}
            aria-label="Remove question"
            className="shrink-0 rounded-md border border-white/10 p-1 text-neutral-500 transition-colors duration-150 hover:border-red-500/30 hover:text-red-300"
          >
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-3.5 w-3.5">
              <path d="M4 4l8 8M12 4l-8 8" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </div>

      <div className="flex flex-col gap-2.5">
        <div>
          <FieldLabel>Key</FieldLabel>
          <input
            className={`${inputClass} w-full font-mono text-xs`}
            placeholder="is_helpful"
            value={draft.key}
            onChange={(e) => onChange({ key: e.target.value })}
          />
        </div>
        <div>
          <FieldLabel>Type</FieldLabel>
          <TypeSegment value={draft.type} onChange={(type) => onChange({ type })} />
        </div>
      </div>

      <div>
        <FieldLabel>Instructions</FieldLabel>
        <textarea
          className={`${inputClass} w-full text-xs`}
          rows={2}
          placeholder="Instructions for the judge model..."
          value={draft.instructions}
          onChange={(e) => onChange({ instructions: e.target.value })}
        />
      </div>

      {draft.type === "noul" && (
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <FieldLabel>If true</FieldLabel>
            <input
              className={`${inputClass} w-full text-xs`}
              placeholder="Meets the bar"
              value={draft.trueCriteria}
              onChange={(e) => onChange({ trueCriteria: e.target.value })}
            />
          </div>
          <div>
            <FieldLabel>If false</FieldLabel>
            <input
              className={`${inputClass} w-full text-xs`}
              placeholder="Doesn't meet it"
              value={draft.falseCriteria}
              onChange={(e) => onChange({ falseCriteria: e.target.value })}
            />
          </div>
        </div>
      )}
      {draft.type === "choice" && (
        <div>
          <FieldLabel>Options</FieldLabel>
          <textarea
            className={`${inputClass} w-full font-mono text-xs`}
            rows={3}
            placeholder={"one option per line, e.g.\nyes: clearly meets the bar\nno: does not meet it"}
            value={draft.optionsText}
            onChange={(e) => onChange({ optionsText: e.target.value })}
          />
        </div>
      )}
      {draft.type === "score" && (
        <div>
          <FieldLabel>Criteria, low to high</FieldLabel>
          <textarea
            className={`${inputClass} w-full font-mono text-xs`}
            rows={3}
            placeholder={"one criterion per line, e.g.\npoor\nfair\ngood\nexcellent"}
            value={draft.criteriaText}
            onChange={(e) => onChange({ criteriaText: e.target.value })}
          />
        </div>
      )}
    </div>
  );
}

interface Props {
  stateText: string;
  onStateTextChange: (v: string) => void;
  running: boolean;
  runLabel: string;
  canRun: boolean;
  onRun: () => void;

  gateways: GatewayConfig[];
  selected: Set<string>;
  onToggleGateway: (id: string) => void;
  onSelectAll: () => void;
  onSelectNone: () => void;

  drafts: QuestionDraft[];
  onUpdateDraft: (id: string, patch: Partial<QuestionDraft>) => void;
  onAddDraft: () => void;
  onRemoveDraft: (id: string) => void;
  buildError: string | null;

  selectedModelIds: string[];
  onModelIdsChange: (ids: string[]) => void;
  modelOptions: ModelInfo[];
  fetchingModels: boolean;
  modelsError: string | null;
  onRefreshModels: () => void;

  enabledAxes: Set<VariantAxisKind>;
  onToggleAxis: (axis: VariantAxisKind) => void;
  repeatCount: number;
  onRepeatCountChange: (n: number) => void;
  stateVariants: string[];
  onStateVariantsChange: (states: string[]) => void;
  variantCount: number;
  rawVariantCount: number;
}

/** Evaluation tab's configuration drawer content -- mirrors Chat's Sidebar section-for-section. */
export function EvalSidebar({
  stateText,
  onStateTextChange,
  running,
  runLabel,
  canRun,
  onRun,
  gateways,
  selected,
  onToggleGateway,
  onSelectAll,
  onSelectNone,
  drafts,
  onUpdateDraft,
  onAddDraft,
  onRemoveDraft,
  buildError,
  selectedModelIds,
  onModelIdsChange,
  modelOptions,
  fetchingModels,
  modelsError,
  onRefreshModels,
  enabledAxes,
  onToggleAxis,
  repeatCount,
  onRepeatCountChange,
  stateVariants,
  onStateVariantsChange,
  variantCount,
  rawVariantCount,
}: Props) {
  const usingStateVariants = enabledAxes.has("prompts");

  return (
    <div className="glass-panel animate-fade-up rounded-xl p-5" style={{ animationDelay: "60ms" }}>
      <div className="flex flex-col divide-y divide-white/5">
        <CollapsibleSection
          title="State"
          icon={<MessageIcon />}
          className="animate-fade-up"
          style={{ animationDelay: "0ms" }}
          accessory={
            usingStateVariants ? (
              <span className="rounded-full border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] font-medium text-neutral-400">
                fallback only
              </span>
            ) : undefined
          }
        >
          <div className="flex flex-col gap-3">
            {usingStateVariants && (
              <p className="text-xs text-neutral-500">
                State variants below take over once any are filled in -- this box is only sent when that list is
                empty.
              </p>
            )}
            <textarea
              className={`${inputClass} w-full resize-y`}
              rows={8}
              placeholder="Paste the text or state you want judged -- a transcript, a diff, a draft reply..."
              value={stateText}
              onChange={(e) => onStateTextChange(e.target.value)}
            />
            <div className="flex items-center justify-between pt-1">
              <p className="text-xs text-neutral-500">{runLabel}</p>
              <button
                onClick={onRun}
                disabled={!canRun}
                className="btn-cta shrink-0 rounded-lg px-5 py-2 text-sm font-semibold"
              >
                {running ? "Running..." : "Run"}
              </button>
            </div>
          </div>
        </CollapsibleSection>

        <CollapsibleSection title="Gateways" icon={<ServerIcon />} className="animate-fade-up" style={{ animationDelay: "45ms" }}>
          <GatewayMultiSelect
            gateways={gateways}
            selected={selected}
            onToggle={onToggleGateway}
            onSelectAll={onSelectAll}
            onSelectNone={onSelectNone}
          />
        </CollapsibleSection>

        <CollapsibleSection
          title="Models"
          icon={<CpuIcon />}
          subtitle="(optional)"
          className="animate-fade-up"
          style={{ animationDelay: "90ms" }}
        >
          <ModelMultiSelect
            values={selectedModelIds}
            onChange={onModelIdsChange}
            options={modelOptions}
            loading={fetchingModels}
            error={modelsError}
            disabled={selected.size === 0}
            placeholder="each gateway's default"
            onRefresh={onRefreshModels}
          />
          {!fetchingModels && !modelsError && modelOptions.length > 0 && (
            <p className="mt-1.5 text-xs text-neutral-500">
              {selectedModelIds.length > 1
                ? "each selected gateway will be run once per model"
                : "merged across selected gateways"}
            </p>
          )}
        </CollapsibleSection>

        <CollapsibleSection
          title="Questions"
          icon={<ListIcon />}
          subtitle={`(${drafts.length})`}
          className="animate-fade-up"
          style={{ animationDelay: "135ms" }}
          accessory={
            <button
              type="button"
              onClick={onAddDraft}
              className="flex items-center gap-1 rounded-md border border-white/10 px-2 py-1 text-xs font-medium text-cyan-300 transition-colors duration-150 hover:border-cyan-300/30 hover:bg-cyan-300/5 hover:text-cyan-100"
            >
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-3 w-3 shrink-0">
                <path d="M8 3v10M3 8h10" strokeLinecap="round" />
              </svg>
              Add
            </button>
          }
        >
          <div className="flex flex-col gap-2.5">
            {drafts.map((d, i) => (
              <QuestionEditor
                key={d.id}
                draft={d}
                index={i}
                onChange={(patch) => onUpdateDraft(d.id, patch)}
                onRemove={() => onRemoveDraft(d.id)}
                removable={drafts.length > 1}
              />
            ))}
          </div>
          {buildError && <p className="mt-2 text-xs text-red-400">{buildError}</p>}
        </CollapsibleSection>

        <CollapsibleSection
          title="Variants"
          icon={<RepeatIcon />}
          subtitle="(optional)"
          defaultOpen={false}
          className="animate-fade-up"
          style={{ animationDelay: "180ms" }}
          accessory={
            enabledAxes.size > 0 ? (
              <span className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-1.5 py-0.5 text-[10px] font-medium text-cyan-200">
                {variantCount}×
              </span>
            ) : undefined
          }
        >
          <VariantsPanel
            enabledAxes={enabledAxes}
            onToggleAxis={onToggleAxis}
            axes={["repeat", "prompts"]}
            repeatCount={repeatCount}
            onRepeatCountChange={onRepeatCountChange}
            promptVariants={stateVariants}
            onPromptVariantsChange={onStateVariantsChange}
            promptAxisLabel="State"
            promptItemLabel="State"
            selectedProtocols={[]}
            variantCount={variantCount}
            rawVariantCount={rawVariantCount}
            runUnitLabel="gateway"
          />
        </CollapsibleSection>
      </div>
    </div>
  );
}
