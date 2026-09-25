"use client";

import type { ReactNode } from "react";
import type { GatewayConfig, GatewayProtocol } from "@/lib/gateways/types";
import { Modal } from "../Modal";
import { CollapsibleSection } from "../playground/CollapsibleSection";
import { ParametersPanel } from "../playground/ParametersPanel";
import type { AssertionMode, GradingStrategy, TestCase } from "./types";

const inputClass =
  "rounded-md border border-white/10 bg-black/30 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-600 transition-colors duration-150 focus:border-cyan-300/40 focus:outline-none focus:ring-2 focus:ring-cyan-300/15";

const ASSERTION_MODES: Array<{ value: AssertionMode; label: string }> = [
  { value: "contains", label: "Contains" },
  { value: "not-contains", label: "Not contains" },
  { value: "equals", label: "Equals" },
  { value: "regex", label: "Regex" },
];

function FlaskIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-3.5 w-3.5">
      <path d="M6.5 2h3M6.8 2.3v3.9L3.6 12a1.2 1.2 0 0 0 1.05 1.8h6.7A1.2 1.2 0 0 0 12.4 12L9.2 6.2V2.3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5.2 10h5.6" strokeLinecap="round" />
    </svg>
  );
}

function TargetIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-3 w-3">
      <circle cx="8" cy="8" r="5.5" />
      <circle cx="8" cy="8" r="2.5" />
      <path d="M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2" strokeLinecap="round" />
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

function FieldLabel({ children }: { children: ReactNode }) {
  return <label className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-neutral-600">{children}</label>;
}

/** Non-collapsible section heading -- same icon-badge language as CollapsibleSection, for content
 *  that should always stay visible (grading is core to the test case, not optional detail). */
function SectionLabel({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <div className="flex items-center gap-1.5 text-sm font-medium text-neutral-200">
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-white/10 bg-white/[0.04] text-cyan-200">
        {icon}
      </span>
      {children}
    </div>
  );
}

function GradingKindSegment({
  value,
  judgeAvailable,
  onChange,
}: {
  value: GradingStrategy["kind"];
  judgeAvailable: boolean;
  onChange: (kind: GradingStrategy["kind"]) => void;
}) {
  return (
    <div className="flex shrink-0 gap-0.5 rounded-md border border-white/10 bg-black/30 p-0.5">
      <button
        type="button"
        onClick={() => onChange("assertion")}
        aria-pressed={value === "assertion"}
        className={`rounded px-2 py-1 text-[11px] font-medium transition-all duration-150 active:scale-95 ${
          value === "assertion"
            ? "bg-cyan-300/15 text-cyan-100 shadow-[0_0_0_1px_rgba(103,232,249,0.15)]"
            : "text-neutral-500 hover:text-neutral-300"
        }`}
      >
        Assertion
      </button>
      <button
        type="button"
        onClick={() => judgeAvailable && onChange("judge")}
        aria-pressed={value === "judge"}
        disabled={!judgeAvailable}
        title={judgeAvailable ? undefined : "Add a TypeSafe Evaluation gateway in Settings to use Judge grading"}
        className={`rounded px-2 py-1 text-[11px] font-medium transition-all duration-150 active:scale-95 ${
          value === "judge"
            ? "bg-cyan-300/15 text-cyan-100 shadow-[0_0_0_1px_rgba(103,232,249,0.15)]"
            : "text-neutral-500 hover:text-neutral-300"
        } ${!judgeAvailable ? "cursor-not-allowed opacity-40" : ""}`}
      >
        Judge
      </button>
    </div>
  );
}

function GradingEditor({
  grading,
  judgeGateways,
  onChange,
}: {
  grading: GradingStrategy;
  judgeGateways: GatewayConfig[];
  onChange: (grading: GradingStrategy) => void;
}) {
  const judgeAvailable = judgeGateways.length > 0;

  function setKind(kind: GradingStrategy["kind"]) {
    if (kind === grading.kind) return;
    if (kind === "assertion") {
      onChange({ kind: "assertion", mode: "contains", value: "", caseSensitive: false });
    } else {
      onChange({ kind: "judge", judgeGatewayId: judgeGateways[0]?.id ?? "", rubric: "", passThreshold: 3 });
    }
  }

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between gap-2">
        <SectionLabel icon={<TargetIcon />}>Grading</SectionLabel>
        <GradingKindSegment value={grading.kind} judgeAvailable={judgeAvailable} onChange={setKind} />
      </div>

      {grading.kind === "assertion" && (
        <div className="flex flex-col gap-2">
          <div className="flex items-end gap-2">
            <div className="min-w-0 flex-1">
              <FieldLabel>Mode</FieldLabel>
              <select
                className={`${inputClass} w-full`}
                value={grading.mode}
                onChange={(e) => onChange({ ...grading, mode: e.target.value as AssertionMode })}
              >
                {ASSERTION_MODES.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
            <label className="flex shrink-0 items-center gap-1.5 pb-2 text-xs text-neutral-400">
              <input
                type="checkbox"
                checked={grading.caseSensitive}
                onChange={(e) => onChange({ ...grading, caseSensitive: e.target.checked })}
                className="h-3.5 w-3.5 rounded border-white/20 bg-black/30 accent-cyan-300"
              />
              Case sensitive
            </label>
          </div>
          <div>
            <FieldLabel>{grading.mode === "regex" ? "Pattern" : "Value"}</FieldLabel>
            <input
              className={`${inputClass} w-full font-mono text-xs`}
              placeholder={grading.mode === "regex" ? "\\bhello\\b" : "expected text"}
              value={grading.value}
              onChange={(e) => onChange({ ...grading, value: e.target.value })}
            />
          </div>
        </div>
      )}

      {grading.kind === "judge" && (
        <div className="flex flex-col gap-2">
          {!judgeAvailable ? (
            <p className="rounded-md border border-white/10 bg-black/20 p-2 text-xs text-neutral-500">
              No TypeSafe Evaluation gateway configured -- add one in Settings to use Judge grading.
            </p>
          ) : (
            <>
              <div>
                <FieldLabel>Judge gateway</FieldLabel>
                <select
                  className={`${inputClass} w-full`}
                  value={grading.judgeGatewayId}
                  onChange={(e) => onChange({ ...grading, judgeGatewayId: e.target.value })}
                >
                  {judgeGateways.map((gw) => (
                    <option key={gw.id} value={gw.id}>
                      {gw.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <FieldLabel>Rubric</FieldLabel>
                <textarea
                  className={`${inputClass} w-full text-xs`}
                  rows={2}
                  placeholder="Rate how well the response answers the prompt, 1 (poor) to 5 (excellent)."
                  value={grading.rubric}
                  onChange={(e) => onChange({ ...grading, rubric: e.target.value })}
                />
              </div>
              <div className="w-28">
                <FieldLabel>Pass threshold</FieldLabel>
                <input
                  type="number"
                  min={1}
                  max={5}
                  className={`${inputClass} w-full`}
                  value={grading.passThreshold}
                  onChange={(e) => onChange({ ...grading, passThreshold: Number(e.target.value) })}
                />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

interface Props {
  open: boolean;
  testCase: TestCase | undefined;
  judgeGateways: GatewayConfig[];
  selectedProtocols: GatewayProtocol[];
  onChange: (patch: Partial<TestCase>) => void;
  onClose: () => void;
}

/** Modal editor for a single test case -- name, prompt, grading, and per-case run parameters. Edits apply live. */
export function TestCaseEditModal({ open, testCase, judgeGateways, selectedProtocols, onChange, onClose }: Props) {
  if (!open || !testCase) return null;

  const params = testCase.params ?? {};
  const activeParamCount = Object.values(params).filter((v) => v !== undefined && v !== "").length;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={testCase.name || "Edit test case"}
      icon={<FlaskIcon />}
      maxWidthClassName="max-w-2xl"
    >
      <div className="flex flex-col gap-4">
        <div className="animate-fade-up grid gap-3 sm:grid-cols-[1fr_auto]" style={{ animationDelay: "0ms" }}>
          <div>
            <FieldLabel>Name</FieldLabel>
            <input
              className={`${inputClass} w-full`}
              placeholder="Refuses unsafe request"
              value={testCase.name}
              onChange={(e) => onChange({ name: e.target.value })}
            />
          </div>
          <div className="sm:w-56">
            <FieldLabel>Model override</FieldLabel>
            <input
              className={`${inputClass} w-full`}
              placeholder="gateway default"
              value={testCase.modelOverride ?? ""}
              onChange={(e) => onChange({ modelOverride: e.target.value || undefined })}
            />
          </div>
        </div>

        <div className="animate-fade-up" style={{ animationDelay: "45ms" }}>
          <FieldLabel>Prompt</FieldLabel>
          <textarea
            className={`${inputClass} w-full text-xs`}
            rows={3}
            placeholder="The prompt to send to each target gateway..."
            value={testCase.prompt}
            onChange={(e) => onChange({ prompt: e.target.value })}
          />
        </div>

        <div className="animate-fade-up grid gap-6 lg:grid-cols-2 lg:divide-x lg:divide-white/10" style={{ animationDelay: "90ms" }}>
          <GradingEditor
            grading={testCase.grading}
            judgeGateways={judgeGateways}
            onChange={(grading) => onChange({ grading })}
          />

          <div className="flex flex-col divide-y divide-white/5 rounded-lg border border-white/10 bg-black/10 px-3 lg:rounded-none lg:border-y-0 lg:border-r-0 lg:bg-transparent lg:pl-6">
            <CollapsibleSection
              title="Parameters"
              icon={<SlidersIcon />}
              subtitle="(optional)"
              defaultOpen={false}
              accessory={
                activeParamCount > 0 ? (
                  <span className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-1.5 py-0.5 text-[10px] font-medium text-cyan-200">
                    {activeParamCount} set
                  </span>
                ) : undefined
              }
            >
              <ParametersPanel
                value={params}
                onChange={(next) => onChange({ params: next })}
                selectedProtocols={selectedProtocols}
              />
            </CollapsibleSection>
          </div>
        </div>
      </div>
    </Modal>
  );
}
