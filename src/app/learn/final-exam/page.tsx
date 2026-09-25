"use client";

import Link from "next/link";
import { FINAL_EXAM } from "@/lib/learn/content";
import { Quiz } from "@/components/learn/Quiz";

export default function FinalExamPage() {
  return (
    <div className="flex flex-col gap-8 pb-4">
      <div className="animate-fade-up flex flex-col gap-3">
        <Link href="/learn" className="flex w-fit items-center gap-1 text-xs font-medium text-neutral-500 transition-colors duration-150 hover:text-cyan-200">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-3 w-3">
            <path d="M13 8H3.5M7 3.5 2.5 8 7 12.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Learn
        </Link>
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-medium tracking-wide text-cyan-200/90">
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_8px_rgba(103,232,249,0.8)]" />
          Whole-course review
        </span>
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-50">{FINAL_EXAM.title}</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-neutral-400">{FINAL_EXAM.description}</p>
      </div>

      {FINAL_EXAM.questions.length > 0 ? (
        <Quiz questions={FINAL_EXAM.questions} title="Final exam" />
      ) : (
        <p className="rounded-lg border border-dashed border-white/10 p-6 text-center text-sm text-neutral-500">
          The final exam hasn&apos;t been written yet.
        </p>
      )}

      <Link
        href="/learn"
        className="glass-panel glass-panel-hover flex w-fit items-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-medium text-neutral-300"
      >
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-3 w-3">
          <path d="M13 8H3.5M7 3.5 2.5 8 7 12.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Back to Learn
      </Link>
    </div>
  );
}
