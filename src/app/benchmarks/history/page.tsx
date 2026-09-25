"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useBenchmarks } from "@/components/benchmarks/BenchmarksContext";
import type { BenchRun, BenchSuite, StoredCell } from "@/lib/db/benchSuites";

function SuiteDetail({ suite, onLoaded }: { suite: BenchSuite; onLoaded: () => void }) {
  const { loadSuite } = useBenchmarks();
  const router = useRouter();
  const [runs, setRuns] = useState<BenchRun[] | null>(null);
  const [regressions, setRegressions] = useState<StoredCell[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/bench-suites/${suite.id}`)
      .then((res) => res.json())
      .then((body) => {
        if (!cancelled) {
          setRuns(body.runs ?? []);
          setRegressions(body.regressions ?? []);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [suite.id]);

  function handleLoad() {
    loadSuite(suite);
    onLoaded();
    router.push("/benchmarks/execution");
  }

  return (
    <div className="glass-panel flex flex-col gap-4 rounded-xl p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-medium text-neutral-100">{suite.name}</h2>
          <p className="text-xs text-neutral-500">
            {suite.testCases.length} test case{suite.testCases.length === 1 ? "" : "s"} &middot; updated{" "}
            {new Date(suite.updatedAt).toLocaleString()}
          </p>
        </div>
        <button
          onClick={handleLoad}
          className="shrink-0 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-neutral-300 transition-colors duration-150 hover:border-cyan-300/30 hover:text-cyan-100"
        >
          Load into Execution
        </button>
      </div>

      {regressions.length > 0 && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/[0.07] p-3">
          <p className="text-xs font-medium text-red-300">
            {regressions.length} regression{regressions.length === 1 ? "" : "s"}: passed last run, failing now
          </p>
          <ul className="mt-1 flex flex-col gap-0.5">
            {regressions.map((r, i) => {
              const tc = suite.testCases.find((t) => t.id === r.testCaseId);
              return (
                <li key={i} className="text-xs text-red-200/80">
                  {tc?.name ?? r.testCaseId} &middot; {r.gatewayName} &middot; <span className="font-mono">{r.modelId}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {runs === null ? (
        <div className="animate-shimmer h-2 w-[30%] rounded-full" />
      ) : runs.length === 0 ? (
        <p className="text-xs text-neutral-500">No runs recorded for this suite yet -- run it from Execution.</p>
      ) : (
        <div className="flex flex-col gap-1.5">
          <p className="text-[10px] uppercase tracking-wide text-neutral-600">Run history</p>
          {runs.map((run) => {
            const total = run.passCount + run.failCount;
            const pct = total > 0 ? Math.round((run.passCount / total) * 100) : 0;
            return (
              <div key={run.id} className="flex items-center gap-3 rounded-md border border-white/5 px-3 py-1.5 text-xs">
                <span className={pct === 100 ? "text-emerald-300" : pct >= 50 ? "text-amber-300" : "text-red-300"}>
                  {run.passCount}/{total} passed ({pct}%)
                </span>
                <span className="ml-auto text-neutral-600">{new Date(run.createdAt).toLocaleString()}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function BenchmarksHistoryPage() {
  const [suites, setSuites] = useState<BenchSuite[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  function reload() {
    fetch("/api/bench-suites")
      .then((res) => res.json())
      .then((data: BenchSuite[]) => {
        setSuites(data);
        if (data.length > 0 && !selectedId) setSelectedId(data[0].id);
      });
  }

  // Mount-only fetch -- reload() reads selectedId just to seed the initial selection,
  // not to react to it (re-running on every click would refetch the whole suite list).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(reload, []);

  if (suites === null) {
    return <div className="animate-shimmer h-3 w-[40%] rounded-full" />;
  }

  if (suites.length === 0) {
    return (
      <p className="text-neutral-400">
        No saved suites yet. From the Execution tab, click &quot;Save as suite…&quot; to start tracking pass/fail over time.
      </p>
    );
  }

  const selected = suites.find((s) => s.id === selectedId) ?? suites[0];

  return (
    <div className="flex gap-6">
      <div className="flex w-56 shrink-0 flex-col gap-1.5">
        {suites.map((s) => (
          <button
            key={s.id}
            onClick={() => setSelectedId(s.id)}
            className={`rounded-lg border px-3 py-2 text-left text-sm transition-colors duration-150 ${
              s.id === selected.id
                ? "border-cyan-300/30 bg-cyan-300/10 text-cyan-100"
                : "border-white/10 text-neutral-300 hover:border-white/20 hover:bg-white/[0.04]"
            }`}
          >
            {s.name}
          </button>
        ))}
      </div>
      <div className="min-w-0 flex-1">
        <SuiteDetail key={selected.id} suite={selected} onLoaded={reload} />
      </div>
    </div>
  );
}
