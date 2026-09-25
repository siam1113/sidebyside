"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { getModule } from "@/lib/learn/content";
import { lessonKey, useLearnProgress } from "@/lib/learn/useLearnProgress";
import { ProgressBar } from "@/components/learn/ProgressBar";

function CheckIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3.5 w-3.5">
      <path d="M3.5 8.5l3 3 6-7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function LearnModulePage() {
  const params = useParams<{ module: string }>();
  const moduleSlug = params.module;
  const mod = getModule(moduleSlug);
  const { completed } = useLearnProgress();

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

  const done = mod.lessons.filter((l) => completed.has(lessonKey(mod.slug, l.slug))).length;

  return (
    <div className="flex flex-col gap-8">
      <div className="animate-fade-up flex flex-col gap-3">
        <Link href="/learn" className="flex w-fit items-center gap-1 text-xs font-medium text-neutral-500 transition-colors duration-150 hover:text-cyan-200">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-3 w-3">
            <path d="M13 8H3.5M7 3.5 2.5 8 7 12.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Learn
        </Link>
        <p className="text-xs font-medium uppercase tracking-wide text-violet-300/80">{mod.tagline}</p>
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-50">{mod.title}</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-neutral-400">{mod.description}</p>
        <div className="max-w-xs pt-1">
          <ProgressBar done={done} total={mod.lessons.length} />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {mod.lessons.map((lesson, i) => {
          const isDone = completed.has(lessonKey(mod.slug, lesson.slug));
          return (
            <Link
              key={lesson.slug}
              href={`/learn/${mod.slug}/${lesson.slug}`}
              style={{ animationDelay: `${100 + i * 60}ms` }}
              className="animate-fade-up glass-panel glass-panel-hover flex items-center gap-4 rounded-xl p-4"
            >
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${
                  isDone ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-300" : "border-white/10 text-neutral-500"
                }`}
              >
                {isDone ? <CheckIcon /> : i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="font-medium text-neutral-100">{lesson.title}</h2>
                <p className="truncate text-sm text-neutral-500">{lesson.summary}</p>
              </div>
              <span className="shrink-0 text-xs text-neutral-500">{lesson.minutes} min</span>
            </Link>
          );
        })}
      </div>

      {mod.test.length > 0 && (
        <Link
          href={`/learn/${mod.slug}/test`}
          className="glass-panel glass-panel-hover group flex items-center gap-4 rounded-xl border-l-2 border-l-violet-300/50 p-4"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-violet-300">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-4 w-4">
              <path d="M5.5 6a2.5 2.5 0 1 1 3.5 2.3c-.6.25-1 .8-1 1.45V10.2" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="8" cy="12.6" r="0.15" fill="currentColor" stroke="none" />
            </svg>
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="font-medium text-neutral-100">Module test</h2>
            <p className="truncate text-sm text-neutral-500">{mod.test.length} questions covering everything in {mod.title}</p>
          </div>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-3.5 w-3.5 shrink-0 text-neutral-500 transition-transform duration-200 group-hover:translate-x-0.5">
            <path d="M3 8h9.5M9 4l4.5 4L9 12" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      )}
    </div>
  );
}
