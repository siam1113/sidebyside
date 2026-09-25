"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { FINAL_EXAM, LEARN_MODULES, getTotalLessonCount } from "@/lib/learn/content";
import { lessonKey, useLearnProgress } from "@/lib/learn/useLearnProgress";
import { ProgressBar } from "@/components/learn/ProgressBar";

const MODULE_GLYPHS: Record<string, ReactNode> = {
  fundamentals: <path d="M12 3v3M12 18v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M3 12h3M18 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" strokeLinecap="round" />,
  gateways: (
    <>
      <circle cx="6" cy="12" r="2.5" />
      <circle cx="18" cy="6" r="2.5" />
      <circle cx="18" cy="18" r="2.5" />
      <path d="M8.3 11l7.4-4M8.3 13l7.4 4" strokeLinecap="round" />
    </>
  ),
  evaluating: (
    <>
      <path d="M12 3v3M6 6h12M9 6l-3.5 7a3 3 0 0 0 5.8.3M15 6l3.5 7a3 3 0 0 1-5.8.3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 21h8M12 17v4" strokeLinecap="round" />
    </>
  ),
  "tools-and-agents": (
    <>
      <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
      <path d="M7 9l3 3-3 3M13 15h4" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  "putting-it-together": (
    <>
      <path d="M4 6l6-2 6 2 4-1.5v13L16 19l-6-2-6 2V6Z" strokeLinejoin="round" strokeLinecap="round" />
      <path d="M10 4.3v13M16 6v13" strokeLinecap="round" />
    </>
  ),
};

export default function LearnPage() {
  const { completed } = useLearnProgress();
  const total = getTotalLessonCount();
  const done = completed.size;

  return (
    <div className="flex flex-col gap-10">
      <div className="animate-fade-up flex flex-col gap-4" style={{ animationDelay: "40ms" }}>
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-medium tracking-wide text-cyan-200/90">
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_8px_rgba(103,232,249,0.8)]" />
          No prior AI knowledge required
        </span>
        <h1 className="max-w-2xl text-[clamp(2rem,4.5vw,3.25rem)] font-semibold leading-[1.08] tracking-tight text-neutral-50">
          Learn the ideas{" "}
          <span className="bg-gradient-to-br from-cyan-300 to-violet-400 bg-clip-text text-transparent">behind every tab</span>
        </h1>
        <p className="max-w-xl text-base leading-relaxed text-neutral-400">
          Short lessons, plain-language analogies, and a quick check after each one -- covering every concept and term
          you&apos;ll run into while using SideBySide, from &ldquo;what is a token&rdquo; to &ldquo;what is MCP.&rdquo;
        </p>
        <div className="max-w-sm pt-1">
          <ProgressBar done={done} total={total} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {LEARN_MODULES.map((module, i) => {
          const moduleDone = module.lessons.filter((l) => completed.has(lessonKey(module.slug, l.slug))).length;
          return (
            <Link
              key={module.slug}
              href={`/learn/${module.slug}`}
              style={{ animationDelay: `${140 + i * 90}ms` }}
              className="animate-fade-up glass-panel glass-panel-hover group relative flex flex-col gap-4 overflow-hidden rounded-xl p-5 hover:-translate-y-1 hover:shadow-[0_0_0_1px_rgba(103,232,249,0.15),0_20px_40px_-20px_rgba(103,232,249,0.25)]"
            >
              <span
                aria-hidden
                className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-gradient-to-br from-cyan-400/20 to-violet-400/10 opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100"
              />
              <div className="flex items-start justify-between gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-cyan-200 transition-colors duration-200 group-hover:border-cyan-300/30 group-hover:text-cyan-100">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-4.5 w-4.5">
                    {MODULE_GLYPHS[module.slug]}
                  </svg>
                </span>
                <span className="shrink-0 text-xs font-medium text-neutral-500">
                  {moduleDone}/{module.lessons.length} lessons
                </span>
              </div>
              <div className="flex flex-col gap-1.5">
                <p className="text-xs font-medium uppercase tracking-wide text-violet-300/80">{module.tagline}</p>
                <h2 className="font-medium tracking-tight text-neutral-100">{module.title}</h2>
                <p className="text-sm leading-relaxed text-neutral-400">{module.description}</p>
              </div>
              <ProgressBar done={moduleDone} total={module.lessons.length} className="mt-auto" />
            </Link>
          );
        })}
      </div>

      {FINAL_EXAM.questions.length > 0 && (
        <Link
          href="/learn/final-exam"
          className="animate-fade-up glass-panel glass-panel-hover group relative flex items-center gap-4 overflow-hidden rounded-xl border-l-2 border-l-cyan-300/50 p-5"
          style={{ animationDelay: `${140 + LEARN_MODULES.length * 90}ms` }}
        >
          <span
            aria-hidden
            className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-gradient-to-br from-cyan-400/20 to-violet-400/10 opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100"
          />
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-cyan-200">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-5 w-5">
              <path d="M12 3 3 7.5 12 12l9-4.5L12 3Z" strokeLinejoin="round" strokeLinecap="round" />
              <path d="M6 10.5V16c0 1.4 2.7 3 6 3s6-1.6 6-3v-5.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium uppercase tracking-wide text-cyan-200/80">Whole-course review</p>
            <h2 className="font-medium tracking-tight text-neutral-100">{FINAL_EXAM.title}</h2>
            <p className="text-sm leading-relaxed text-neutral-400">{FINAL_EXAM.questions.length} questions spanning every module -- best taken after finishing all five.</p>
          </div>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-3.5 w-3.5 shrink-0 text-neutral-500 transition-transform duration-200 group-hover:translate-x-0.5">
            <path d="M3 8h9.5M9 4l4.5 4L9 12" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      )}
    </div>
  );
}
