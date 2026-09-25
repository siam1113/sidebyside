"use client";

import { useEffect, useState } from "react";
import type { ConnectionTestResult, GatewayConfig, GatewayProtocol } from "@/lib/gateways/types";
import type { ModelInfo } from "@/lib/gateways/adapters/models";
import { fetchModelsForGateway } from "@/lib/gateways/modelsClient";
import { testGatewayConnection } from "@/lib/gateways/connectionClient";

const PROTOCOL_LABELS: Record<GatewayProtocol, string> = {
  openai: "OpenAI-compatible",
  anthropic: "Anthropic-compatible",
  "azure-openai": "Azure OpenAI",
  "google-gemini": "Google Gemini",
  custom: "Custom",
  "typesafe-eval": "TypeSafe Evaluation",
};

const RECHECK_INTERVAL_MS = 60 * 60 * 1000;
const VISIBLE_MODEL_COUNT = 4;

function formatRelativeTime(iso: string): string {
  const diffSec = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (diffSec < 5) return "just now";
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  return `${diffHr}h ago`;
}

interface Props {
  gateway: GatewayConfig;
  onEdit: () => void;
  onDelete: () => void;
  index: number;
}

export function GatewayCard({ gateway, onEdit, onDelete, index }: Props) {
  const [status, setStatus] = useState<ConnectionTestResult | null>(null);
  const [checking, setChecking] = useState(false);
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [modelsLoading, setModelsLoading] = useState(true);

  async function runCheck() {
    setChecking(true);
    try {
      const result = await testGatewayConnection(gateway.id);
      setStatus(result);
    } catch (err) {
      setStatus({
        ok: false,
        message: err instanceof Error ? err.message : String(err),
        latencyMs: 0,
        checkedAt: new Date().toISOString(),
      });
    } finally {
      setChecking(false);
    }
  }

  // Initial check on mount, then an automatic re-check every hour for as
  // long as this card stays on screen.
  useEffect(() => {
    void runCheck();
    const interval = setInterval(() => void runCheck(), RECHECK_INTERVAL_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gateway.id]);

  useEffect(() => {
    let cancelled = false;
    setModelsLoading(true);
    fetchModelsForGateway(gateway.id)
      .then((m) => {
        if (!cancelled) setModels(m);
      })
      .catch(() => {
        if (!cancelled) setModels([]);
      })
      .finally(() => {
        if (!cancelled) setModelsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [gateway.id]);

  const statusColor = checking
    ? "bg-amber-300"
    : status === null
      ? "bg-neutral-600"
      : status.ok
        ? "bg-emerald-400"
        : "bg-red-400";

  const statusLabel = checking
    ? "Checking..."
    : status === null
      ? "Not tested yet"
      : status.ok
        ? "Connected"
        : "Connection failed";

  const visibleModels = models.slice(0, VISIBLE_MODEL_COUNT);
  const extraModelCount = models.length - visibleModels.length;

  return (
    <div
      className="glass-panel glass-panel-hover animate-fade-up flex flex-col gap-4 rounded-xl p-5"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-base font-semibold text-neutral-100">{gateway.name}</p>
            <span className="shrink-0 rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-cyan-200/80">
              {PROTOCOL_LABELS[gateway.protocol] ?? gateway.protocol}
            </span>
          </div>
          <p className="mt-1 truncate font-mono text-xs text-neutral-500">{gateway.baseUrl}</p>
        </div>
        <div
          className="flex shrink-0 items-center gap-1.5 rounded-full border border-white/10 bg-black/20 px-2.5 py-1"
          title={status?.message}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${statusColor} ${checking ? "animate-pulse" : ""}`} />
          <span className="text-[11px] text-neutral-300">{statusLabel}</span>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-white/5 bg-black/20 px-3 py-2.5">
          <p className="text-[10px] uppercase tracking-wide text-neutral-500">Default model</p>
          <p className="mt-1 truncate font-mono text-xs text-neutral-200">{gateway.defaultModel}</p>
        </div>
        <div className="rounded-lg border border-white/5 bg-black/20 px-3 py-2.5">
          <p className="text-[10px] uppercase tracking-wide text-neutral-500">Last checked</p>
          <p className="mt-1 text-xs text-neutral-200">
            {status ? formatRelativeTime(status.checkedAt) : "—"}
            {status && !checking && ` · ${status.latencyMs}ms`}
          </p>
        </div>
      </div>

      {status && !status.ok && (
        <p className="rounded-lg border border-red-500/20 bg-red-500/[0.07] px-3 py-2 text-xs text-red-300">
          {status.message}
        </p>
      )}

      <div>
        <p className="mb-1.5 text-[10px] uppercase tracking-wide text-neutral-500">
          Available models{models.length > 0 && ` (${models.length})`}
        </p>
        {modelsLoading ? (
          <div className="animate-shimmer h-6 w-40 rounded-md" />
        ) : models.length === 0 ? (
          <p className="text-xs text-neutral-600">No models listed</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {visibleModels.map((m) => (
              <span
                key={m.id}
                className="rounded-md border border-white/10 bg-white/[0.03] px-2 py-0.5 font-mono text-[11px] text-neutral-300"
              >
                {m.id}
              </span>
            ))}
            {extraModelCount > 0 && (
              <span className="rounded-md border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[11px] text-neutral-500">
                +{extraModelCount} more
              </span>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2 pt-1">
        <button
          onClick={runCheck}
          disabled={checking}
          className="rounded-lg border border-white/10 px-3 py-1.5 text-sm text-neutral-300 transition-colors duration-150 hover:border-white/20 hover:bg-white/[0.04] disabled:opacity-50"
        >
          {checking ? "Testing..." : "Test connection"}
        </button>
        <button
          onClick={onEdit}
          className="rounded-lg border border-white/10 px-3 py-1.5 text-sm text-neutral-300 transition-colors duration-150 hover:border-white/20 hover:bg-white/[0.04]"
        >
          Edit
        </button>
        <button
          onClick={onDelete}
          className="rounded-lg border border-red-500/20 px-3 py-1.5 text-sm text-red-300 transition-colors duration-150 hover:bg-red-500/10"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
