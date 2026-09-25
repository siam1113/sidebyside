"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  listSandboxSessions,
  stopSandboxSession,
  type SessionSummary,
} from "@/lib/sandbox/sessionsClient";

const POLL_MS = 4000;

const TOOL_LABEL: Record<SessionSummary["tool"], string> = {
  claude: "Claude Code",
  codex: "Codex CLI",
  copilot: "Copilot CLI",
};

function relativeTime(iso: string): string {
  const deltaMs = Date.now() - new Date(iso).getTime();
  const seconds = Math.max(0, Math.round(deltaMs / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

function StatusPill({ status }: { status: SessionSummary["status"] }) {
  const styles: Record<SessionSummary["status"], string> = {
    running: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
    pending: "border-amber-400/20 bg-amber-400/10 text-amber-300",
    stopped: "border-neutral-500/20 bg-neutral-500/10 text-neutral-400",
  };
  const dot: Record<SessionSummary["status"], string> = {
    running: "bg-emerald-400 shadow-[0_0_6px_rgba(74,222,128,0.7)]",
    pending: "bg-amber-400 animate-pulse",
    stopped: "bg-neutral-500",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium ${styles[status]}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dot[status]}`} />
      {status}
    </span>
  );
}

export function ActiveSessions() {
  const [sessions, setSessions] = useState<SessionSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stoppingId, setStoppingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function refresh() {
      try {
        const data = await listSandboxSessions();
        if (!cancelled) {
          setSessions(data);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      }
    }
    void refresh();
    const interval = setInterval(refresh, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  async function handleStop(id: string) {
    setStoppingId(id);
    try {
      await stopSandboxSession(id);
      setSessions((prev) => prev?.filter((s) => s.id !== id) ?? prev);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setStoppingId(null);
    }
  }

  // Nothing to show yet (still loading) or ever (no sessions) -- don't take up space.
  if (sessions === null && !error) return null;
  if (sessions !== null && sessions.length === 0 && !error) return null;

  return (
    <div className="glass-panel animate-fade-up flex flex-col gap-3 rounded-xl p-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-neutral-300">Active sessions</label>
        {sessions && sessions.length > 0 && (
          <span className="text-xs text-neutral-500">{sessions.length} running</span>
        )}
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      {sessions && sessions.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {sessions.map((s) => (
            <div
              key={s.id}
              className="flex items-center gap-3 rounded-lg border border-white/10 px-3 py-2 text-sm text-neutral-300"
            >
              <StatusPill status={s.status} />
              <span className="min-w-0 flex-1 truncate">
                {TOOL_LABEL[s.tool]}{" "}
                <span className="font-mono text-xs text-neutral-500">{s.model}</span>
              </span>
              {s.groupId && (
                <span className="shrink-0 rounded-full border border-violet-400/20 bg-violet-400/10 px-2 py-0.5 text-[10px] font-medium text-violet-200">
                  comparison
                </span>
              )}
              <span className="shrink-0 text-xs text-neutral-600">{relativeTime(s.createdAt)}</span>
              <Link
                href={s.groupId ? `/sandbox/compare/${s.groupId}` : `/sandbox/${s.id}`}
                className="shrink-0 rounded-md border border-white/10 px-2.5 py-1 text-xs text-neutral-300 transition-colors duration-150 hover:border-white/20 hover:bg-white/[0.04]"
              >
                Open
              </Link>
              <button
                type="button"
                onClick={() => handleStop(s.id)}
                disabled={stoppingId === s.id}
                className="shrink-0 rounded-md border border-red-500/20 px-2.5 py-1 text-xs text-red-300 transition-colors duration-150 hover:bg-red-500/10 disabled:opacity-50"
              >
                {stoppingId === s.id ? "Stopping…" : "Stop"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
