// Content for the Learn tab. Pure data -- no client-only APIs here, so this
// module can be imported from server or client components alike.
//
// Per-module content lives in ./modules/*.ts (one file per module, so they
// can be edited/expanded independently without touching a single giant
// file). This file just assembles them and exposes lookup helpers.

import type { FinalExam, LearnModule, Lesson, QuizQuestion } from "./types";
import fundamentals from "./modules/fundamentals";
import gateways from "./modules/gateways";
import evaluating from "./modules/evaluating";
import toolsAndAgents from "./modules/tools-and-agents";
import puttingItTogether from "./modules/putting-it-together";
import { FINAL_EXAM as finalExamData } from "./finalExam";

export type { QuizQuestion, LessonBlock, Lesson, LearnModule, FinalExam } from "./types";

export const LEARN_MODULES: LearnModule[] = [fundamentals, gateways, evaluating, toolsAndAgents, puttingItTogether];

export const FINAL_EXAM: FinalExam = finalExamData;

export function getModule(slug: string): LearnModule | undefined {
  return LEARN_MODULES.find((m) => m.slug === slug);
}

export function getLesson(moduleSlug: string, lessonSlug: string): Lesson | undefined {
  return getModule(moduleSlug)?.lessons.find((l) => l.slug === lessonSlug);
}

export function getModuleTest(moduleSlug: string): QuizQuestion[] {
  return getModule(moduleSlug)?.test ?? [];
}

export type FlatLesson = { module: LearnModule; lesson: Lesson; index: number };

export function getFlatLessons(): FlatLesson[] {
  const flat: FlatLesson[] = [];
  let index = 0;
  for (const mod of LEARN_MODULES) {
    for (const lesson of mod.lessons) {
      flat.push({ module: mod, lesson, index });
      index += 1;
    }
  }
  return flat;
}

export function getAdjacentLessons(moduleSlug: string, lessonSlug: string) {
  const flat = getFlatLessons();
  const i = flat.findIndex((f) => f.module.slug === moduleSlug && f.lesson.slug === lessonSlug);
  return {
    prev: i > 0 ? flat[i - 1] : undefined,
    next: i >= 0 && i < flat.length - 1 ? flat[i + 1] : undefined,
    current: i >= 0 ? flat[i] : undefined,
  };
}

export function getTotalLessonCount(): number {
  return LEARN_MODULES.reduce((sum, m) => sum + m.lessons.length, 0);
}
