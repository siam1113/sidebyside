"use client";

import type { Attachment, GatewayConfig, GatewayProtocol, RunParams } from "@/lib/gateways/types";
import type { ModelInfo } from "@/lib/gateways/adapters/models";
import { ModelMultiSelect } from "@/components/ModelMultiSelect";
import { CollapsibleSection } from "./CollapsibleSection";
import { GatewayMultiSelect } from "./GatewayMultiSelect";
import { ParametersPanel } from "./ParametersPanel";
import { VariantsPanel, type SweepableParam } from "./VariantsPanel";
import { PromptComposer } from "./PromptComposer";
import type { VariantAxisKind } from "./types";

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

function CpuIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-3 w-3">
      <rect x="4.5" y="4.5" width="7" height="7" rx="1" />
      <path d="M6 1.5v2M10 1.5v2M6 12.5v2M10 12.5v2M1.5 6v2M1.5 10v2M12.5 6v2M12.5 10v2" strokeLinecap="round" />
    </svg>
  );
}

function SlidersIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-3 w-3">
      <path d="M2 5h6m4 0h2M2 11h2m4 0h6" strokeLinecap="round" />
      <circle cx="9.5" cy="5" r="1.6" />
      <circle cx="6.5" cy="11" r="1.6" />
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

interface Props {
  prompt: string;
  onPromptChange: (v: string) => void;
  attachments: Attachment[];
  onAttachmentsChange: (attachments: Attachment[]) => void;
  running: boolean;
  runLabel: string;
  canRun: boolean;
  onRun: () => void;

  gateways: GatewayConfig[];
  selected: Set<string>;
  onToggleGateway: (id: string) => void;
  onSelectAll: () => void;
  onSelectNone: () => void;

  modelOptions: ModelInfo[];
  selectedModelIds: string[];
  onModelIdsChange: (ids: string[]) => void;
  fetchingModels: boolean;
  modelsError: string | null;
  onRefreshModels: () => void;

  params: RunParams;
  onParamsChange: (params: RunParams) => void;
  selectedProtocols: GatewayProtocol[];

  enabledAxes: Set<VariantAxisKind>;
  onToggleAxis: (axis: VariantAxisKind) => void;
  repeatCount: number;
  onRepeatCountChange: (n: number) => void;
  promptVariants: string[];
  onPromptVariantsChange: (prompts: string[]) => void;
  systemPromptVariants: string[];
  onSystemPromptVariantsChange: (prompts: string[]) => void;
  sweepParam: SweepableParam;
  onSweepParamChange: (p: SweepableParam) => void;
  sweepValuesText: string;
  onSweepValuesTextChange: (v: string) => void;
  variantCount: number;
  rawVariantCount: number;
}

export function Sidebar({
  prompt,
  onPromptChange,
  attachments,
  onAttachmentsChange,
  running,
  runLabel,
  canRun,
  onRun,
  gateways,
  selected,
  onToggleGateway,
  onSelectAll,
  onSelectNone,
  modelOptions,
  selectedModelIds,
  onModelIdsChange,
  fetchingModels,
  modelsError,
  onRefreshModels,
  params,
  onParamsChange,
  selectedProtocols,
  enabledAxes,
  onToggleAxis,
  repeatCount,
  onRepeatCountChange,
  promptVariants,
  onPromptVariantsChange,
  systemPromptVariants,
  onSystemPromptVariantsChange,
  sweepParam,
  onSweepParamChange,
  sweepValuesText,
  onSweepValuesTextChange,
  variantCount,
  rawVariantCount,
}: Props) {
  const activeParamCount = Object.values(params).filter((v) => v !== undefined && v !== "").length;
  const usingPromptVariants = enabledAxes.has("prompts");

  return (
    <div className="glass-panel animate-fade-up rounded-xl p-5" style={{ animationDelay: "60ms" }}>
      <div className="flex flex-col divide-y divide-white/5">
        <CollapsibleSection
          title="Prompt"
          icon={<MessageIcon />}
          className="animate-fade-up"
          style={{ animationDelay: "0ms" }}
          accessory={
            usingPromptVariants ? (
              <span className="rounded-full border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] font-medium text-neutral-400">
                fallback only
              </span>
            ) : undefined
          }
        >
          <div className="flex flex-col gap-3">
            {usingPromptVariants && (
              <p className="text-xs text-neutral-500">
                Prompt variants below take over once any are filled in — this box is only sent when that list is
                empty.
              </p>
            )}
            <PromptComposer
              prompt={prompt}
              onPromptChange={onPromptChange}
              attachments={attachments}
              onAttachmentsChange={onAttachmentsChange}
              placeholder="Enter a prompt to send to the selected gateways..."
              rows={9}
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
          title="Parameters"
          icon={<SlidersIcon />}
          subtitle="(optional)"
          defaultOpen={false}
          className="animate-fade-up"
          style={{ animationDelay: "135ms" }}
          accessory={
            activeParamCount > 0 ? (
              <span className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-1.5 py-0.5 text-[10px] font-medium text-cyan-200">
                {activeParamCount} set
              </span>
            ) : undefined
          }
        >
          <ParametersPanel value={params} onChange={onParamsChange} selectedProtocols={selectedProtocols} />
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
            repeatCount={repeatCount}
            onRepeatCountChange={onRepeatCountChange}
            promptVariants={promptVariants}
            onPromptVariantsChange={onPromptVariantsChange}
            systemPrompts={systemPromptVariants}
            onSystemPromptsChange={onSystemPromptVariantsChange}
            sweepParam={sweepParam}
            onSweepParamChange={onSweepParamChange}
            sweepValuesText={sweepValuesText}
            onSweepValuesTextChange={onSweepValuesTextChange}
            selectedProtocols={selectedProtocols}
            variantCount={variantCount}
            rawVariantCount={rawVariantCount}
          />
        </CollapsibleSection>
      </div>
    </div>
  );
}
