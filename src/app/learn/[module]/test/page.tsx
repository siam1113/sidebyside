"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { getModule } from "@/lib/learn/content";
import { Quiz } from "@/components/learn/Quiz";

export default function ModuleTestPage() {
  const params = useParams<{ module: string }>();
  const mod = getModule(params.module);

  if (!mod) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-neutral-400">That module doesn&apos;t exist.</p>
        <Link href="/learn" className="w-fit text-sm font-medium text-cyan-200 hover:text-cyan-100">
          &larr; Back to Learn
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 pb-4">
      <div className="animate-fade-up flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-1 text-xs font-medium text-neutral-500">
          <Link href="/learn" className="transition-colors duration-150 hover:text-cyan-200">
            Learn
          </Link>
          <span>/</span>
          <Link href={`/learn/${mod.slug}`} className="transition-colors duration-150 hover:text-cyan-200">
            {mod.title}
          </Link>
        </div>
        <p className="text-xs font-medium uppercase tracking-wide text-violet-300/80">Module test</p>
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-50">{mod.title}</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-neutral-400">
          {mod.test.length} questions pulling together everything from this module&apos;s lessons -- answer each one to see
          how it lands.
        </p>
      </div>

      {mod.test.length > 0 ? (
        <Quiz questions={mod.test} title="Module test" />
      ) : (
        <p className="rounded-lg border border-dashed border-white/10 p-6 text-center text-sm text-neutral-500">
          This module test hasn&apos;t been written yet.
        </p>
      )}

      <Link
        href={`/learn/${mod.slug}`}
        className="glass-panel glass-panel-hover flex w-fit items-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-medium text-neutral-300"
      >
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-3 w-3">
          <path d="M13 8H3.5M7 3.5 2.5 8 7 12.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Back to {mod.title}
      </Link>
    </div>
  );
}
