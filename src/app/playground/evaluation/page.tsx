"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PlaygroundTabs } from "@/components/PlaygroundTabs";
import { EvalSidebarDrawer } from "@/components/playground/EvalSidebarDrawer";
import { SimpleResultsPanel } from "@/components/playground/SimpleResultsPanel";
import { CellTabView } from "@/components/playground/CellTabView";
import { EvalResultDetail } from "@/components/playground/EvalResultDetail";
import { EmptyResultsState } from "@/components/playground/EmptyResultsState";
import { MAX_TOTAL_VARIANTS } from "@/components/playground/VariantsPanel";
import { combineVariants, textAxisVariants } from "@/components/playground/variantEngine";
import type { QuestionDraft } from "@/components/playground/EvalSidebar";
import { cellKey, type AsyncState, type CellResults, type RunCell, type VariantAxisKind } from "@/components/playground/types";
import type { EvalQuestion, EvalResult, GatewayConfig } from "@/lib/gateways/types";
import type { ModelInfo } from "@/lib/gateways/adapters/models";
import { loadMergedModels } from "@/lib/gateways/modelsClient";

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

function newDraft(seed?: Partial<QuestionDraft>): QuestionDraft {
  return {
    id: Math.random().toString(36).slice(2),
    key: "",
    type: "score",
    instructions: "",
    trueCriteria: "",
    falseCriteria: "",
    optionsText: "",
    criteriaText: "",
    ...seed,
  };
}

function parseOptions(text: string): Record<string, string | null> {
  const out: Record<string, string | null> = {};
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const idx = trimmed.indexOf(":");
    if (idx === -1) {
      out[trimmed] = null;
    } else {
      const k = trimmed.slice(0, idx).trim();
      const v = trimmed.slice(idx + 1).trim();
      if (k) out[k] = v || null;
    }
  }
  return out;
}

function parseCriteriaLines(text: string): string[] {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

function toEvalQuestion(d: QuestionDraft): EvalQuestion | null {
  const instructions = d.instructions.trim();
  if (!instructions) return null;
  if (d.type === "noul") {
    if (!d.trueCriteria.trim() || !d.falseCriteria.trim()) return null;
    return { type: "noul", instructions, criteria: { true: d.trueCriteria.trim(), false: d.falseCriteria.trim() } };
  }
  if (d.type === "choice") {
    const criteria = parseOptions(d.optionsText);
    if (Object.keys(criteria).length === 0) return null;
    return { type: "choice", instructions, criteria };
  }
  const criteria = parseCriteriaLines(d.criteriaText);
  if (criteria.length === 0) return null;
  return { type: "score", instructions, criteria };
}

function buildQuestions(drafts: QuestionDraft[]): { questions: Record<string, EvalQuestion>; error: string | null } {
  const questions: Record<string, EvalQuestion> = {};
  for (const d of drafts) {
    const key = d.key.trim();
    if (!key) return { questions: {}, error: "Every question needs a key" };
    if (questions[key]) return { questions: {}, error: `Duplicate question key "${key}"` };
    const q = toEvalQuestion(d);
    if (!q) return { questions: {}, error: `Question "${key}" is missing required fields` };
    questions[key] = q;
  }
  if (Object.keys(questions).length === 0) return { questions: {}, error: "Add at least one question" };
  return { questions, error: null };
}

function looksLikeVercelGateway(baseUrl: string): boolean {
  return /vercel/i.test(baseUrl);
}

export default function EvaluationPlaygroundPage() {
  const [gateways, setGateways] = useState<GatewayConfig[]>([]);
  const [allGateways, setAllGateways] = useState<GatewayConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [stateText, setStateText] = useState("");
  const [selectedModelIds, setSelectedModelIds] = useState<string[]>([]);
  const [drafts, setDrafts] = useState<QuestionDraft[]>(() => [
    newDraft({
      key: "quality",
      type: "score",
      instructions: "How would you rate the overall quality?",
      criteriaText: "poor\nfair\ngood\nexcellent",
    }),
  ]);
  const [buildError, setBuildError] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, CellResults<EvalResult>>>({});
  const [running, setRunning] = useState(false);
  const [hasRunOnce, setHasRunOnce] = useState(false);
  const [runGeneration, setRunGeneration] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [enabledAxes, setEnabledAxes] = useState<Set<VariantAxisKind>>(new Set());
  const [repeatCount, setRepeatCount] = useState(3);
  const [stateVariants, setStateVariants] = useState<string[]>(["", ""]);
  const [modelOptions, setModelOptions] = useState<ModelInfo[]>([]);
  const [fetchingModels, setFetchingModels] = useState(false);
  const [modelsError, setModelsError] = useState<string | null>(null);
  const selectedKey = [...selected].sort().join(",");

  useEffect(() => {
    fetch("/api/gateways")
      .then((res) => res.json())
      .then((data: GatewayConfig[]) => {
        setAllGateways(data);
        const capable = data.filter((g) => g.protocol === "typesafe-eval");
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

  /** Stashes the existing gateway's key (never in the URL) and deep-links to
   *  Settings with the Evaluation protocol pre-selected and the form pre-filled. */
  function reuseAsEvalGateway(gw: GatewayConfig) {
    try {
      sessionStorage.setItem(
        "pendingGatewayDraft",
        JSON.stringify({ baseUrl: "https://api.typesafe.ai/v1", apiKey: gw.apiKey }),
      );
    } catch {
      // sessionStorage unavailable -- the protocol-only deep link still helps
    }
    window.location.href = "/settings?protocol=typesafe-eval";
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

  function updateDraft(id: string, patch: Partial<QuestionDraft>) {
    setDrafts((prev) => prev.map((d) => (d.id === id ? { ...d, ...patch } : d)));
  }

  function addDraft() {
    setDrafts((prev) => [...prev, newDraft()]);
  }

  function removeDraft(id: string) {
    setDrafts((prev) => prev.filter((d) => d.id !== id));
  }

  function toggleAxis(axis: VariantAxisKind) {
    setEnabledAxes((prev) => {
      const next = new Set(prev);
      if (next.has(axis)) next.delete(axis);
      else next.add(axis);
      return next;
    });
  }

  const { variants, rawCount: rawVariantCount } = useMemo(() => {
    const axisLists = enabledAxes.has("prompts") ? [textAxisVariants("state", stateVariants)] : [];
    return combineVariants(axisLists, MAX_TOTAL_VARIANTS);
  }, [enabledAxes, stateVariants]);

  const repeats = enabledAxes.has("repeat") ? repeatCount : 1;

  const cells = useMemo(
    () => buildCells(gateways.filter((g) => selected.has(g.id)), selectedModelIds, variants),
    [gateways, selected, selectedModelIds, variants],
  );

  const canSendAny = cells.some((c) => (c.variant.promptOverride ?? stateText).trim());

  function setRunSlot(key: string, index: number, state: AsyncState<EvalResult>) {
    setResults((prev) => {
      const arr = [...(prev[key] ?? [])];
      arr[index] = state;
      return { ...prev, [key]: arr };
    });
  }

  async function runAll() {
    const { questions, error } = buildQuestions(drafts);
    if (error) {
      setBuildError(error);
      return;
    }
    if (!canSendAny || cells.length === 0) return;
    setBuildError(null);
    setRunning(true);
    setHasRunOnce(true);
    setRunGeneration((g) => g + 1);
    setResults(
      Object.fromEntries(
        cells.map((c) => [c.key, Array.from({ length: repeats }, () => ({ status: "loading" }) as AsyncState<EvalResult>)]),
      ),
    );

    await Promise.allSettled(
      cells.flatMap((cell) =>
        Array.from({ length: repeats }, (_, i) => i).map(async (i) => {
          try {
            const res = await fetch(`/api/evaluate/${cell.gateway.id}`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                state: cell.variant.promptOverride ?? stateText,
                questions,
                model: cell.modelId,
              }),
            });
            const result = (await res.json()) as EvalResult;
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
        <div className="flex flex-col items-start gap-3">
          {allGateways.length === 0 ? (
            <p className="text-neutral-400">
              No gateways configured yet.{" "}
              <Link
                href="/settings?protocol=typesafe-eval"
                className="text-cyan-200 underline decoration-cyan-200/30 underline-offset-2 hover:text-cyan-100"
              >
                Add one in Settings
              </Link>
              .
            </p>
          ) : (
            <p className="text-neutral-400">
              You have {allGateways.length} gateway{allGateways.length === 1 ? "" : "s"} configured, but none are set
              up for Evaluation -- it&apos;s a different API shape (<code>POST /v1/systemone</code>) than chat
              completions, so it needs its own gateway entry.{" "}
              <Link
                href="/settings?protocol=typesafe-eval"
                className="text-cyan-200 underline decoration-cyan-200/30 underline-offset-2 hover:text-cyan-100"
              >
                Add one in Settings
              </Link>
              .
            </p>
          )}
          {(() => {
            const vercelCandidate = allGateways.find(
              (g) => g.protocol === "openai" && looksLikeVercelGateway(g.baseUrl),
            );
            if (!vercelCandidate) return null;
            return (
              <button
                type="button"
                onClick={() => reuseAsEvalGateway(vercelCandidate)}
                className="w-fit rounded-lg border border-cyan-300/30 bg-cyan-300/10 px-3.5 py-2 text-sm font-medium text-cyan-100 transition-colors duration-150 hover:bg-cyan-300/15"
              >
                Reuse &quot;{vercelCandidate.name}&quot;&apos;s key as a TypeSafe Evaluation gateway
              </button>
            );
          })()}
        </div>
      ) : (
        <>
          {/* Results: reserves space on the right when the configuration drawer is
              open so the drawer never covers it. */}
          <div
            className={`flex min-w-0 flex-1 flex-col gap-6 transition-[padding-right] duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] lg:min-h-0 lg:overflow-y-auto ${
              drawerOpen ? "lg:pr-[440px]" : "lg:pr-0"
            }`}
          >
            {hasRunOnce ? (
              <SimpleResultsPanel key={runGeneration} count={cells.length}>
                <CellTabView
                  cells={cells}
                  results={results}
                  renderDetail={(cell, state) => <EvalResultDetail modelId={cell.modelId} state={state} />}
                />
              </SimpleResultsPanel>
            ) : (
              <EmptyResultsState
                title="No evaluations yet"
                description="Paste a state to judge, add your questions, and pick which gateways to run against, then hit Run."
              />
            )}
          </div>

          <EvalSidebarDrawer
            open={drawerOpen}
            onOpenChange={setDrawerOpen}
            stateText={stateText}
            onStateTextChange={setStateText}
            running={running}
            runLabel={runLabel}
            canRun={!running && canSendAny && cells.length > 0}
            onRun={runAll}
            gateways={gateways}
            selected={selected}
            onToggleGateway={toggle}
            onSelectAll={selectAll}
            onSelectNone={selectNone}
            drafts={drafts}
            onUpdateDraft={updateDraft}
            onAddDraft={addDraft}
            onRemoveDraft={removeDraft}
            buildError={buildError}
            selectedModelIds={selectedModelIds}
            onModelIdsChange={setSelectedModelIds}
            modelOptions={modelOptions}
            fetchingModels={fetchingModels}
            modelsError={modelsError}
            onRefreshModels={refreshModels}
            enabledAxes={enabledAxes}
            onToggleAxis={toggleAxis}
            repeatCount={repeatCount}
            onRepeatCountChange={setRepeatCount}
            stateVariants={stateVariants}
            onStateVariantsChange={setStateVariants}
            variantCount={variants.length}
            rawVariantCount={rawVariantCount}
          />
        </>
      )}
    </div>
  );
}
