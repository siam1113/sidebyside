"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ResultsPanel } from "@/components/playground/ResultsPanel";
import { EmptyResultsState } from "@/components/playground/EmptyResultsState";
import { PlaygroundTabs } from "@/components/PlaygroundTabs";
import { SidebarDrawer } from "@/components/playground/SidebarDrawer";
import {
  cellKey,
  DEFAULT_VARIANT,
  type CellResults,
  type RunCell,
  type RunState,
  type RunVariant,
  type VariantAxisKind,
} from "@/components/playground/types";
import { MAX_TOTAL_VARIANTS, parseSweepValues, type SweepableParam } from "@/components/playground/VariantsPanel";
import { combineVariants, textAxisVariants, truncateLabel } from "@/components/playground/variantEngine";
import type { Attachment, GatewayConfig, GatewayProtocol, RunParams, RunResult } from "@/lib/gateways/types";
import { CHAT_CAPABLE } from "@/lib/gateways/types";
import type { ModelInfo } from "@/lib/gateways/adapters/models";
import { loadMergedModels } from "@/lib/gateways/modelsClient";

/** Cross product of selected gateways x selected models x variants -- one run per triple.
 *  With no models picked, each gateway just runs its own default model. */
function buildCells(targets: GatewayConfig[], modelIds: string[], variants: RunVariant[]): RunCell[] {
  return targets.flatMap((gateway) => {
    const models = modelIds.length > 0 ? modelIds : [gateway.defaultModel];
    return models.flatMap((modelId) =>
      variants.map((variant) => ({ key: cellKey(gateway.id, modelId, variant.id), gateway, modelId, variant })),
    );
  });
}

/** Per-axis variant lists -- each entry overrides just what that axis controls. "repeat" isn't
 *  handled here: it doesn't fork into separate cells, it multiplies how many times each cell
 *  runs (see runAll), so its results get aggregated instead of shown as separate columns.
 *  An enabled axis with no usable input yet (empty list) contributes DEFAULT_VARIANT, so it
 *  doesn't zero out the other axes' combinations. */
function axisVariants(
  axis: Exclude<VariantAxisKind, "repeat">,
  promptVariants: string[],
  systemPromptVariants: string[],
  sweepParam: SweepableParam,
  sweepValuesText: string,
): RunVariant[] {
  if (axis === "prompts") {
    return textAxisVariants("prompt", promptVariants);
  }
  if (axis === "systemPrompts") {
    const prompts = systemPromptVariants.map((s) => s.trim()).filter(Boolean);
    if (prompts.length === 0) return [DEFAULT_VARIANT];
    return prompts.map((sp, i) => ({ id: `sys-${i}`, label: truncateLabel(sp), paramsOverride: { systemPrompt: sp } }));
  }
  // paramSweep
  const values = parseSweepValues(sweepValuesText);
  if (values.length === 0) return [DEFAULT_VARIANT];
  return values.map((v) => ({
    id: `sweep-${v}`,
    label: `${sweepParam}=${v}`,
    paramsOverride: { [sweepParam]: v } as Partial<RunParams>,
  }));
}

// Fixed iteration order so a variant's combined id/label reads the same regardless of the
// order the user happened to click the axis toggles in. "repeat" is excluded -- see axisVariants.
const AXIS_ORDER: Exclude<VariantAxisKind, "repeat">[] = ["prompts", "systemPrompts", "paramSweep"];

/** Turns every enabled non-repeat variant axis into the concrete (capped) cross-product list
 *  of cells to run. Repeat count is applied separately, per cell, in runAll. */
function buildVariants(
  enabledAxes: Set<VariantAxisKind>,
  promptVariants: string[],
  systemPromptVariants: string[],
  sweepParam: SweepableParam,
  sweepValuesText: string,
): { variants: RunVariant[]; rawCount: number } {
  const axisLists = AXIS_ORDER.filter((axis) => enabledAxes.has(axis)).map((axis) =>
    axisVariants(axis, promptVariants, systemPromptVariants, sweepParam, sweepValuesText),
  );
  return combineVariants(axisLists, MAX_TOTAL_VARIANTS);
}

export default function PlaygroundPage() {
  const [gateways, setGateways] = useState<GatewayConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [prompt, setPrompt] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [selectedModelIds, setSelectedModelIds] = useState<string[]>([]);
  const [params, setParams] = useState<RunParams>({});
  const [results, setResults] = useState<Record<string, CellResults>>({});
  const [running, setRunning] = useState(false);
  const [hasRunOnce, setHasRunOnce] = useState(false);
  const [runGeneration, setRunGeneration] = useState(0);
  const [modelOptions, setModelOptions] = useState<ModelInfo[]>([]);
  const [fetchingModels, setFetchingModels] = useState(false);
  const [modelsError, setModelsError] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [enabledAxes, setEnabledAxes] = useState<Set<VariantAxisKind>>(new Set());
  const [repeatCount, setRepeatCount] = useState(3);
  const [promptVariants, setPromptVariants] = useState<string[]>(["", ""]);
  const [systemPromptVariants, setSystemPromptVariants] = useState<string[]>(["", ""]);
  const [sweepParam, setSweepParam] = useState<SweepableParam>("temperature");
  const [sweepValuesText, setSweepValuesText] = useState("0, 0.7, 1.4");
  const selectedKey = [...selected].sort().join(",");

  useEffect(() => {
    fetch("/api/gateways")
      .then((res) => res.json())
      .then((data: GatewayConfig[]) => {
        const capable = data.filter((g) => CHAT_CAPABLE(g.protocol));
        setGateways(capable);
        setSelected(new Set(capable.map((g) => g.id)));
        setLoading(false);
      });
  }, []);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll() {
    setSelected(new Set(gateways.map((g) => g.id)));
  }

  function selectNone() {
    setSelected(new Set());
  }

  function toggleAxis(axis: VariantAxisKind) {
    setEnabledAxes((prev) => {
      const next = new Set(prev);
      if (next.has(axis)) next.delete(axis);
      else next.add(axis);
      return next;
    });
  }

  // Auto-fetch + merge models for every selected gateway -- cached per
  // gateway id, so re-selecting a gateway already seen elsewhere is instant.
  useEffect(() => {
    const targets = gateways.filter((g) => selected.has(g.id));
    if (targets.length === 0) {
      setModelOptions([]);
      setModelsError(null);
      return;
    }
    let cancelled = false;
    setFetchingModels(true);
    setModelsError(null);
    loadMergedModels(targets, false)
      .then(({ models, error }) => {
        if (cancelled) return;
        setModelOptions(models);
        setModelsError(error);
      })
      .finally(() => {
        if (!cancelled) setFetchingModels(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedKey]);

  function refreshModels() {
    const targets = gateways.filter((g) => selected.has(g.id));
    if (targets.length === 0) return;
    setFetchingModels(true);
    setModelsError(null);
    loadMergedModels(targets, true)
      .then(({ models, error }) => {
        setModelOptions(models);
        setModelsError(error);
      })
      .finally(() => setFetchingModels(false));
  }

  const { variants, rawCount: rawVariantCount } = useMemo(
    () => buildVariants(enabledAxes, promptVariants, systemPromptVariants, sweepParam, sweepValuesText),
    [enabledAxes, promptVariants, systemPromptVariants, sweepParam, sweepValuesText],
  );

  const repeats = enabledAxes.has("repeat") ? repeatCount : 1;

  const cells = useMemo(
    () => buildCells(gateways.filter((g) => selected.has(g.id)), selectedModelIds, variants),
    [gateways, selected, selectedModelIds, variants],
  );

  const selectedProtocols = useMemo<GatewayProtocol[]>(
    () => [...new Set(gateways.filter((g) => selected.has(g.id)).map((g) => g.protocol))],
    [gateways, selected],
  );

  const canSendAny = cells.some((c) => (c.variant.promptOverride ?? prompt).trim() || attachments.length > 0);

  function setRunSlot(cellKeyStr: string, index: number, state: RunState) {
    setResults((prev) => {
      const arr = [...(prev[cellKeyStr] ?? [])];
      arr[index] = state;
      return { ...prev, [cellKeyStr]: arr };
    });
  }

  async function runAll() {
    if (!canSendAny || cells.length === 0) return;
    setRunning(true);
    setHasRunOnce(true);
    setRunGeneration((g) => g + 1);
    setResults(
      Object.fromEntries(cells.map((c) => [c.key, Array.from({ length: repeats }, () => ({ status: "loading" }) as RunState)])),
    );

    await Promise.allSettled(
      cells.flatMap((cell) =>
        Array.from({ length: repeats }, (_, i) => i).map(async (i) => {
          try {
            const res = await fetch(`/api/run/${cell.gateway.id}`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                prompt: cell.variant.promptOverride ?? prompt,
                model: cell.modelId,
                params: { ...params, ...cell.variant.paramsOverride },
                attachments: attachments.length ? attachments : undefined,
              }),
            });
            const result = (await res.json()) as RunResult;
            setRunSlot(cell.key, i, { status: "done", result });
          } catch (err) {
            setRunSlot(cell.key, i, { status: "error", message: err instanceof Error ? err.message : String(err) });
          }
        }),
      ),
    );
    setRunning(false);
  }

  if (!loading && gateways.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-50">Gateway Playground</h1>
        <p className="text-neutral-400">
          No gateways configured yet.{" "}
          <Link href="/settings" className="text-cyan-200 underline decoration-cyan-200/30 underline-offset-2 hover:text-cyan-100">
            Add one in Settings
          </Link>{" "}
          to get started.
        </p>
      </div>
    );
  }

  const totalCalls = cells.length * repeats;
  const runLabel =
    selected.size === 0
      ? "Select at least one gateway"
      : totalCalls > selected.size
        ? `Will run ${totalCalls} calls (${selected.size} gateway${selected.size === 1 ? "" : "s"}${
            selectedModelIds.length > 1 ? ` × ${selectedModelIds.length} models` : ""
          }${variants.length > 1 ? ` × ${variants.length} variants` : ""}${
            repeats > 1 ? ` × ${repeats} repeats, aggregated per cell` : ""
          })`
        : `Will run on ${selected.size} gateway${selected.size === 1 ? "" : "s"}`;

  return (
    <div className="flex flex-col gap-8 lg:h-full lg:min-h-0">
      <div className="animate-fade-up shrink-0">
        <PlaygroundTabs />
      </div>

      {/* Results: appears once the first run has been triggered. Reserves space on the
          right when the configuration drawer is open so the drawer never covers it. */}
      <div
        className={`flex min-w-0 flex-1 flex-col gap-6 transition-[padding-right] duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] lg:min-h-0 lg:overflow-y-auto ${
          drawerOpen ? "lg:pr-[440px]" : "lg:pr-0"
        }`}
      >
        {hasRunOnce ? (
          <ResultsPanel key={runGeneration} cells={cells} results={results} prompt={prompt} />
        ) : (
          <EmptyResultsState
            title="No runs yet"
            description="Write a prompt and pick which gateways to send it to, then hit Run."
          />
        )}
      </div>

      <SidebarDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        prompt={prompt}
        onPromptChange={setPrompt}
        attachments={attachments}
        onAttachmentsChange={setAttachments}
        running={running}
        runLabel={runLabel}
        canRun={!running && canSendAny && cells.length > 0}
        onRun={runAll}
        gateways={gateways}
        selected={selected}
        onToggleGateway={toggle}
        onSelectAll={selectAll}
        onSelectNone={selectNone}
        modelOptions={modelOptions}
        selectedModelIds={selectedModelIds}
        onModelIdsChange={setSelectedModelIds}
        fetchingModels={fetchingModels}
        modelsError={modelsError}
        onRefreshModels={refreshModels}
        params={params}
        onParamsChange={setParams}
        selectedProtocols={selectedProtocols}
        enabledAxes={enabledAxes}
        onToggleAxis={toggleAxis}
        repeatCount={repeatCount}
        onRepeatCountChange={setRepeatCount}
        promptVariants={promptVariants}
        onPromptVariantsChange={setPromptVariants}
        systemPromptVariants={systemPromptVariants}
        onSystemPromptVariantsChange={setSystemPromptVariants}
        sweepParam={sweepParam}
        onSweepParamChange={setSweepParam}
        sweepValuesText={sweepValuesText}
        onSweepValuesTextChange={setSweepValuesText}
        variantCount={variants.length}
        rawVariantCount={rawVariantCount}
      />
    </div>
  );
}
