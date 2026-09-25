"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { gradeAssertion, gradeWithJudge } from "@/lib/benchmarks/grade";
import { mergeParams } from "@/lib/benchmarks/params";
import type { Technique } from "@/lib/benchmarks/techniques";
import { parseSystemPromptVariants } from "@/lib/benchmarks/variants";
import type { ModelInfo } from "@/lib/gateways/adapters/models";
import { fetchModelsForGateway } from "@/lib/gateways/modelsClient";
import type { GatewayConfig, GatewayProtocol, RunParams, RunRequestBody, RunResult } from "@/lib/gateways/types";
import type { BenchRunConfig, BenchSuite, StoredCell } from "@/lib/db/benchSuites";
import { cellKey, targetKey, type AttemptOutcome, type CellState, type RunTarget, type TestCase } from "./types";

function newTestCase(seed?: Partial<TestCase>): TestCase {
  return {
    id: Math.random().toString(36).slice(2),
    name: "",
    prompt: "",
    grading: { kind: "assertion", mode: "contains", value: "", caseSensitive: false },
    ...seed,
  };
}

function buildTestCases(testCases: TestCase[]): { valid: TestCase[]; error: string | null } {
  for (const tc of testCases) {
    if (!tc.name.trim()) return { valid: [], error: "Every test case needs a name" };
    if (!tc.prompt.trim()) return { valid: [], error: `Test case "${tc.name}" is missing a prompt` };
    if (tc.grading.kind === "assertion" && !tc.grading.value.trim()) {
      return { valid: [], error: `Test case "${tc.name}" is missing an assertion value` };
    }
    if (tc.grading.kind === "judge" && (!tc.grading.judgeGatewayId || !tc.grading.rubric.trim())) {
      return { valid: [], error: `Test case "${tc.name}" is missing a judge gateway or rubric` };
    }
  }
  if (testCases.length === 0) return { valid: [], error: "Add at least one test case" };
  return { valid: testCases, error: null };
}

async function loadMergedModels(targets: GatewayConfig[], force: boolean): Promise<{ models: ModelInfo[]; error: string | null }> {
  const results = await Promise.allSettled(targets.map((gw) => fetchModelsForGateway(gw.id, force)));
  const merged = new Map<string, ModelInfo>();
  const failures: string[] = [];
  results.forEach((r, i) => {
    if (r.status === "fulfilled") {
      r.value.forEach((m) => {
        if (!merged.has(m.id)) merged.set(m.id, m);
      });
    } else {
      failures.push(`${targets[i].name}: ${r.reason instanceof Error ? r.reason.message : String(r.reason)}`);
    }
  });
  const models = [...merged.values()].sort((a, b) => a.id.localeCompare(b.id));
  const error =
    models.length === 0
      ? (failures[0] ?? null)
      : failures.length > 0
        ? `${failures.length} of ${targets.length} gateways failed to list models`
        : null;
  return { models, error };
}

interface BenchmarksContextValue {
  gateways: GatewayConfig[];
  loading: boolean;
  targetGateways: GatewayConfig[];
  judgeGateways: GatewayConfig[];
  selectedProtocols: GatewayProtocol[];

  selected: Set<string>;
  toggleGateway: (id: string) => void;
  selectAllGateways: () => void;
  selectNoneGateways: () => void;

  testCases: TestCase[];
  updateTestCase: (id: string, patch: Partial<TestCase>) => void;
  addTestCase: () => string;
  removeTestCase: (id: string) => void;
  useTechnique: (t: Technique) => void;
  buildError: string | null;

  selectedTestCaseIds: Set<string>;
  toggleTestCase: (id: string) => void;
  selectAllTestCases: () => void;
  selectNoneTestCases: () => void;

  // Run-level configuration
  runModelIds: string[];
  setRunModelIds: (ids: string[]) => void;
  modelOptions: ModelInfo[];
  fetchingModels: boolean;
  modelsError: string | null;
  ensureModelsLoaded: () => void;
  refreshModels: () => void;

  runParams: RunParams;
  setRunParams: (params: RunParams) => void;

  systemPromptVariantsText: string;
  setSystemPromptVariantsText: (text: string) => void;

  repeatCount: number;
  setRepeatCount: (n: number) => void;

  runTargets: RunTarget[];
  cells: Record<string, CellState>;
  running: boolean;
  hasRunOnce: boolean;
  runLabel: string;
  canRun: boolean;
  runAll: () => Promise<void>;

  // Suite persistence -- saving turns a run into tracked history with regression detection.
  currentSuiteId: string | null;
  currentSuiteName: string | null;
  saving: boolean;
  saveAsNewSuite: (name: string) => Promise<void>;
  updateCurrentSuite: () => Promise<void>;
  loadSuite: (suite: BenchSuite) => void;
  clearSuite: () => void;
}

const BenchmarksContext = createContext<BenchmarksContextValue | null>(null);

export function BenchmarksProvider({ children }: { children: ReactNode }) {
  const [gateways, setGateways] = useState<GatewayConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [testCases, setTestCases] = useState<TestCase[]>(() => [
    newTestCase({
      name: "Says hello",
      prompt: "Say hello in one short sentence.",
      grading: { kind: "assertion", mode: "contains", value: "hello", caseSensitive: false },
    }),
  ]);
  const [selectedTestCaseIds, setSelectedTestCaseIds] = useState<Set<string>>(() => new Set(testCases.map((tc) => tc.id)));
  const [buildError, setBuildError] = useState<string | null>(null);

  const [runModelIds, setRunModelIds] = useState<string[]>([]);
  const [modelOptions, setModelOptions] = useState<ModelInfo[]>([]);
  const [fetchingModels, setFetchingModels] = useState(false);
  const [modelsError, setModelsError] = useState<string | null>(null);
  const [runParams, setRunParams] = useState<RunParams>({});
  const [systemPromptVariantsText, setSystemPromptVariantsText] = useState("");
  const [repeatCount, setRepeatCount] = useState(1);

  const [runTargets, setRunTargets] = useState<RunTarget[]>([]);
  const [cells, setCells] = useState<Record<string, CellState>>({});
  const [running, setRunning] = useState(false);
  const [hasRunOnce, setHasRunOnce] = useState(false);

  const [currentSuiteId, setCurrentSuiteId] = useState<string | null>(null);
  const [currentSuiteName, setCurrentSuiteName] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/gateways")
      .then((res) => res.json())
      .then((data: GatewayConfig[]) => {
        setGateways(data);
        const runnable = data.filter((g) => g.protocol !== "typesafe-eval");
        setSelected(new Set(runnable.map((g) => g.id)));
        setLoading(false);
      });
  }, []);

  const targetGateways = gateways.filter((g) => g.protocol !== "typesafe-eval");
  const judgeGateways = gateways.filter((g) => g.protocol === "typesafe-eval");
  const selectedProtocols = targetGateways.filter((g) => selected.has(g.id)).map((g) => g.protocol);
  const selectedTargetGateways = targetGateways.filter((g) => selected.has(g.id));

  async function loadModels(force: boolean) {
    if (selectedTargetGateways.length === 0) {
      setModelOptions([]);
      setModelsError(null);
      return;
    }
    setFetchingModels(true);
    const { models, error } = await loadMergedModels(selectedTargetGateways, force);
    setModelOptions(models);
    setModelsError(error);
    setFetchingModels(false);
  }

  function ensureModelsLoaded() {
    void loadModels(false);
  }

  function refreshModels() {
    void loadModels(true);
  }

  function toggleGateway(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAllGateways() {
    setSelected(new Set(targetGateways.map((g) => g.id)));
  }

  function selectNoneGateways() {
    setSelected(new Set());
  }

  function updateTestCase(id: string, patch: Partial<TestCase>) {
    setTestCases((prev) => prev.map((tc) => (tc.id === id ? { ...tc, ...patch } : tc)));
  }

  function addTestCase(): string {
    const tc = newTestCase();
    setTestCases((prev) => [...prev, tc]);
    setSelectedTestCaseIds((prev) => new Set(prev).add(tc.id));
    return tc.id;
  }

  function removeTestCase(id: string) {
    setTestCases((prev) => prev.filter((tc) => tc.id !== id));
    setSelectedTestCaseIds((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }

  function useTechnique(t: Technique) {
    const tc = newTestCase({
      name: t.name,
      prompt: t.promptTemplate,
      params: t.params,
      grading: t.grading.kind === "judge" ? { ...t.grading, judgeGatewayId: judgeGateways[0]?.id ?? "" } : t.grading,
    });
    setTestCases((prev) => [...prev, tc]);
    setSelectedTestCaseIds((prev) => new Set(prev).add(tc.id));
  }

  function toggleTestCase(id: string) {
    setSelectedTestCaseIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAllTestCases() {
    setSelectedTestCaseIds(new Set(testCases.map((tc) => tc.id)));
  }

  function selectNoneTestCases() {
    setSelectedTestCaseIds(new Set());
  }

  async function runAll() {
    const runnable = testCases.filter((tc) => selectedTestCaseIds.has(tc.id));
    if (runnable.length === 0) {
      setBuildError("Select at least one test case to run");
      return;
    }
    const { valid, error } = buildTestCases(runnable);
    if (error) {
      setBuildError(error);
      return;
    }
    const targets = targetGateways.filter((g) => selected.has(g.id));
    if (targets.length === 0) return;

    const variants = parseSystemPromptVariants(systemPromptVariantsText);
    const targetList: RunTarget[] = targets.flatMap((gateway) => {
      const modelIds = runModelIds.length > 0 ? runModelIds : [gateway.defaultModel];
      return modelIds.flatMap((modelId) =>
        variants.map((variant) => ({ key: targetKey(gateway.id, modelId, variant.id), gateway, modelId, variant })),
      );
    });

    setBuildError(null);
    setRunning(true);
    setHasRunOnce(true);
    setRunTargets(targetList);

    const initial: Record<string, CellState> = {};
    for (const tc of valid) {
      for (const t of targetList) {
        initial[cellKey(tc.id, t.key)] = { status: "running" };
      }
    }
    setCells(initial);

    const reps = Math.max(1, repeatCount);
    const finalCells: Record<string, StoredCell> = {};

    await Promise.allSettled(
      valid.flatMap((tc) =>
        targetList.map(async (t) => {
          const key = cellKey(tc.id, t.key);
          const modelId = runModelIds.length > 0 ? t.modelId : tc.modelOverride || t.gateway.defaultModel;
          let params = mergeParams(runParams, tc.params);
          if (t.variant.systemPrompt !== undefined) {
            params = { ...params, systemPrompt: t.variant.systemPrompt };
          }

          const attempts: AttemptOutcome[] = [];
          for (let i = 0; i < reps; i++) {
            try {
              const body: RunRequestBody = { prompt: tc.prompt, model: modelId, params };
              const res = await fetch(`/api/run/${t.gateway.id}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
              });
              const run = (await res.json()) as RunResult;
              if (run.error) {
                attempts.push({ kind: "run-error", message: run.error });
                continue;
              }

              if (tc.grading.kind === "assertion") {
                attempts.push({ kind: "graded", run, grade: gradeAssertion(tc.grading, run.text) });
              } else {
                const grading = tc.grading;
                const judgeGateway = judgeGateways.find((g) => g.id === grading.judgeGatewayId);
                const grade = judgeGateway
                  ? await gradeWithJudge(grading, judgeGateway, tc.prompt, run.text)
                  : { status: "error" as const, message: "Judge gateway not found" };
                attempts.push({ kind: "graded", run, grade });
              }
            } catch (err) {
              attempts.push({ kind: "run-error", message: err instanceof Error ? err.message : String(err) });
            }
          }

          setCells((prev) => ({ ...prev, [key]: { status: "done", attempts } }));
          finalCells[key] = {
            testCaseId: tc.id,
            gatewayId: t.gateway.id,
            gatewayName: t.gateway.name,
            modelId,
            variantLabel: t.variant.label,
            pass: attempts.length > 0 && attempts.every((a) => a.kind === "graded" && a.grade.status === "graded" && a.grade.pass),
            attempts,
          };
        }),
      ),
    );
    setRunning(false);

    if (currentSuiteId) {
      setSaving(true);
      try {
        await fetch(`/api/bench-suites/${currentSuiteId}/runs`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cells: Object.values(finalCells) }),
        });
      } finally {
        setSaving(false);
      }
    }
  }

  function currentRunConfig(): BenchRunConfig {
    return {
      selectedGatewayIds: [...selected],
      runModelIds,
      runParams,
      systemPromptVariantsText,
      repeatCount,
    };
  }

  async function saveAsNewSuite(name: string) {
    setSaving(true);
    try {
      const res = await fetch("/api/bench-suites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, testCases, runConfig: currentRunConfig() }),
      });
      const suite = (await res.json()) as BenchSuite;
      if (res.ok) {
        setCurrentSuiteId(suite.id);
        setCurrentSuiteName(suite.name);
      }
    } finally {
      setSaving(false);
    }
  }

  async function updateCurrentSuite() {
    if (!currentSuiteId || !currentSuiteName) return;
    setSaving(true);
    try {
      await fetch(`/api/bench-suites/${currentSuiteId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: currentSuiteName, testCases, runConfig: currentRunConfig() }),
      });
    } finally {
      setSaving(false);
    }
  }

  function loadSuite(suite: BenchSuite) {
    setTestCases(suite.testCases);
    setSelectedTestCaseIds(new Set(suite.testCases.map((tc) => tc.id)));
    if (suite.runConfig) {
      setSelected(new Set(suite.runConfig.selectedGatewayIds));
      setRunModelIds(suite.runConfig.runModelIds);
      setRunParams(suite.runConfig.runParams);
      setSystemPromptVariantsText(suite.runConfig.systemPromptVariantsText);
      setRepeatCount(suite.runConfig.repeatCount);
    }
    setCurrentSuiteId(suite.id);
    setCurrentSuiteName(suite.name);
    setHasRunOnce(false);
    setCells({});
  }

  function clearSuite() {
    setCurrentSuiteId(null);
    setCurrentSuiteName(null);
  }

  const totalCalls = selectedTestCaseIds.size * selectedTargetGateways.length * Math.max(1, runModelIds.length) * Math.max(1, repeatCount);
  const runLabel =
    selectedTestCaseIds.size === 0
      ? "Select at least one test case"
      : selected.size === 0
        ? "Select at least one target gateway"
        : `Will make ${totalCalls} call${totalCalls === 1 ? "" : "s"}`;

  const value: BenchmarksContextValue = {
    gateways,
    loading,
    targetGateways,
    judgeGateways,
    selectedProtocols,
    selected,
    toggleGateway,
    selectAllGateways,
    selectNoneGateways,
    testCases,
    updateTestCase,
    addTestCase,
    removeTestCase,
    useTechnique,
    buildError,
    selectedTestCaseIds,
    toggleTestCase,
    selectAllTestCases,
    selectNoneTestCases,
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
    runTargets,
    cells,
    running,
    hasRunOnce,
    runLabel,
    canRun: !running && selected.size > 0 && selectedTestCaseIds.size > 0,
    runAll,
    currentSuiteId,
    currentSuiteName,
    saving,
    saveAsNewSuite,
    updateCurrentSuite,
    loadSuite,
    clearSuite,
  };

  return <BenchmarksContext.Provider value={value}>{children}</BenchmarksContext.Provider>;
}

export function useBenchmarks(): BenchmarksContextValue {
  const ctx = useContext(BenchmarksContext);
  if (!ctx) throw new Error("useBenchmarks must be used within a BenchmarksProvider");
  return ctx;
}
