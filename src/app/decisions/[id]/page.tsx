"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Markdown } from "@/components/playground/Markdown";
import type { Decision } from "@/lib/db/decisions";

export default function DecisionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [decision, setDecision] = useState<Decision | null | "loading">("loading");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/decisions/${id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((body) => {
        if (!cancelled) setDecision(body);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function handleDelete() {
    if (!window.confirm("Delete this decision? This can't be undone.")) return;
    setDeleting(true);
    await fetch(`/api/decisions/${id}`, { method: "DELETE" });
    router.push("/decisions");
  }

  if (decision === "loading") {
    return <div className="animate-shimmer h-3 w-[40%] rounded-full" />;
  }

  if (!decision) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-lg font-semibold tracking-tight text-neutral-50">Decision not found</h1>
        <Link href="/decisions" className="text-sm text-cyan-200 underline decoration-cyan-200/30 underline-offset-2 hover:text-cyan-100">
          Back to Decisions
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="animate-fade-up flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-50">{decision.title}</h1>
          <p className="mt-1 text-xs text-neutral-500">
            {new Date(decision.createdAt).toLocaleString()}
            {decision.updatedAt !== decision.createdAt && ` (updated ${new Date(decision.updatedAt).toLocaleString()})`}
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Link
            href="/decisions"
            className="rounded-lg border border-white/10 px-3 py-1.5 text-sm text-neutral-300 transition-colors duration-150 hover:border-white/20 hover:bg-white/[0.04]"
          >
            Back
          </Link>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="rounded-lg border border-red-500/20 px-3 py-1.5 text-sm text-red-300 transition-colors duration-150 hover:bg-red-500/10 disabled:opacity-50"
          >
            Delete
          </button>
        </div>
      </div>

      {(decision.chosenGatewayName || decision.chosenModelId) && (
        <div className="glass-panel animate-fade-up rounded-xl p-4 text-sm text-neutral-300">
          Chose <span className="font-medium text-neutral-100">{decision.chosenGatewayName}</span>
          {decision.chosenModelId && <span className="font-mono text-neutral-400"> &middot; {decision.chosenModelId}</span>}
        </div>
      )}

      {decision.rationale && (
        <div className="glass-panel animate-fade-up rounded-xl p-5">
          <p className="mb-2 text-[10px] uppercase tracking-wide text-neutral-600">Rationale</p>
          <Markdown text={decision.rationale} />
        </div>
      )}

      {decision.alternatives && decision.alternatives.length > 0 && (
        <div className="glass-panel animate-fade-up rounded-xl p-5">
          <p className="mb-2 text-[10px] uppercase tracking-wide text-neutral-600">Alternatives considered</p>
          <ul className="flex flex-col gap-1 text-sm text-neutral-300">
            {decision.alternatives.map((a, i) => (
              <li key={i}>&middot; {a}</li>
            ))}
          </ul>
        </div>
      )}

      {decision.linkedRunIds && decision.linkedRunIds.length > 0 && (
        <div className="glass-panel animate-fade-up rounded-xl p-5">
          <p className="mb-2 text-[10px] uppercase tracking-wide text-neutral-600">Evidence</p>
          <div className="flex flex-col gap-1">
            {decision.linkedRunIds.map((runId) => (
              <Link
                key={runId}
                href={`/insights/history/${runId}`}
                className="text-sm text-cyan-200 underline decoration-cyan-200/30 underline-offset-2 hover:text-cyan-100"
              >
                View run {runId.slice(0, 8)}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
