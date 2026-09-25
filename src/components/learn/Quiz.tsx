"use client";

import { useState } from "react";
import type { QuizQuestion } from "@/lib/learn/types";

function QuestionCard({
  q,
  index,
  selected,
  onSelect,
}: {
  q: QuizQuestion;
  index: number;
  selected: number | null;
  onSelect: (i: number) => void;
}) {
  const answered = selected !== null;
  const correct = selected === q.correctIndex;

  return (
    <div className="glass-panel rounded-xl p-4">
      <p className="mb-3 text-sm font-medium text-neutral-100">
        <span className="mr-1.5 text-neutral-500">Q{index + 1}.</span>
        {q.question}
      </p>
      <div className="flex flex-col gap-1.5">
        {q.options.map((opt, i) => {
          const isCorrectOpt = i === q.correctIndex;
          const isChosen = i === selected;
          let stateClass = "border-white/10 text-neutral-300 hover:border-white/20 hover:bg-white/[0.04]";
          if (answered) {
            if (isCorrectOpt) {
              stateClass = "border-emerald-400/40 bg-emerald-400/[0.08] text-emerald-100";
            } else if (isChosen) {
              stateClass = "border-red-400/40 bg-red-400/[0.08] text-red-100";
            } else {
              stateClass = "border-white/5 text-neutral-500";
            }
          }
          return (
            <button
              key={i}
              type="button"
              disabled={answered}
              onClick={() => onSelect(i)}
              className={`flex items-center gap-2.5 rounded-lg border px-3 py-2 text-left text-sm transition-colors duration-150 disabled:cursor-default ${stateClass}`}
            >
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[0.65rem] font-semibold ${
                  answered && isCorrectOpt
                    ? "border-emerald-400/50 text-emerald-200"
                    : answered && isChosen
                      ? "border-red-400/50 text-red-200"
                      : "border-white/15 text-neutral-500"
                }`}
              >
                {String.fromCharCode(65 + i)}
              </span>
              {opt}
            </button>
          );
        })}
      </div>
      {answered && (
        <div className={`mt-3 rounded-lg px-3 py-2.5 text-xs leading-relaxed ${correct ? "bg-emerald-400/[0.06] text-emerald-200" : "bg-amber-400/[0.06] text-amber-100"}`}>
          <span className="font-semibold">{correct ? "Correct. " : "Not quite. "}</span>
          {q.explanation}
        </div>
      )}
    </div>
  );
}

function scoreMessage(correct: number, total: number): string {
  const pct = total > 0 ? correct / total : 0;
  if (pct === 1) return "Perfect score -- this one's locked in.";
  if (pct >= 0.7) return "Solid grasp. Worth a quick look back at whichever you missed.";
  if (pct >= 0.4) return "Getting there -- a re-read of the content above would help.";
  return "Might be worth revisiting the content above before moving on.";
}

export function Quiz({ questions, title }: { questions: QuizQuestion[]; title?: string }) {
  const [answers, setAnswers] = useState<Record<number, number>>({});

  if (questions.length === 0) return null;

  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === questions.length;
  const correctCount = questions.reduce((sum, q, i) => sum + (answers[i] === q.correctIndex ? 1 : 0), 0);

  return (
    <div className="flex flex-col gap-4">
      <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-neutral-400">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-4 w-4 text-cyan-300">
          <path d="M5.5 6a2.5 2.5 0 1 1 3.5 2.3c-.6.25-1 .8-1 1.45V10.2" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="8" cy="12.6" r="0.15" fill="currentColor" stroke="none" />
        </svg>
        {title ?? "Check your understanding"}
      </h2>
      <div className="flex flex-col gap-3">
        {questions.map((q, i) => (
          <QuestionCard
            key={i}
            q={q}
            index={i}
            selected={answers[i] ?? null}
            onSelect={(sel) => setAnswers((prev) => ({ ...prev, [i]: sel }))}
          />
        ))}
      </div>
      {allAnswered && (
        <div className="glass-panel flex flex-col items-center gap-1 rounded-xl p-5 text-center">
          <p className="text-2xl font-semibold tracking-tight text-neutral-50">
            {correctCount}/{questions.length}
          </p>
          <p className="text-sm text-neutral-400">{scoreMessage(correctCount, questions.length)}</p>
        </div>
      )}
    </div>
  );
}
