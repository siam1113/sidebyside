"use client";

import { useState } from "react";
import type { AgentStep } from "@/lib/mcp/agentLoop";
import type { UsageInfo } from "@/lib/gateways/types";
import { extractMcpText, isMcpError } from "./mcpFormat";

function JsonBlock({ value }: { value: unknown }) {
  return (
    <pre className="max-h-64 overflow-auto rounded-md border border-white/5 bg-black/40 p-2 text-[11px] leading-relaxed text-neutral-300">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

function ToolCallCard({ toolCall }: { toolCall: { id: string; name: string; args: unknown } }) {
  return (
    <div className="rounded-lg border border-cyan-300/20 bg-cyan-300/[0.04] p-3">
      <p className="mb-1 text-[10px] uppercase tracking-wide text-cyan-300/70">Tool call · {toolCall.name}</p>
      <JsonBlock value={toolCall.args} />
    </div>
  );
}

function ToolResultCard({ step }: { step: Extract<AgentStep, { type: "tool_result" }> }) {
  const text = extractMcpText(step.result);
  const errored = step.isError || isMcpError(step.result);
  const [showRaw, setShowRaw] = useState(!text);
  return (
    <div
      className={`rounded-lg border p-3 ${errored ? "border-red-500/20 bg-red-500/[0.05]" : "border-white/5 bg-white/[0.02]"}`}
    >
      <div className="mb-1 flex items-center justify-between">
        <p className={`text-[10px] uppercase tracking-wide ${errored ? "text-red-300" : "text-neutral-500"}`}>
          Tool result · {step.name} {errored && "(error)"}
        </p>
        {text && (
          <button
            type="button"
            onClick={() => setShowRaw((v) => !v)}
            className="text-[10px] text-neutral-600 underline decoration-neutral-700 underline-offset-2 hover:text-neutral-300"
          >
            {showRaw ? "Hide raw" : "Show raw"}
          </button>
        )}
      </div>
      {text && <p className="whitespace-pre-wrap text-sm text-neutral-200">{text}</p>}
      {showRaw && <div className={text ? "mt-2" : ""}><JsonBlock value={step.result} /></div>}
    </div>
  );
}

export function AgentTranscript({
  steps,
  finalText,
  success,
  errorMessage,
  hitMaxTurns,
  latencyMs,
  usage,
  turns,
}: {
  steps: AgentStep[];
  finalText?: string;
  success: boolean;
  errorMessage?: string;
  hitMaxTurns?: boolean;
  latencyMs?: number;
  usage?: UsageInfo;
  turns?: number;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3">
        {steps.map((step, i) =>
          step.type === "assistant" ? (
            <div key={i} className="flex flex-col gap-2">
              {step.text && (
                <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
                  <p className="mb-1 text-[10px] uppercase tracking-wide text-neutral-600">Assistant</p>
                  <p className="whitespace-pre-wrap text-sm text-neutral-200">{step.text}</p>
                </div>
              )}
              {step.toolCalls?.map((tc) => <ToolCallCard key={tc.id} toolCall={tc} />)}
            </div>
          ) : (
            <ToolResultCard key={i} step={step} />
          ),
        )}
      </div>

      {finalText && (
        <div className="rounded-lg border border-emerald-400/20 bg-emerald-400/[0.05] p-3">
          <p className="mb-1 text-[10px] uppercase tracking-wide text-emerald-300/80">Final answer</p>
          <p className="whitespace-pre-wrap text-sm text-neutral-100">{finalText}</p>
        </div>
      )}

      {errorMessage && (
        <p className="rounded-lg border border-red-500/20 bg-red-500/[0.07] px-3 py-2 text-sm text-red-300">
          {errorMessage}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3 text-[11px] text-neutral-500">
        <span className={success ? "text-emerald-300" : "text-red-300"}>{success ? "Completed" : "Failed"}</span>
        {latencyMs != null && <span>{latencyMs}ms total</span>}
        {turns != null && <span>{turns} turn{turns === 1 ? "" : "s"}</span>}
        {hitMaxTurns && <span className="text-amber-300">hit max turns</span>}
        {usage?.totalTokens != null && <span>{usage.totalTokens} tokens</span>}
      </div>
    </div>
  );
}
