"use client";

import { useBenchmarks } from "./BenchmarksContext";
import { Modal } from "../Modal";
import { CollapsibleSection } from "../playground/CollapsibleSection";
import { GatewayMultiSelect } from "../playground/GatewayMultiSelect";
import { ParametersPanel } from "../playground/ParametersPanel";
import { ModelMultiSelect } from "@/components/ModelMultiSelect";

const inputClass =
  "rounded-md border border-white/10 bg-black/30 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-600 transition-colors duration-150 focus:border-cyan-300/40 focus:outline-none focus:ring-2 focus:ring-cyan-300/15";

function SlidersIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-3 w-3">
      <path d="M2 5h6m4 0h2M2 11h2m4 0h6" strokeLinecap="round" />
      <circle cx="9.5" cy="5" r="1.6" />
      <circle cx="6.5" cy="11" r="1.6" />
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

function ChatIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-3 w-3">
      <path d="M2.5 4.5a1.5 1.5 0 0 1 1.5-1.5h8a1.5 1.5 0 0 1 1.5 1.5v5a1.5 1.5 0 0 1-1.5 1.5H6.5L4 13.5V11H4a1.5 1.5 0 0 1-1.5-1.5v-5Z" strokeLinejoin="round" />
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

function PlayIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className="h-3 w-3">
      <path d="M4.5 3.2v9.6a.6.6 0 0 0 .93.5l7.4-4.8a.6.6 0 0 0 0-1l-7.4-4.8a.6.6 0 0 0-.93.5Z" />
    </svg>
  );
}

function Stepper({ value, onChange, min, max }: { value: number; onChange: (v: number) => void; min: number; max: number }) {
  return (
    <div className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-black/30 p-1">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        aria-label="Decrease"
        className="flex h-7 w-7 items-center justify-center rounded-md text-neutral-300 transition-colors duration-150 hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-30"
      >
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3 w-3">
          <path d="M3 8h10" strokeLinecap="round" />
        </svg>
      </button>
      <span className="w-6 text-center font-mono text-sm text-neutral-100">{value}</span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        aria-label="Increase"
        className="flex h-7 w-7 items-center justify-center rounded-md text-neutral-300 transition-colors duration-150 hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-30"
      >
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3 w-3">
          <path d="M8 3v10M3 8h10" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}

interface Props {
  open: boolean;
  onClose: () => void;
}

/** One modal for everything a run needs: which test cases, which gateways/models, run-level
 *  parameter overrides, system-prompt variants, and how many times to repeat each combo. */
export function RunConfigModal({ open, onClose }: Props) {
  const {
    testCases,
    selectedTestCaseIds,
    toggleTestCase,
    selectAllTestCases,
    selectNoneTestCases,
    targetGateways,
    selected,
    toggleGateway,
    selectAllGateways,
    selectNoneGateways,
    selectedProtocols,
    runModelIds,
    setRunModelIds,
    modelOptions,
    fetchingModels,
    modelsError,
    ensureModelsLoaded,
    refreshModels,
    runParams,
    setRunParams,
    systemPromptVariantsText,
    setSystemPromptVariantsText,
    repeatCount,
    setRepeatCount,
    running,
    runLabel,
    canRun,
    runAll,
  } = useBenchmarks();

  function handleRun() {
    runAll();
    onClose();
  }

  const activeParamCount = Object.values(runParams).filter((v) => v !== undefined && v !== "").length;
  const variantCount = systemPromptVariantsText
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean).length;

  let sectionIndex = 0;
  const nextDelay = () => `${sectionIndex++ * 45}ms`;

  return (
    <Modal open={open} onClose={onClose} title="Run configuration" icon={<SlidersIcon />} maxWidthClassName="max-w-xl">
      <div className="flex flex-col divide-y divide-white/5">
        <CollapsibleSection
          title="Test cases"
          icon={<ListIcon />}
          subtitle={`(${selectedTestCaseIds.size} of ${testCases.length})`}
          className="animate-fade-up"
          style={{ animationDelay: nextDelay() }}
          accessory={
            <div className="flex items-center gap-1 text-xs">
              <button type="button" onClick={selectAllTestCases} className="rounded-md px-1.5 py-0.5 text-neutral-400 transition-colors hover:text-cyan-200">
                All
              </button>
              <span className="text-neutral-700">·</span>
              <button type="button" onClick={selectNoneTestCases} className="rounded-md px-1.5 py-0.5 text-neutral-400 transition-colors hover:text-cyan-200">
                None
              </button>
            </div>
          }
        >
          {testCases.length === 0 ? (
            <p className="rounded-lg border border-dashed border-white/10 p-4 text-center text-sm text-neutral-500">
              No test cases yet -- add some in the Test Cases tab.
            </p>
          ) : (
            <div className="flex max-h-52 flex-col gap-1.5 overflow-y-auto">
              {testCases.map((tc) => {
                const checked = selectedTestCaseIds.has(tc.id);
                return (
                  <button
                    key={tc.id}
                    type="button"
                    aria-pressed={checked}
                    onClick={() => toggleTestCase(tc.id)}
                    className={`flex items-start gap-2.5 rounded-lg border px-3 py-2 text-left transition-all duration-150 ${
                      checked
                        ? "border-cyan-300/30 bg-cyan-300/[0.06] shadow-[0_0_0_1px_rgba(103,232,249,0.1)]"
                        : "border-white/10 hover:border-white/20 hover:bg-white/[0.04]"
                    }`}
                  >
                    <span
                      className={`mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border transition-colors duration-150 ${
                        checked ? "border-cyan-300 bg-cyan-300/20" : "border-neutral-600"
                      }`}
                    >
                      {checked && (
                        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" className="h-2.5 w-2.5 text-cyan-200">
                          <path d="M3 8.5l3 3 7-7" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={`block truncate text-sm ${checked ? "text-cyan-100" : "text-neutral-200"}`}>
                        {tc.name || "(untitled)"}
                      </span>
                      <span className="block truncate text-xs text-neutral-500">{tc.prompt || "No prompt yet"}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </CollapsibleSection>

        <CollapsibleSection
          title="Target gateways"
          icon={<ServerIcon />}
          subtitle={`(${selected.size})`}
          className="animate-fade-up"
          style={{ animationDelay: nextDelay() }}
        >
          <GatewayMultiSelect
            gateways={targetGateways}
            selected={selected}
            onToggle={toggleGateway}
            onSelectAll={selectAllGateways}
            onSelectNone={selectNoneGateways}
          />
        </CollapsibleSection>

        <CollapsibleSection
          title="Models"
          icon={<CpuIcon />}
          subtitle="(optional)"
          defaultOpen={false}
          className="animate-fade-up"
          style={{ animationDelay: nextDelay() }}
        >
          <ModelMultiSelect
            values={runModelIds}
            onChange={setRunModelIds}
            options={modelOptions}
            loading={fetchingModels}
            error={modelsError}
            disabled={selected.size === 0}
            placeholder="each gateway's default"
            onOpen={ensureModelsLoaded}
            onRefresh={refreshModels}
          />
          <p className="mt-1.5 text-xs text-neutral-500">
            {runModelIds.length > 0
              ? "overrides every test case's own model override for this run"
              : "falls back to each test case's model override, then the gateway default"}
          </p>
        </CollapsibleSection>

        <CollapsibleSection
          title="Parameters"
          icon={<SlidersIcon />}
          subtitle="(optional)"
          defaultOpen={false}
          className="animate-fade-up"
          style={{ animationDelay: nextDelay() }}
          accessory={
            activeParamCount > 0 ? (
              <span className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-1.5 py-0.5 text-[10px] font-medium text-cyan-200">
                {activeParamCount} set
              </span>
            ) : undefined
          }
        >
          <ParametersPanel value={runParams} onChange={setRunParams} selectedProtocols={selectedProtocols} />
          <p className="mt-1.5 text-xs text-neutral-500">Only fills in fields a test case doesn&apos;t already set.</p>
        </CollapsibleSection>

        <CollapsibleSection
          title="System prompt variants"
          icon={<ChatIcon />}
          subtitle="(optional)"
          defaultOpen={false}
          className="animate-fade-up"
          style={{ animationDelay: nextDelay() }}
          accessory={
            variantCount > 0 ? (
              <span className="rounded-full border border-violet-400/30 bg-violet-400/10 px-1.5 py-0.5 text-[10px] font-medium text-violet-200">
                {variantCount} set
              </span>
            ) : undefined
          }
        >
          <textarea
            className={`${inputClass} w-full text-xs`}
            rows={3}
            placeholder={"one system prompt per line, e.g.\nYou are a terse assistant.\nYou are a warm, chatty assistant."}
            value={systemPromptVariantsText}
            onChange={(e) => setSystemPromptVariantsText(e.target.value)}
          />
          <p className="mt-1.5 text-xs text-neutral-500">
            Every selected test case runs once per variant, in addition to per gateway x model. Overrides any system
            prompt set elsewhere.
          </p>
        </CollapsibleSection>

        <CollapsibleSection
          title="Repetition"
          icon={<RepeatIcon />}
          subtitle="(optional)"
          defaultOpen={false}
          className="animate-fade-up"
          style={{ animationDelay: nextDelay() }}
        >
          <Stepper value={repeatCount} onChange={setRepeatCount} min={1} max={10} />
          <p className="mt-1.5 text-xs text-neutral-500">
            Runs each test case x gateway x model x variant this many times -- useful for checking consistency.
          </p>
        </CollapsibleSection>

        <div className="relative flex items-center justify-between gap-3 pt-4">
          <div aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
          <p className="text-xs text-neutral-500">{runLabel}</p>
          <button
            type="button"
            onClick={handleRun}
            disabled={!canRun}
            className="btn-cta flex shrink-0 items-center gap-1.5 rounded-lg px-5 py-2 text-sm font-semibold"
          >
            {running ? (
              "Running..."
            ) : (
              <>
                <PlayIcon />
                Run
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}
