import type { EvalAnswer } from "@/lib/gateways/types";

export function AnswerView({ questionKey, answer }: { questionKey: string; answer: EvalAnswer }) {
  return (
    <div className="rounded-lg border border-white/5 bg-black/20 p-2.5">
      <p className="mb-1.5 font-mono text-[11px] text-neutral-500">{questionKey}</p>
      {answer.type === "noul" && (
        <div className="flex items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-violet-400"
              style={{ width: `${Math.round(answer.noul * 100)}%` }}
            />
          </div>
          <span className="shrink-0 font-mono text-xs text-neutral-300">{(answer.noul * 100).toFixed(0)}%</span>
        </div>
      )}
      {answer.type === "choice" && (
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md border border-cyan-300/30 bg-cyan-300/10 px-2 py-0.5 text-xs font-medium text-cyan-100">
              {answer.choice}
            </span>
            {answer.confidence != null && (
              <span className="text-xs text-neutral-500">{(answer.confidence * 100).toFixed(0)}% confidence</span>
            )}
          </div>
          {answer.probabilities && (
            <div className="flex flex-wrap gap-x-2.5 gap-y-1 pt-0.5">
              {Object.entries(answer.probabilities).map(([k, v]) => (
                <span key={k} className="font-mono text-[10px] text-neutral-500">
                  {k}: {(v * 100).toFixed(0)}%
                </span>
              ))}
            </div>
          )}
        </div>
      )}
      {answer.type === "score" && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-lg font-semibold text-neutral-100">{answer.score}</span>
          {answer.legend?.[String(answer.score)] && (
            <span className="text-xs text-neutral-400">{answer.legend[String(answer.score)]}</span>
          )}
          {answer.confidence != null && (
            <span className="text-xs text-neutral-500">{(answer.confidence * 100).toFixed(0)}% confidence</span>
          )}
        </div>
      )}
    </div>
  );
}
