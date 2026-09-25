"use client";

import { useState } from "react";
import { useBenchmarks } from "@/components/benchmarks/BenchmarksContext";
import { TechniqueLibrary } from "@/components/benchmarks/TechniqueLibrary";
import { TestCaseEditModal } from "@/components/benchmarks/TestCaseEditModal";
import { TestCaseListItem } from "@/components/benchmarks/TestCaseListItem";

function BookIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-3.5 w-3.5">
      <path d="M2.5 3.5c1.5-.7 3.5-.7 5.5.3 2-1 4-1 5.5-.3v9c-1.5-.7-3.5-.7-5.5.3-2-1-4-1-5.5-.3v-9Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 3.8v9" strokeLinecap="round" />
    </svg>
  );
}

export default function BenchmarksTestCasesPage() {
  const {
    testCases,
    updateTestCase,
    addTestCase,
    removeTestCase,
    useTechnique,
    buildError,
    judgeGateways,
    selectedProtocols,
  } = useBenchmarks();
  const [techniqueLibraryOpen, setTechniqueLibraryOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  function handleAdd() {
    const id = addTestCase();
    setEditingId(id);
  }

  function handleRemove(id: string) {
    removeTestCase(id);
    if (editingId === id) setEditingId(null);
  }

  const editingTestCase = testCases.find((tc) => tc.id === editingId);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 text-sm font-medium text-neutral-200">
          Test cases
          <span className="font-normal text-neutral-500">({testCases.length})</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setTechniqueLibraryOpen(true)}
            className="flex items-center gap-1 rounded-md border border-white/10 px-2 py-1 text-xs font-medium text-neutral-300 transition-colors duration-150 hover:border-cyan-300/30 hover:bg-cyan-300/5 hover:text-cyan-100"
            title="Browse LLM testing techniques"
          >
            <BookIcon />
            Techniques
          </button>
          <button
            type="button"
            onClick={handleAdd}
            className="flex items-center gap-1 rounded-md border border-white/10 px-2 py-1 text-xs font-medium text-cyan-300 transition-colors duration-150 hover:border-cyan-300/30 hover:bg-cyan-300/5 hover:text-cyan-100"
          >
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-3 w-3 shrink-0">
              <path d="M8 3v10M3 8h10" strokeLinecap="round" />
            </svg>
            Add
          </button>
        </div>
      </div>

      {testCases.length === 0 ? (
        <p className="rounded-lg border border-dashed border-white/10 p-6 text-center text-sm text-neutral-500">
          No test cases yet. Click Add, or browse Techniques to start from a template.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {testCases.map((tc, i) => (
            <TestCaseListItem
              key={tc.id}
              testCase={tc}
              index={i}
              onEdit={() => setEditingId(tc.id)}
              onRemove={() => handleRemove(tc.id)}
            />
          ))}
        </div>
      )}
      {buildError && <p className="text-xs text-red-400">{buildError}</p>}

      <TestCaseEditModal
        open={editingId != null}
        testCase={editingTestCase}
        judgeGateways={judgeGateways}
        selectedProtocols={selectedProtocols}
        onChange={(patch) => editingId && updateTestCase(editingId, patch)}
        onClose={() => setEditingId(null)}
      />

      <TechniqueLibrary open={techniqueLibraryOpen} onClose={() => setTechniqueLibraryOpen(false)} onUse={useTechnique} />
    </div>
  );
}
