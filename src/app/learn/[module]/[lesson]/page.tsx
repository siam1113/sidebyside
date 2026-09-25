"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { getAdjacentLessons, getModule } from "@/lib/learn/content";
import { lessonKey, useLearnProgress } from "@/lib/learn/useLearnProgress";
import { LessonBlocks } from "@/components/learn/LessonBlocks";
import { Quiz } from "@/components/learn/Quiz";

function CheckIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3.5 w-3.5">
      <path d="M3.5 8.5l3 3 6-7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function LearnLessonPage() {
  const params = useParams<{ module: string; lesson: string }>();
  const moduleSlug = params.module;
  const lessonSlug = params.lesson;
  const mod = getModule(moduleSlug);
  const lesson = mod?.lessons.find((l) => l.slug === lessonSlug);
  const { isComplete, toggleComplete } = useLearnProgress();

  if (!mod || !lesson) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-neutral-400">That lesson doesn&apos;t exist.</p>
        <Link href="/learn" className="w-fit text-sm font-medium text-cyan-200 hover:text-cyan-100">
          &larr; Back to Learn
        </Link>
      </div>
    );
  }

  const key = lessonKey(mod.slug, lesson.slug);
  const done = isComplete(key);
  const { prev, next } = getAdjacentLessons(mod.slug, lesson.slug);

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
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-neutral-50">{lesson.title}</h1>
            <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-neutral-400">{lesson.summary}</p>
          </div>
          <span className="shrink-0 rounded-full border border-white/10 px-2.5 py-1 text-xs text-neutral-500">
            {lesson.minutes} min
          </span>
        </div>
      </div>

      <LessonBlocks blocks={lesson.blocks} />

      {lesson.quiz.length > 0 && <Quiz questions={lesson.quiz} />}

      <button
        type="button"
        onClick={() => toggleComplete(key)}
        className={`flex w-fit items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors duration-150 ${
          done
            ? "border border-emerald-400/30 bg-emerald-400/10 text-emerald-200 hover:bg-emerald-400/15"
            : "btn-cta"
        }`}
      >
        {done && <CheckIcon />}
        {done ? "Marked complete" : "Mark lesson complete"}
      </button>

      <div className="flex items-center justify-between gap-3 border-t border-white/5 pt-6">
        {prev ? (
          <Link
            href={`/learn/${prev.module.slug}/${prev.lesson.slug}`}
            className="glass-panel glass-panel-hover flex max-w-[48%] flex-col gap-0.5 rounded-lg px-4 py-2.5 text-left"
          >
            <span className="flex items-center gap-1 text-xs text-neutral-500">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-3 w-3">
                <path d="M13 8H3.5M7 3.5 2.5 8 7 12.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Previous
            </span>
            <span className="truncate text-sm font-medium text-neutral-200">{prev.lesson.title}</span>
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link
            href={`/learn/${next.module.slug}/${next.lesson.slug}`}
            className="glass-panel glass-panel-hover ml-auto flex max-w-[48%] flex-col items-end gap-0.5 rounded-lg px-4 py-2.5 text-right"
          >
            <span className="flex items-center gap-1 text-xs text-neutral-500">
              Next
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-3 w-3">
                <path d="M3 8h9.5M9 4l4.5 4L9 12" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <span className="truncate text-sm font-medium text-neutral-200">{next.lesson.title}</span>
          </Link>
        ) : (
          <Link
            href="/learn"
            className="btn-cta ml-auto flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-semibold"
          >
            Finish course
          </Link>
        )}
      </div>
    </div>
  );
}
