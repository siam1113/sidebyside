"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { TerminalView } from "@/components/Terminal";
import { listSandboxSessions, type SessionSummary } from "@/lib/sandbox/sessionsClient";

const TOOL_LABEL: Record<SessionSummary["tool"], string> = {
  claude: "Claude Code",
  codex: "Codex CLI",
  copilot: "Copilot CLI",
};

export default function SandboxComparePage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = use(params);
  const [sessions, setSessions] = useState<SessionSummary[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    listSandboxSessions().then((all) => {
      if (!cancelled) setSessions(all.filter((s) => s.groupId === groupId));
    });
    return () => {
      cancelled = true;
    };
  }, [groupId]);

  if (sessions === null) {
    return (
      <div className="flex flex-col gap-2">
        <div className="animate-shimmer h-3 w-[40%] rounded-full" />
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-lg font-semibold tracking-tight text-neutral-50">Comparison not found</h1>
        <p className="text-sm text-neutral-400">
          None of this comparison&apos;s sessions are running anymore -- they may have been stopped, or the server
          restarted.
        </p>
        <Link
          href="/sandbox"
          className="btn-cta inline-flex w-fit items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold"
        >
          Back to Sandbox
        </Link>
      </div>
    );
  }

  return (
    <div className="flex h-[80vh] flex-col gap-3">
      <div className="animate-fade-up flex items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-neutral-50">Harness comparison</h1>
          <p className="mt-0.5 text-xs text-neutral-500">
            {sessions.length} session{sessions.length === 1 ? "" : "s"} &middot; same task, side by side -- the prompt
            is typed into each terminal but not submitted, so review before hitting Enter in each.
          </p>
        </div>
        <Link
          href="/sandbox"
          className="rounded-lg border border-white/10 px-3 py-1.5 text-sm text-neutral-300 transition-colors duration-150 hover:border-white/20 hover:bg-white/[0.04]"
        >
          Back to Sandbox
        </Link>
      </div>

      <div
        className={`grid min-h-0 flex-1 gap-3 ${sessions.length === 1 ? "grid-cols-1" : sessions.length === 2 ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1 lg:grid-cols-2 xl:grid-cols-3"}`}
      >
        {sessions.map((s) => (
          <div
            key={s.id}
            className="animate-fade-up flex min-h-0 flex-col overflow-hidden rounded-xl border border-white/10 bg-[#050507] shadow-[0_20px_60px_-30px_rgba(0,0,0,0.8)]"
          >
            <div className="flex items-center gap-3 border-b border-white/5 bg-white/[0.02] px-3.5 py-2.5">
              <div className="flex gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]/80" />
              </div>
              <span className="font-mono text-[11px] text-neutral-500">
                {TOOL_LABEL[s.tool]} &middot; {s.model}
              </span>
            </div>
            <div className="min-h-0 flex-1 p-2">
              <TerminalView sessionId={s.id} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
