"use client";

import { useState } from "react";
import Link from "next/link";
import { useBenchmarks } from "@/components/benchmarks/BenchmarksContext";
import { ResultsMatrix } from "@/components/benchmarks/ResultsMatrix";
import { RunConfigModal } from "@/components/benchmarks/RunConfigModal";
import { EmptyResultsState } from "@/components/playground/EmptyResultsState";

function SuiteBar() {
  const { currentSuiteId, currentSuiteName, saving, saveAsNewSuite, updateCurrentSuite, clearSuite } = useBenchmarks();
  const [naming, setNaming] = useState(false);
  const [name, setName] = useState("");

  if (naming) {
    return (
      <div className="flex items-center gap-2">
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Suite name"
          className="rounded-md border border-cyan-300/30 bg-black/30 px-2 py-1 text-xs text-neutral-100 focus:outline-none"
        />
        <button
          onClick={async () => {
            if (!name.trim()) return;
            await saveAsNewSuite(name.trim());
            setNaming(false);
            setName("");
          }}
          className="text-xs text-cyan-200 hover:text-cyan-100"
        >
          Save
        </button>
        <button onClick={() => setNaming(false)} className="text-xs text-neutral-500 hover:text-neutral-300">
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-xs text-neutral-500">
      {currentSuiteId ? (
        <>
          <span>
            Suite: <span className="text-neutral-300">{currentSuiteName}</span>
          </span>
          <button onClick={updateCurrentSuite} disabled={saving} className="text-cyan-200 hover:text-cyan-100 disabled:opacity-50">
            {saving ? "Saving..." : "Update"}
          </button>
          <button onClick={clearSuite} className="text-neutral-500 hover:text-neutral-300">
            Unlink
          </button>
        </>
      ) : (
        <button onClick={() => setNaming(true)} className="text-cyan-200 hover:text-cyan-100">
          Save as suite…
        </button>
      )}
      <Link href="/benchmarks/history" className="text-neutral-500 hover:text-neutral-300">
        History
      </Link>
    </div>
  );
}

export default function BenchmarksExecutionPage() {
  const { loading, targetGateways, testCases, runTargets, cells, running, hasRunOnce, buildError } = useBenchmarks();
  const [runConfigOpen, setRunConfigOpen] = useState(false);

  if (!loading && targetGateways.length === 0) {
    return (
      <p className="text-neutral-400">
        No runnable gateways configured yet.{" "}
        <Link href="/settings" className="text-cyan-200 underline decoration-cyan-200/30 underline-offset-2 hover:text-cyan-100">
          Add one in Settings
        </Link>
        .
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="animate-fade-up flex items-center justify-between gap-3">
        <div className="flex flex-col gap-1.5">
          <p className="text-sm text-neutral-400">
            {hasRunOnce ? "Adjust and re-run whenever you like." : "Pick test cases, gateways, models, and run options."}
          </p>
          <SuiteBar />
        </div>
        <div className="flex flex-col items-end gap-1">
          <button
            type="button"
            onClick={() => setRunConfigOpen(true)}
            disabled={loading}
            className="btn-cta shrink-0 rounded-lg px-5 py-2 text-sm font-semibold"
          >
            {running ? "Running..." : "Run tests"}
          </button>
          {buildError && <p className="text-xs text-red-400">{buildError}</p>}
        </div>
      </div>

      {hasRunOnce ? (
        <ResultsMatrix testCases={testCases} targets={runTargets} cells={cells} />
      ) : (
        <EmptyResultsState
          title="No benchmark runs yet"
          description="Hit Run tests to pick test cases, gateways, models, parameters, and variants, then see a pass/fail matrix."
        />
      )}

      <RunConfigModal open={runConfigOpen} onClose={() => setRunConfigOpen(false)} />
    </div>
  );
}
