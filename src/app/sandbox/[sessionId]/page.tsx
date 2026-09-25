"use client";

import { use, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { TerminalView, type TerminalHandle } from "@/components/Terminal";
import { listSandboxSessions } from "@/lib/sandbox/sessionsClient";

export default function SandboxSessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = use(params);
  const [exited, setExited] = useState<number | null | "running">("running");
  const [exists, setExists] = useState<"checking" | "yes" | "no">("checking");
  const terminalRef = useRef<TerminalHandle>(null);

  const running = exited === "running";

  // A bookmarked/shared link to a session that's since been stopped (or never
  // existed) would otherwise silently connect a WS that the server rejects --
  // check up front so we can show a clear message instead of a blank terminal.
  useEffect(() => {
    let cancelled = false;
    listSandboxSessions()
      .then((sessions) => {
        if (cancelled) return;
        setExists(sessions.some((s) => s.id === sessionId) ? "yes" : "no");
      })
      .catch(() => {
        if (!cancelled) setExists("yes"); // can't confirm -- let the WS itself report the real error
      });
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  if (exists === "checking") {
    return (
      <div className="flex flex-col gap-2">
        <div className="animate-shimmer h-3 w-[40%] rounded-full" />
      </div>
    );
  }

  if (exists === "no") {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-lg font-semibold tracking-tight text-neutral-50">Session not found</h1>
        <p className="text-sm text-neutral-400">
          This sandbox session isn&apos;t running anymore -- it may have been stopped, or the server restarted.
        </p>
        <div className="flex gap-2">
          <Link
            href="/sandbox"
            className="btn-cta inline-flex w-fit items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold"
          >
            Launch a new session
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[75vh] flex-col gap-3">
      <div className="animate-fade-up flex items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-neutral-50">Sandbox session</h1>
          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-neutral-500">
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                running
                  ? "bg-emerald-400 shadow-[0_0_8px_rgba(74,222,128,0.7)]"
                  : "bg-neutral-600"
              }`}
            />
            {running
              ? "Running — fresh container, no host volumes mounted."
              : `Exited (code ${exited ?? "unknown"})`}
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          {running && (
            <button
              onClick={() => terminalRef.current?.stop()}
              className="rounded-lg border border-red-500/20 px-3 py-1.5 text-sm text-red-300 transition-colors duration-150 hover:bg-red-500/10"
            >
              Stop
            </button>
          )}
          <Link
            href="/sandbox"
            className="rounded-lg border border-white/10 px-3 py-1.5 text-sm text-neutral-300 transition-colors duration-150 hover:border-white/20 hover:bg-white/[0.04]"
          >
            New session
          </Link>
        </div>
      </div>
      <div className="animate-fade-up flex flex-1 flex-col overflow-hidden rounded-xl border border-white/10 bg-[#050507] shadow-[0_20px_60px_-30px_rgba(0,0,0,0.8)]" style={{ animationDelay: "60ms" }}>
        <div className="flex items-center gap-3 border-b border-white/5 bg-white/[0.02] px-3.5 py-2.5">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]/80" />
          </div>
          <span className="font-mono text-[11px] text-neutral-500">
            session &middot; {sessionId}
          </span>
        </div>
        <div className="min-h-0 flex-1 p-2">
          <TerminalView ref={terminalRef} sessionId={sessionId} onExit={(code) => setExited(code)} />
        </div>
      </div>
    </div>
  );
}
