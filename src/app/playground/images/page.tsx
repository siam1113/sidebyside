"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PlaygroundTabs } from "@/components/PlaygroundTabs";
import { ConfigDrawer } from "@/components/playground/ConfigDrawer";
import { CollapsibleSection } from "@/components/playground/CollapsibleSection";
import { GatewayMultiSelect } from "@/components/playground/GatewayMultiSelect";
import { EmptyResultsState } from "@/components/playground/EmptyResultsState";
import { SimpleResultsPanel } from "@/components/playground/SimpleResultsPanel";
import { CellTabView } from "@/components/playground/CellTabView";
import { ImageResultDetail } from "@/components/playground/ImageResultDetail";
import { ImageCompareGrid } from "@/components/playground/ImageCompareGrid";
import { IMAGE_SIZE_LABELS, IMAGE_SIZE_PRESETS, type ImageSizePreset } from "@/components/playground/imageSize";
import { VariantsPanel, MAX_TOTAL_VARIANTS } from "@/components/playground/VariantsPanel";
import { combineVariants, textAxisVariants } from "@/components/playground/variantEngine";
import { ModelMultiSelect } from "@/components/ModelMultiSelect";
import { cellKey, type AsyncState, type CellResults, type RunCell, type VariantAxisKind } from "@/components/playground/types";
import type { GatewayConfig, GatewayProtocol, ImageResult } from "@/lib/gateways/types";
import type { ModelInfo } from "@/lib/gateways/adapters/models";
import { loadMergedModels } from "@/lib/gateways/modelsClient";

const IMAGE_CAPABLE: GatewayProtocol[] = ["openai", "azure-openai", "google-gemini"];

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

function CpuIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-3 w-3">
      <rect x="4.5" y="4.5" width="7" height="7" rx="1" />
      <path d="M6 1.5v2M10 1.5v2M6 12.5v2M10 12.5v2M1.5 6v2M1.5 10v2M12.5 6v2M12.5 10v2" strokeLinecap="round" />
    </svg>
  );
}

/** Cross product of selected gateways x selected models x variants -- one run per triple.
 *  With no models picked, each gateway just runs its own default model. */
function buildCells(gateways: GatewayConfig[], modelIds: string[], variants: RunCell["variant"][]): RunCell[] {
  return gateways.flatMap((gateway) => {
    const models = modelIds.length > 0 ? modelIds : [gateway.defaultModel];
    return models.flatMap((modelId) =>
      variants.map((variant) => ({ key: cellKey(gateway.id, modelId, variant.id), gateway, modelId, variant })),
    );
  });
}

export default function ImagesPlaygroundPage() {
  const [gateways, setGateways] = useState<GatewayConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [prompt, setPrompt] = useState("");
  const [selectedModelIds, setSelectedModelIds] = useState<string[]>([]);
  const [size, setSize] = useState("1024x1024");
  const [results, setResults] = useState<Record<string, CellResults<ImageResult>>>({});
  const [running, setRunning] = useState(false);
  const [hasRunOnce, setHasRunOnce] = useState(false);
  const [runGeneration, setRunGeneration] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [enabledAxes, setEnabledAxes] = useState<Set<VariantAxisKind>>(new Set());
  const [repeatCount, setRepeatCount] = useState(3);
  const [promptVariants, setPromptVariants] = useState<string[]>(["", ""]);
  const [modelOptions, setModelOptions] = useState<ModelInfo[]>([]);
  const [fetchingModels, setFetchingModels] = useState(false);
  const [modelsError, setModelsError] = useState<string | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [imageSize, setImageSize] = useState<ImageSizePreset>("md");
  const selectedKey = [...selected].sort().join(",");

  useEffect(() => {
    fetch("/api/gateways")
      .then((res) => res.json())
      .then((data: GatewayConfig[]) => {
        const capable = data.filter((g) => IMAGE_CAPABLE.includes(g.protocol));
        setGateways(capable);
        setSelected(new Set(capable.map((g) => g.id)));
        setLoading(false);
      });
  }, []);

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

  const usingPromptVariants = enabledAxes.has("prompts");

  const { variants, rawCount: rawVariantCount } = useMemo(() => {
    const axisLists = enabledAxes.has("prompts") ? [textAxisVariants("prompt", promptVariants)] : [];
    return combineVariants(axisLists, MAX_TOTAL_VARIANTS);
  }, [enabledAxes, promptVariants]);

  const repeats = enabledAxes.has("repeat") ? repeatCount : 1;

  const cells = useMemo(
    () => buildCells(gateways.filter((g) => selected.has(g.id)), selectedModelIds, variants),
    [gateways, selected, selectedModelIds, variants],
  );

  const canSendAny = cells.some((c) => (c.variant.promptOverride ?? prompt).trim());

  function setRunSlot(key: string, index: number, state: AsyncState<ImageResult>) {
    setResults((prev) => {
      const arr = [...(prev[key] ?? [])];
      arr[index] = state;
      return { ...prev, [key]: arr };
    });
  }

  async function runAll() {
    if (!canSendAny || cells.length === 0) return;
    setRunning(true);
    setHasRunOnce(true);
    setRunGeneration((g) => g + 1);
    setResults(
      Object.fromEntries(
        cells.map((c) => [c.key, Array.from({ length: repeats }, () => ({ status: "loading" }) as AsyncState<ImageResult>)]),
      ),
    );

    await Promise.allSettled(
      cells.flatMap((cell) =>
        Array.from({ length: repeats }, (_, i) => i).map(async (i) => {
          try {
            const res = await fetch(`/api/image/${cell.gateway.id}`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ prompt: cell.variant.promptOverride ?? prompt, model: cell.modelId, size }),
            });
            const result = (await res.json()) as ImageResult;
            setRunSlot(cell.key, i, { status: "done", result });
          } catch (err) {
            setRunSlot(cell.key, i, { status: "error", message: err instanceof Error ? err.message : String(err) });
          }
        }),
      ),
    );
    setRunning(false);
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

      {!loading && gateways.length === 0 ? (
        <p className="text-neutral-400">
          No image-capable gateways configured (OpenAI-compatible, Azure OpenAI, or Google Gemini).{" "}
          <Link href="/settings" className="text-cyan-200 underline decoration-cyan-200/30 underline-offset-2 hover:text-cyan-100">
            Add one in Settings
          </Link>
          .
        </p>
      ) : (
        <>
          {/* Results: reserves space on the right when the configuration drawer is
              open so the drawer never covers it. */}
          <div
            className={`flex min-w-0 flex-1 flex-col gap-4 transition-[padding-right] duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] lg:min-h-0 lg:overflow-y-auto ${
              drawerOpen ? "lg:pr-[440px]" : "lg:pr-0"
            }`}
          >
            {hasRunOnce ? (
              <SimpleResultsPanel
                key={runGeneration}
                count={cells.length}
                accessory={
                  <div className="flex shrink-0 items-center gap-2">
                    <div className="flex items-center gap-0.5 rounded-lg border border-white/10 p-0.5">
                      {IMAGE_SIZE_PRESETS.map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setImageSize(preset)}
                          title={`${IMAGE_SIZE_LABELS[preset]} thumbnails`}
                          className={`rounded-md px-2 py-1 text-[11px] font-medium transition-colors duration-150 ${
                            imageSize === preset
                              ? "bg-cyan-300/10 text-cyan-100"
                              : "text-neutral-400 hover:text-neutral-200"
                          }`}
                        >
                          {IMAGE_SIZE_LABELS[preset]}
                        </button>
                      ))}
                    </div>
                    {cells.length >= 2 && (
                      <button
                        type="button"
                        onClick={() => setCompareMode((v) => !v)}
                        className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors duration-150 ${
                          compareMode
                            ? "border-cyan-300/30 bg-cyan-300/10 text-cyan-100"
                            : "border-white/10 text-neutral-400 hover:border-white/20 hover:text-neutral-200"
                        }`}
                      >
                        {compareMode ? "Back to tabs" : "Compare"}
                      </button>
                    )}
                  </div>
                }
              >
                {compareMode && cells.length >= 2 ? (
                  <ImageCompareGrid cells={cells} results={results} imageSize={imageSize} />
                ) : (
                  <CellTabView
                    cells={cells}
                    results={results}
                    renderDetail={(cell, state) => (
                      <ImageResultDetail modelId={cell.modelId} state={state} imageSize={imageSize} />
                    )}
                  />
                )}
              </SimpleResultsPanel>
            ) : (
              <EmptyResultsState
                title="No images yet"
                description="Describe an image and pick which gateways to run against, then hit Run."
              />
            )}
          </div>

          <ConfigDrawer open={drawerOpen} onOpenChange={setDrawerOpen}>
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
                        Prompt variants below take over once any are filled in -- this box is only sent when that
                        list is empty.
                      </p>
                    )}
                    <textarea
                      className="w-full resize-y rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-600 transition-colors duration-150 focus:border-cyan-300/40 focus:outline-none focus:ring-2 focus:ring-cyan-300/15"
                      rows={6}
                      placeholder="Describe the image to generate..."
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                    />
                    <div className="flex items-center justify-between pt-1">
                      <p className="text-xs text-neutral-500">{runLabel}</p>
                      <button
                        onClick={runAll}
                        disabled={running || !canSendAny || cells.length === 0}
                        className="btn-cta shrink-0 rounded-lg px-5 py-2 text-sm font-semibold"
                      >
                        {running ? "Generating..." : "Run"}
                      </button>
                    </div>
                  </div>
                </CollapsibleSection>

                <CollapsibleSection title="Gateways" icon={<ServerIcon />} className="animate-fade-up" style={{ animationDelay: "45ms" }}>
                  <GatewayMultiSelect
                    gateways={gateways}
                    selected={selected}
                    onToggle={toggle}
                    onSelectAll={selectAll}
                    onSelectNone={selectNone}
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
                    onChange={setSelectedModelIds}
                    options={modelOptions}
                    loading={fetchingModels}
                    error={modelsError}
                    disabled={selected.size === 0}
                    placeholder="each gateway's default"
                    onRefresh={refreshModels}
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
                >
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-neutral-400">Size</label>
                    <select
                      className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-neutral-100 transition-colors duration-150 focus:border-cyan-300/40 focus:outline-none focus:ring-2 focus:ring-cyan-300/15"
                      value={size}
                      onChange={(e) => setSize(e.target.value)}
                    >
                      <option value="1024x1024">1024x1024</option>
                      <option value="1792x1024">1792x1024</option>
                      <option value="1024x1792">1024x1792</option>
                    </select>
                  </div>
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
                        {variants.length}×
                      </span>
                    ) : undefined
                  }
                >
                  <VariantsPanel
                    enabledAxes={enabledAxes}
                    onToggleAxis={toggleAxis}
                    axes={["repeat", "prompts"]}
                    repeatCount={repeatCount}
                    onRepeatCountChange={setRepeatCount}
                    promptVariants={promptVariants}
                    onPromptVariantsChange={setPromptVariants}
                    promptAxisLabel="Prompt"
                    promptItemLabel="Prompt"
                    selectedProtocols={[]}
                    variantCount={variants.length}
                    rawVariantCount={rawVariantCount}
                    runUnitLabel="gateway"
                  />
                </CollapsibleSection>
              </div>
            </div>
          </ConfigDrawer>
        </>
      )}
    </div>
  );
}
