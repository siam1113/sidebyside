"use client";

import { useState } from "react";
import { toFullJson } from "@/lib/gateways/snippets";
import { CopyButton } from "../playground/CopyButton";
import { cellKey, type AttemptOutcome, type CellState, type RunTarget, type TestCase } from "./types";

function AttemptDetail({ attempt, index }: { attempt: AttemptOutcome; index: number }) {
  return (
    <div className="rounded-md border border-white/5 bg-black/20 p-2">
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="font-mono text-[10px] uppercase tracking-wide text-neutral-600">Run {index + 1}</span>
        {attempt.kind === "graded" && <CopyButton text={toFullJson(attempt.run)} />}
      </div>
      {attempt.kind === "run-error" ? (
        <p className="text-[11px] text-red-300">{attempt.message}</p>
      ) : (
        <>
          <p className="text-[11px] text-neutral-400">
            {attempt.grade.status === "graded" ? attempt.grade.detail : attempt.grade.message}{" "}
            <span className="text-neutral-600">· {attempt.run.latencyMs}ms</span>
          </p>
          <pre className="mt-1.5 max-h-40 overflow-auto whitespace-pre-wrap break-words rounded border border-white/5 bg-black/40 p-1.5 font-mono text-[10px] leading-relaxed text-neutral-300">
            {toFullJson(attempt.run)}
          </pre>
        </>
      )}
    </div>
  );
}

function aggregate(attempts: AttemptOutcome[]) {
  let passed = 0;
  let graded = 0;
  let errored = 0;
  let latencySum = 0;
  let latencyCount = 0;
  for (const a of attempts) {
    if (a.kind === "run-error") {
      errored += 1;
      continue;
    }
    latencySum += a.run.latencyMs;
    latencyCount += 1;
    if (a.grade.status === "graded") {
      graded += 1;
      if (a.grade.pass) passed += 1;
    } else {
      errored += 1;
    }
  }
  const avgLatency = latencyCount > 0 ? Math.round(latencySum / latencyCount) : null;
  return { passed, graded, errored, avgLatency };
}

function BenchCell({ state }: { state: CellState }) {
  const [expanded, setExpanded] = useState(false);

  if (state.status === "idle") {
    return <span className="text-xs text-neutral-600">—</span>;
  }

  if (state.status === "running") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-cyan-200">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-300" />
        Running
      </span>
    );
  }

  const { attempts } = state;
  const { passed, graded, errored, avgLatency } = aggregate(attempts);

  const badge =
    attempts.length === 1 && graded === 1 ? (
      <span
        className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${
          passed === 1
            ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
            : "border-red-400/20 bg-red-400/10 text-red-300"
        }`}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${passed === 1 ? "bg-emerald-400" : "bg-red-400"}`} />
        {passed === 1 ? "Pass" : "Fail"}
      </span>
    ) : graded > 0 ? (
      <span className="inline-flex items-center gap-1 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-2 py-0.5 text-[11px] font-medium text-cyan-200">
        {passed}/{graded} passed
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/20 bg-amber-400/10 px-2 py-0.5 text-[11px] font-medium text-amber-300">
        No graded runs
      </span>
    );

  return (
    <div className="flex flex-col gap-1.5">
      <button type="button" onClick={() => setExpanded((v) => !v)} className="flex flex-wrap items-center gap-2 text-left">
        {badge}
        {avgLatency != null && <span className="font-mono text-[11px] text-neutral-500">{avgLatency}ms avg</span>}
        {errored > 0 && <span className="text-[11px] text-red-400">{errored} errored</span>}
      </button>

      {expanded && (
        <div className="mt-1 flex flex-col gap-1.5">
          {attempts.map((a, i) => (
            <AttemptDetail key={i} attempt={a} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}

function passRate(testCases: TestCase[], targetKeyStr: string, cells: Record<string, CellState>): string {
  let graded = 0;
  let passed = 0;
  for (const tc of testCases) {
    const state = cells[cellKey(tc.id, targetKeyStr)];
    if (state?.status !== "done") continue;
    const agg = aggregate(state.attempts);
    graded += agg.graded;
    passed += agg.passed;
  }
  if (graded === 0) return "—";
  return `${passed}/${graded} passed`;
}

interface Props {
  testCases: TestCase[];
  targets: RunTarget[];
  cells: Record<string, CellState>;
}

/** Benchmarks tab's results grid: rows are test cases, columns are (gateway, model, variant) targets. */
export function ResultsMatrix({ testCases, targets, cells }: Props) {
  if (testCases.length === 0 || targets.length === 0) return null;

  return (
    <div className="glass-panel animate-fade-up flex flex-col gap-4 rounded-xl p-4" style={{ animationDelay: "180ms" }}>
      <div className="flex items-center gap-1.5 text-sm font-medium text-neutral-200">
        Results
        <span className="font-normal text-neutral-500">
          ({testCases.length} test case{testCases.length === 1 ? "" : "s"} x {targets.length} target
          {targets.length === 1 ? "" : "s"})
        </span>
      </div>

      <div className="overflow-x-auto rounded-lg border border-white/5">
        <table className="w-full min-w-[480px] border-collapse text-sm">
          <thead>
            <tr className="bg-white/[0.03]">
              <th className="sticky left-0 z-10 border-b border-r border-white/10 bg-[var(--surface-1)] px-3 py-2 text-left text-[11px] font-medium uppercase tracking-wide text-neutral-500">
                Test case
              </th>
              {targets.map((t) => (
                <th key={t.key} className="min-w-[200px] border-b border-white/10 px-3 py-2 text-left text-xs font-medium text-neutral-200">
                  <div className="flex flex-col gap-0.5">
                    <span>{t.gateway.name}</span>
                    <span className="font-mono text-[10px] font-normal text-neutral-500">{t.modelId}</span>
                    {t.variant.label && (
                      <span className="w-fit truncate rounded border border-violet-400/20 bg-violet-400/10 px-1 font-mono text-[10px] font-normal text-violet-200">
                        {t.variant.label}
                      </span>
                    )}
                    <span className="font-mono text-[10px] font-normal text-neutral-600">{passRate(testCases, t.key, cells)}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {testCases.map((tc) => (
              <tr key={tc.id} className="odd:bg-white/[0.015]">
                <th className="sticky left-0 z-10 max-w-[180px] border-b border-r border-white/10 bg-[var(--surface-1)] px-3 py-2 text-left align-top text-xs font-medium text-neutral-300">
                  <p className="truncate">{tc.name || "(untitled)"}</p>
                  <p className="mt-0.5 truncate font-mono text-[10px] font-normal text-neutral-600">{tc.prompt}</p>
                </th>
                {targets.map((t) => (
                  <td key={t.key} className="max-w-xs border-b border-white/5 px-3 py-2 align-top">
                    <BenchCell state={cells[cellKey(tc.id, t.key)] ?? { status: "idle" }} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
