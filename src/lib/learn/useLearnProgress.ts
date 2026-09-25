"use client";

import { useCallback, useSyncExternalStore } from "react";

const STORAGE_KEY = "sbs-learn-progress";
const EMPTY_SET: Set<string> = new Set();
const listeners = new Set<() => void>();
let cache: Set<string> | null = null;

function readCompleted(): Set<string> {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

function getSnapshot(): Set<string> {
  if (cache === null) cache = readCompleted();
  return cache;
}

function getServerSnapshot(): Set<string> {
  return EMPTY_SET;
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function commit(next: Set<string>) {
  cache = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
  } catch {
    // localStorage unavailable (private mode, etc.) -- progress just won't persist
  }
  listeners.forEach((listener) => listener());
}

/** lessonKey should be `${moduleSlug}/${lessonSlug}` so keys stay unique across modules. */
export function useLearnProgress() {
  const completed = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const isComplete = useCallback((key: string) => completed.has(key), [completed]);

  const markComplete = useCallback((key: string) => {
    const current = getSnapshot();
    if (current.has(key)) return;
    commit(new Set(current).add(key));
  }, []);

  const markIncomplete = useCallback((key: string) => {
    const current = getSnapshot();
    if (!current.has(key)) return;
    const next = new Set(current);
    next.delete(key);
    commit(next);
  }, []);

  const toggleComplete = useCallback(
    (key: string) => {
      if (completed.has(key)) markIncomplete(key);
      else markComplete(key);
    },
    [completed, markComplete, markIncomplete],
  );

  return { completed, isComplete, markComplete, markIncomplete, toggleComplete };
}

export function lessonKey(moduleSlug: string, lessonSlug: string): string {
  return `${moduleSlug}/${lessonSlug}`;
}
