"use client";

import type { TestCase } from "./types";

function gradingSummary(tc: TestCase): string {
  if (tc.grading.kind === "assertion") {
    const modeLabel: Record<typeof tc.grading.mode, string> = {
      contains: "contains",
      "not-contains": "not contains",
      equals: "equals",
      regex: "matches",
    };
    return `Assertion · ${modeLabel[tc.grading.mode]} "${tc.grading.value || "..."}"`;
  }
  return `Judge · pass ≥ ${tc.grading.passThreshold}/5`;
}

function PencilIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-3.5 w-3.5">
      <path d="M11 2.5l2.5 2.5-8 8-3 .5.5-3 8-8Z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-3.5 w-3.5">
      <path d="M3 5h10M6.5 5V3.5h3V5M4.5 5l.5 8h6l.5-8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

interface Props {
  testCase: TestCase;
  index: number;
  onEdit: () => void;
  onRemove: () => void;
}

/** One row in the Test Cases list -- click anywhere to edit, or use the icon buttons directly. */
export function TestCaseListItem({ testCase, index, onEdit, onRemove }: Props) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onEdit}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onEdit();
        }
      }}
      className="group flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-white/10 bg-black/20 p-3 text-left transition-colors duration-150 hover:border-white/20 hover:bg-white/[0.03]"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-wide text-neutral-600">#{index + 1}</span>
          <p className="truncate text-sm font-medium text-neutral-100">{testCase.name || "(untitled)"}</p>
        </div>
        <p className="mt-0.5 truncate text-xs text-neutral-500">{testCase.prompt || "No prompt yet"}</p>
        <p className="mt-1 truncate font-mono text-[10px] text-neutral-600">{gradingSummary(testCase)}</p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          aria-label="Edit test case"
          className="rounded-md border border-white/10 p-1.5 text-neutral-500 transition-colors duration-150 hover:border-cyan-300/30 hover:text-cyan-200"
        >
          <PencilIcon />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          aria-label="Remove test case"
          className="rounded-md border border-white/10 p-1.5 text-neutral-500 transition-colors duration-150 hover:border-red-500/30 hover:text-red-300"
        >
          <TrashIcon />
        </button>
      </div>
    </div>
  );
}
