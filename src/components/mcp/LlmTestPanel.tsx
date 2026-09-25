"use client";

import { useEffect, useMemo, useState } from "react";
import { ParametersPanel } from "@/components/playground/ParametersPanel";
import { ConfigDrawer } from "@/components/playground/ConfigDrawer";
import { CollapsibleSection } from "@/components/playground/CollapsibleSection";
import { EmptyResultsState } from "@/components/playground/EmptyResultsState";
import { ModelCombobox } from "@/components/ModelCombobox";
import { fetchModelsForGateway } from "@/lib/gateways/modelsClient";
import { TOOL_CAPABLE, type GatewayConfig, type RunParams } from "@/lib/gateways/types";
import type { ModelInfo } from "@/lib/gateways/adapters/models";
import type { McpAgentRun } from "@/lib/db/mcpAgentRuns";
import { AgentTranscript } from "./AgentTranscript";

const inputClass =
  "w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-600 transition-colors duration-150 focus:border-cyan-300/40 focus:outline-none focus:ring-2 focus:ring-cyan-300/15";

interface McpToolInfo {
  name: string;
  description?: string;
}

function MessageIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-3 w-3">
      <path
        d="M2.5 4.5a1.5 1.5 0 0 1 1.5-1.5h8a1.5 1.5 0 0 1 1.5 1.5v5a1.5 1.5 0 0 1-1.5 1.5H6.5L4 13.5V11H4a1.5 1.5 0 0 1-1.5-1.5v-5Z"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ServerIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-3 w-3">
      <rect x="2.5" y="2.5" width="11" height="4.5" rx="1" />
      <rect x="2.5" y="9" width="11" height="4.5" rx="1" />
      <path d="M4.5 4.75h.01M4.5 11.25h.01" strokeLinecap="round" />
    </svg>
  );
}

function CpuIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-3 w-3">
      <rect x="4.5" y="4.5" width="7" height="7" rx="1" />
      <path d="M6 1.5v2M10 1.5v2M6 12.5v2M10 12.5v2M1.5 6v2M1.5 10v2M12.5 6v2M12.5 10v2" strokeLinecap="round" />
    </svg>
  );
}

function WrenchIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-3 w-3">
      <path
        d="M10.5 2.5a3 3 0 0 0-3.9 3.9L2 11l2 2 4.6-4.6a3 3 0 0 0 3.9-3.9l-2.1 2.1-1.9-.5-.5-1.9 2.5-1.6Z"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SlidersIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-3 w-3">
      <path d="M2 5h6m4 0h2M2 11h2m4 0h6" strokeLinecap="round" />
      <circle cx="9.5" cy="5" r="1.6" />
      <circle cx="6.5" cy="11" r="1.6" />
    </svg>
  );
}

export function LlmTestPanel({ serverId, tools }: { serverId: string; tools?: unknown[] }) {
  const toolInfos = (tools ?? []) as McpToolInfo[];

  const [gateways, setGateways] = useState<GatewayConfig[]>([]);
  const [gatewayId, setGatewayId] = useState<string>("");
  const [modelOptions, setModelOptions] = useState<ModelInfo[]>([]);
  const [fetchingModels, setFetchingModels] = useState(false);
  const [model, setModel] = useState<string>("");
  const [params, setParams] = useState<RunParams>({});
  const [prompt, setPrompt] = useState("");
  const [selectedTools, setSelectedTools] = useState<Set<string>>(new Set());
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<McpAgentRun | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(true);

  const gateway = gateways.find((g) => g.id === gatewayId);

  useEffect(() => {
    fetch("/api/gateways")
      .then((res) => res.json())
      .then((data: GatewayConfig[]) => {
        const capable = data.filter((g) => TOOL_CAPABLE(g.protocol));
        setGateways(capable);
        if (capable.length > 0) setGatewayId(capable[0].id);
      });
  }, []);

  useEffect(() => {
    setSelectedTools(new Set(toolInfos.map((t) => t.name)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toolInfos.map((t) => t.name).join(",")]);

  useEffect(() => {
    if (!gatewayId) {
      setModelOptions([]);
      return;
    }
    setModel("");
    setFetchingModels(true);
    fetchModelsForGateway(gatewayId)
      .then(setModelOptions)
      .catch(() => setModelOptions([]))
      .finally(() => setFetchingModels(false));
  }, [gatewayId]);

  function refreshModels() {
    if (!gatewayId) return;
    setFetchingModels(true);
    fetchModelsForGateway(gatewayId, true)
      .then(setModelOptions)
      .catch(() => setModelOptions([]))
      .finally(() => setFetchingModels(false));
  }

  function toggleTool(name: string) {
    setSelectedTools((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  const canRun = !running && !!gatewayId && prompt.trim().length > 0;
  const runLabel = !gatewayId
    ? "Select a gateway"
    : !prompt.trim()
      ? "Write a prompt"
      : `Will run on ${gateway?.name}${model ? ` (${model})` : ""}`;

  async function run() {
    if (!canRun) return;
    setRunning(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`/api/mcp/${serverId}/agent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gatewayId,
          model: model || undefined,
          params,
          prompt,
          toolNames: [...selectedTools],
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Run failed");
      setResult(body as McpAgentRun);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setRunning(false);
    }
  }

  const selectedProtocols = useMemo(() => (gateway ? [gateway.protocol] : []), [gateway]);
  const activeParamCount = Object.values(params).filter((v) => v !== undefined && v !== "").length;

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <div
        className={`flex min-w-0 flex-col gap-4 transition-[padding-right] duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] ${
          drawerOpen ? "lg:pr-[440px]" : "lg:pr-0"
        }`}
      >
        {error && (
          <p className="rounded-lg border border-red-500/20 bg-red-500/[0.07] px-3 py-2 text-sm text-red-300">{error}</p>
        )}

        {result ? (
          <div className="glass-panel rounded-xl p-4">
            <AgentTranscript
              steps={result.steps}
              finalText={result.finalText}
              success={result.success}
              errorMessage={result.errorMessage}
              hitMaxTurns={result.hitMaxTurns}
              latencyMs={result.latencyMs}
              usage={result.usage}
              turns={result.turns}
            />
          </div>
        ) : (
          !error && (
            <EmptyResultsState
              title="No runs yet"
              description="Configure a gateway, model, and prompt on the right, then hit Run."
            />
          )
        )}
      </div>

      <ConfigDrawer title="LLM Test" open={drawerOpen} onOpenChange={setDrawerOpen}>
        <div className="flex flex-col divide-y divide-white/5">
          <CollapsibleSection title="Prompt" icon={<MessageIcon />} className="animate-fade-up" style={{ animationDelay: "0ms" }}>
            <div className="flex flex-col gap-3">
              <textarea
                className={inputClass}
                rows={6}
                placeholder="e.g. Add 2 and 3 using the tool"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
              <div className="flex items-center justify-between pt-1">
                <p className="text-xs text-neutral-500">{runLabel}</p>
                <button onClick={run} disabled={!canRun} className="btn-cta shrink-0 rounded-lg px-5 py-2 text-sm font-semibold">
                  {running ? "Running..." : "Run"}
                </button>
              </div>
            </div>
          </CollapsibleSection>

          <CollapsibleSection title="Gateway" icon={<ServerIcon />} className="animate-fade-up" style={{ animationDelay: "45ms" }}>
            {gateways.length === 0 ? (
              <p className="text-xs text-neutral-500">
                No tool-calling-capable gateways configured yet. Add an OpenAI, Anthropic, Azure OpenAI, or Google
                Gemini gateway in Settings.
              </p>
            ) : (
              <select value={gatewayId} onChange={(e) => setGatewayId(e.target.value)} className={inputClass}>
                {gateways.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name} ({g.protocol})
                  </option>
                ))}
              </select>
            )}
          </CollapsibleSection>

          <CollapsibleSection
            title="Model"
            icon={<CpuIcon />}
            subtitle="(optional, searchable)"
            className="animate-fade-up"
            style={{ animationDelay: "90ms" }}
          >
            <ModelCombobox
              value={model}
              onChange={setModel}
              options={modelOptions}
              loading={fetchingModels}
              disabled={!gatewayId}
              placeholder={gateway ? `default (${gateway.defaultModel})` : "select a gateway first"}
              onRefresh={gatewayId ? refreshModels : undefined}
            />
          </CollapsibleSection>

          {toolInfos.length > 0 && (
            <CollapsibleSection
              title="Tools"
              icon={<WrenchIcon />}
              subtitle={`${selectedTools.size} of ${toolInfos.length}`}
              className="animate-fade-up"
              style={{ animationDelay: "135ms" }}
            >
              <div className="flex flex-wrap gap-2">
                {toolInfos.map((t) => (
                  <button
                    key={t.name}
                    type="button"
                    onClick={() => toggleTool(t.name)}
                    title={t.description}
                    className={`rounded-md border px-2.5 py-1 font-mono text-xs transition-colors duration-150 ${
                      selectedTools.has(t.name)
                        ? "border-cyan-300/30 bg-cyan-300/10 text-cyan-100"
                        : "border-white/10 text-neutral-500 hover:border-white/20"
                    }`}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            </CollapsibleSection>
          )}

          <CollapsibleSection
            title="Parameters"
            icon={<SlidersIcon />}
            subtitle="(optional)"
            defaultOpen={false}
            className="animate-fade-up"
            style={{ animationDelay: "180ms" }}
            accessory={
              activeParamCount > 0 ? (
                <span className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-1.5 py-0.5 text-[10px] font-medium text-cyan-200">
                  {activeParamCount} set
                </span>
              ) : undefined
            }
          >
            <ParametersPanel value={params} onChange={setParams} selectedProtocols={selectedProtocols} />
          </CollapsibleSection>
        </div>
      </ConfigDrawer>
    </div>
  );
}
