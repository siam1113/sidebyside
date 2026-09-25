"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { GatewayConfig, GatewayProtocol } from "@/lib/gateways/types";
import type { ModelInfo } from "@/lib/gateways/adapters/models";
import { fetchModelsForGateway } from "@/lib/gateways/modelsClient";
import { ModelCombobox } from "@/components/ModelCombobox";
import { ActiveSessions } from "@/components/sandbox/ActiveSessions";
import { createSandboxGroup } from "@/lib/sandbox/sessionsClient";

interface ToolOption {
  value: "claude" | "codex" | "copilot";
  label: string;
  compatible: GatewayProtocol[];
  note?: string;
}

const TOOLS: ToolOption[] = [
  {
    value: "claude",
    label: "Claude Code",
    compatible: ["anthropic"],
    note: "Requires an Anthropic-compatible gateway (protocol: anthropic).",
  },
  {
    value: "codex",
    label: "Codex CLI",
    compatible: ["openai", "azure-openai"],
    note: "Requires an OpenAI-compatible or Azure OpenAI gateway.",
  },
  {
    value: "copilot",
    label: "Copilot CLI",
    compatible: ["openai", "anthropic", "azure-openai"],
    note: "BYOK env vars cover model calls, but Copilot's own CLI identity may still need a fresh `gh auth login` inside the container each session.",
  },
];

export default function SandboxPage() {
  const router = useRouter();
  const [gateways, setGateways] = useState<GatewayConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"single" | "compare">("single");
  const [tool, setTool] = useState<ToolOption["value"]>("claude");
  const [selectedGatewayId, setSelectedGatewayId] = useState("");
  const [modelOverride, setModelOverride] = useState("");
  const [launching, setLaunching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modelOptions, setModelOptions] = useState<ModelInfo[]>([]);
  const [fetchingModels, setFetchingModels] = useState(false);
  const [modelsError, setModelsError] = useState<string | null>(null);
  const [compareTools, setCompareTools] = useState<Set<ToolOption["value"]>>(
    () => new Set(["claude", "codex"]),
  );
  const [comparePrompt, setComparePrompt] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch("/api/gateways");
      const data = (await res.json()) as GatewayConfig[];
      if (!cancelled) {
        setGateways(data);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const activeTool = TOOLS.find((t) => t.value === tool)!;
  const compatibleGateways = gateways.filter((g) => activeTool.compatible.includes(g.protocol));
  const gatewayId = compatibleGateways.some((g) => g.id === selectedGatewayId)
    ? selectedGatewayId
    : (compatibleGateways[0]?.id ?? "");

  // Auto-fetch models whenever the active gateway changes -- cached per
  // gateway id, so switching tools/gateways back and forth doesn't re-fetch.
  useEffect(() => {
    if (!gatewayId) {
      setModelOptions([]);
      setModelsError(null);
      return;
    }
    let cancelled = false;
    setModelOptions([]);
    setModelsError(null);
    setFetchingModels(true);
    fetchModelsForGateway(gatewayId)
      .then((models) => {
        if (cancelled) return;
        setModelOptions(models);
        if (models.length === 0) setModelsError("No models returned");
      })
      .catch((err) => {
        if (!cancelled) setModelsError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        if (!cancelled) setFetchingModels(false);
      });
    return () => {
      cancelled = true;
    };
  }, [gatewayId]);

  async function launch() {
    if (!gatewayId) return;
    setLaunching(true);
    setError(null);
    try {
      const res = await fetch("/api/sandbox/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tool, gatewayId, model: modelOverride || undefined }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "Failed to launch sandbox session");
        setLaunching(false);
        return;
      }
      router.push(`/sandbox/${body.sessionId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setLaunching(false);
    }
  }

  function toggleCompareTool(value: ToolOption["value"]) {
    setCompareTools((prev) => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  }

  function firstCompatibleGateway(value: ToolOption["value"]): GatewayConfig | undefined {
    const compat = TOOLS.find((t) => t.value === value)!.compatible;
    return gateways.find((g) => compat.includes(g.protocol));
  }

  const compareSelections = [...compareTools].map((value) => ({
    value,
    label: TOOLS.find((t) => t.value === value)!.label,
    gateway: firstCompatibleGateway(value),
  }));

  async function launchCompare() {
    const runnable = compareSelections.filter((s) => s.gateway);
    if (runnable.length === 0) return;
    setLaunching(true);
    setError(null);
    try {
      const { groupId } = await createSandboxGroup(
        runnable.map((s) => ({ tool: s.value, gatewayId: s.gateway!.id })),
        comparePrompt,
      );
      router.push(`/sandbox/compare/${groupId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setLaunching(false);
    }
  }

  if (!loading && gateways.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-50">CLI Sandbox</h1>
        <p className="text-neutral-400">
          No gateways configured yet.{" "}
          <Link href="/settings" className="text-cyan-200 underline decoration-cyan-200/30 underline-offset-2 hover:text-cyan-100">
            Add one in Settings
          </Link>{" "}
          to get started.
        </p>
        <ActiveSessions />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="animate-fade-up">
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-50">CLI Sandbox</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-neutral-400">
          Launches an isolated, throwaway Docker container with no host volumes mounted.
          Your real{" "}
          <code className="rounded bg-white/[0.06] px-1.5 py-0.5 font-mono text-[13px] text-neutral-300">
            ~/.claude
          </code>
          ,{" "}
          <code className="rounded bg-white/[0.06] px-1.5 py-0.5 font-mono text-[13px] text-neutral-300">
            ~/.codex
          </code>
          , and Copilot config are never touched.
        </p>
      </div>

      <ActiveSessions />

      <div className="animate-fade-up flex w-fit gap-1 rounded-lg border border-white/10 bg-white/[0.03] p-1">
        {(["single", "compare"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`rounded-md px-3 py-1.5 text-sm transition-colors duration-150 ${
              mode === m ? "bg-cyan-300/10 text-cyan-100" : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            {m === "single" ? "Single session" : "Compare harnesses"}
          </button>
        ))}
      </div>

      {mode === "single" ? (
      <div className="glass-panel animate-fade-up flex flex-col gap-5 rounded-xl p-5" style={{ animationDelay: "60ms" }}>
        <div>
          <label className="mb-2 block text-sm font-medium text-neutral-300">Tool</label>
          <div className="flex flex-wrap gap-2">
            {TOOLS.map((t) => (
              <button
                key={t.value}
                onClick={() => setTool(t.value)}
                className={`rounded-lg border px-4 py-2 text-sm transition-colors duration-150 ${
                  tool === t.value
                    ? "border-cyan-300/30 bg-cyan-300/10 text-cyan-100"
                    : "border-white/10 text-neutral-300 hover:border-white/20 hover:bg-white/[0.04]"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          {activeTool.note && <p className="mt-2 text-xs text-neutral-500">{activeTool.note}</p>}
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-neutral-300">Gateway</label>
          {compatibleGateways.length === 0 ? (
            <p className="text-sm text-neutral-500">
              No configured gateways are compatible with {activeTool.label}.{" "}
              <Link href="/settings" className="text-cyan-200 underline decoration-cyan-200/30 underline-offset-2 hover:text-cyan-100">
                Add one
              </Link>
              .
            </p>
          ) : (
            <select
              className="w-full max-w-md rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-neutral-100 transition-colors duration-150 focus:border-cyan-300/40 focus:outline-none focus:ring-2 focus:ring-cyan-300/15"
              value={gatewayId}
              onChange={(e) => setSelectedGatewayId(e.target.value)}
            >
              {compatibleGateways.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name} ({g.protocol})
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="max-w-md">
          <label className="mb-2 block text-sm font-medium text-neutral-300">Model override (optional)</label>
          <ModelCombobox
            value={modelOverride}
            onChange={setModelOverride}
            options={modelOptions}
            loading={fetchingModels}
            error={modelsError}
            disabled={!gatewayId}
            placeholder="defaults to the gateway's default model"
            onRefresh={() => gatewayId && fetchModelsForGateway(gatewayId, true).then(setModelOptions)}
          />
        </div>

        {error && (
          <p className="rounded-lg border border-red-500/20 bg-red-500/[0.07] px-3 py-2 text-sm text-red-300">
            {error}
          </p>
        )}

        <div>
          <button
            onClick={launch}
            disabled={!gatewayId || launching}
            className="btn-cta inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold"
          >
            {launching ? "Launching..." : "Launch sandbox"}
          </button>
        </div>
      </div>
      ) : (
      <div className="glass-panel animate-fade-up flex flex-col gap-5 rounded-xl p-5" style={{ animationDelay: "60ms" }}>
        <div>
          <label className="mb-2 block text-sm font-medium text-neutral-300">Harnesses to compare</label>
          <div className="flex flex-wrap gap-2">
            {TOOLS.map((t) => {
              const gateway = firstCompatibleGateway(t.value);
              const selected = compareTools.has(t.value);
              return (
                <button
                  key={t.value}
                  onClick={() => toggleCompareTool(t.value)}
                  disabled={!gateway}
                  title={!gateway ? `No configured gateway is compatible with ${t.label}` : undefined}
                  className={`rounded-lg border px-4 py-2 text-sm transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-40 ${
                    selected
                      ? "border-cyan-300/30 bg-cyan-300/10 text-cyan-100"
                      : "border-white/10 text-neutral-300 hover:border-white/20 hover:bg-white/[0.04]"
                  }`}
                >
                  {t.label}
                  {gateway && <span className="ml-1.5 text-xs text-neutral-500">({gateway.name})</span>}
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-neutral-500">
            Each uses the first configured gateway compatible with it. Manage gateways in{" "}
            <Link href="/settings" className="text-cyan-200 underline decoration-cyan-200/30 underline-offset-2 hover:text-cyan-100">
              Settings
            </Link>
            .
          </p>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-neutral-300">Shared task prompt</label>
          <textarea
            value={comparePrompt}
            onChange={(e) => setComparePrompt(e.target.value)}
            rows={4}
            placeholder="e.g. Add input validation to the signup form and write a test for it."
            className="w-full max-w-2xl rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-neutral-100 transition-colors duration-150 focus:border-cyan-300/40 focus:outline-none focus:ring-2 focus:ring-cyan-300/15"
          />
          <p className="mt-2 text-xs text-neutral-500">
            Typed into each terminal once its CLI starts, but not submitted -- review and press Enter in each pane
            yourself.
          </p>
        </div>

        {error && (
          <p className="rounded-lg border border-red-500/20 bg-red-500/[0.07] px-3 py-2 text-sm text-red-300">
            {error}
          </p>
        )}

        <div>
          <button
            onClick={launchCompare}
            disabled={compareSelections.filter((s) => s.gateway).length === 0 || launching}
            className="btn-cta inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold"
          >
            {launching ? "Launching..." : "Launch comparison"}
          </button>
        </div>
      </div>
      )}
    </div>
  );
}
