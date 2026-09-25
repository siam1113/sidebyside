"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Decision, DecisionInput } from "@/lib/db/decisions";
import type { GatewayConfig } from "@/lib/gateways/types";
import type { RunHistoryEntry } from "@/lib/db/runHistory";

const inputClass =
  "w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-600 transition-colors duration-150 focus:border-cyan-300/40 focus:outline-none focus:ring-2 focus:ring-cyan-300/15";
const labelClass = "block text-sm font-medium text-neutral-300 mb-1.5";

function NewDecisionForm({ onCreated, onCancel }: { onCreated: () => void; onCancel: () => void }) {
  const [gateways, setGateways] = useState<GatewayConfig[]>([]);
  const [recentRuns, setRecentRuns] = useState<RunHistoryEntry[]>([]);
  const [title, setTitle] = useState("");
  const [chosenGatewayId, setChosenGatewayId] = useState("");
  const [chosenModelId, setChosenModelId] = useState("");
  const [rationale, setRationale] = useState("");
  const [alternativesText, setAlternativesText] = useState("");
  const [linkedRunIds, setLinkedRunIds] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/gateways")
      .then((res) => res.json())
      .then(setGateways);
    fetch("/api/run-history?limit=20")
      .then((res) => res.json())
      .then((body) => setRecentRuns(body.entries ?? []));
  }, []);

  function toggleRun(id: string) {
    setLinkedRunIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function submit() {
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    setSubmitting(true);
    setError(null);
    const gateway = gateways.find((g) => g.id === chosenGatewayId);
    const input: DecisionInput = {
      title,
      chosenGatewayId: chosenGatewayId || undefined,
      chosenGatewayName: gateway?.name,
      chosenModelId: chosenModelId || undefined,
      rationale: rationale || undefined,
      alternatives: alternativesText
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean),
      linkedRunIds: [...linkedRunIds],
    };
    try {
      const res = await fetch("/api/decisions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? "Failed to create decision");
      }
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="glass-panel animate-fade-up flex flex-col gap-4 rounded-xl p-5">
      <div>
        <label className={labelClass}>Title</label>
        <input
          className={inputClass}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Switched primary chat model to Claude Sonnet 5"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Chosen gateway</label>
          <select
            className={inputClass}
            value={chosenGatewayId}
            onChange={(e) => setChosenGatewayId(e.target.value)}
          >
            <option value="">(none)</option>
            {gateways.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Chosen model (optional)</label>
          <input
            className={inputClass}
            value={chosenModelId}
            onChange={(e) => setChosenModelId(e.target.value)}
            placeholder="e.g. anthropic/claude-sonnet-5"
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>Rationale (markdown)</label>
        <textarea
          className={`${inputClass} font-mono`}
          rows={5}
          value={rationale}
          onChange={(e) => setRationale(e.target.value)}
          placeholder="Why this choice -- what was compared, what tipped it."
        />
      </div>

      <div>
        <label className={labelClass}>Alternatives considered (one per line)</label>
        <textarea
          className={inputClass}
          rows={3}
          value={alternativesText}
          onChange={(e) => setAlternativesText(e.target.value)}
        />
      </div>

      {recentRuns.length > 0 && (
        <div>
          <label className={labelClass}>Link evidence (recent runs)</label>
          <div className="max-h-40 overflow-y-auto rounded-lg border border-white/10 bg-black/20 p-2">
            {recentRuns.map((r) => (
              <label key={r.id} className="flex items-center gap-2 rounded px-2 py-1 text-xs text-neutral-300 hover:bg-white/[0.03]">
                <input type="checkbox" checked={linkedRunIds.has(r.id)} onChange={() => toggleRun(r.id)} />
                <span className="truncate">
                  {r.gatewayName} &middot; {r.kind} &middot; {r.promptPreview?.slice(0, 60)}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {error && (
        <p className="rounded-lg border border-red-500/20 bg-red-500/[0.07] px-3 py-2 text-sm text-red-300">{error}</p>
      )}

      <div className="flex gap-3">
        <button
          onClick={submit}
          disabled={submitting}
          className="btn-cta rounded-lg px-4 py-2 text-sm font-semibold"
        >
          {submitting ? "Saving..." : "Save decision"}
        </button>
        <button
          onClick={onCancel}
          className="rounded-lg border border-white/10 px-4 py-2 text-sm text-neutral-300 transition-colors duration-150 hover:border-white/20 hover:bg-white/[0.04]"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export default function DecisionsPage() {
  const [decisions, setDecisions] = useState<Decision[] | null>(null);
  const [showForm, setShowForm] = useState(false);

  function reload() {
    fetch("/api/decisions")
      .then((res) => res.json())
      .then(setDecisions);
  }

  useEffect(() => {
    reload();
  }, []);

  return (
    <div className="flex flex-col gap-8">
      <div className="animate-fade-up flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-50">Decisions</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-neutral-400">
            A record of which model/gateway was chosen and why, so the comparisons in Playground and Insights don&apos;t
            evaporate into a Slack thread.
          </p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="btn-cta shrink-0 rounded-lg px-4 py-2 text-sm font-semibold"
          >
            New decision
          </button>
        )}
      </div>

      {showForm && (
        <NewDecisionForm
          onCreated={() => {
            setShowForm(false);
            reload();
          }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {decisions === null ? (
        <div className="animate-shimmer h-3 w-[40%] rounded-full" />
      ) : decisions.length === 0 ? (
        <p className="text-neutral-400">No decisions recorded yet.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {decisions.map((d) => (
            <Link
              key={d.id}
              href={`/decisions/${d.id}`}
              className="glass-panel glass-panel-hover flex flex-col gap-1 rounded-xl p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-medium text-neutral-100">{d.title}</h2>
                <span className="shrink-0 text-xs text-neutral-500">
                  {new Date(d.createdAt).toLocaleDateString()}
                </span>
              </div>
              {(d.chosenGatewayName || d.chosenModelId) && (
                <p className="text-xs text-neutral-500">
                  {d.chosenGatewayName}
                  {d.chosenModelId && <span className="font-mono"> &middot; {d.chosenModelId}</span>}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
