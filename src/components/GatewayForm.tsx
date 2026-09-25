"use client";

import { useEffect, useState } from "react";
import type { ConnectionTestResult, GatewayConfig, GatewayConfigInput, GatewayProtocol } from "@/lib/gateways/types";
import type { ModelInfo } from "@/lib/gateways/adapters/models";
import { fetchModelsForDraft, fetchModelsForGateway } from "@/lib/gateways/modelsClient";
import { testDraftConnection } from "@/lib/gateways/connectionClient";
import { ModelCombobox } from "@/components/ModelCombobox";

const PROTOCOLS: { value: GatewayProtocol; title: string; description: string }[] = [
  {
    value: "openai",
    title: "OpenAI-compatible",
    description: "LiteLLM, OpenRouter, Portkey, Helicone, Cloudflare AI Gateway, Vercel, and other OpenAI-shaped APIs",
  },
  {
    value: "anthropic",
    title: "Anthropic-compatible",
    description: "Speaks the /v1/messages request format",
  },
  {
    value: "azure-openai",
    title: "Azure OpenAI",
    description: "Deployment- and API-version-based Azure endpoint",
  },
  {
    value: "google-gemini",
    title: "Google Gemini",
    description: "Google's native Gemini API",
  },
  {
    value: "custom",
    title: "Custom",
    description: "Define your own request and response template",
  },
  {
    value: "typesafe-eval",
    title: "TypeSafe Evaluation",
    description: "Structured yes/no, choice, and score judgments via TypeSafe AI's System One models (e.g. jev)",
  },
];

const inputClass =
  "w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-600 transition-colors duration-150 focus:border-cyan-300/40 focus:outline-none focus:ring-2 focus:ring-cyan-300/15";
const labelClass = "block text-sm font-medium text-neutral-300 mb-1.5";
const primaryButtonClass = "btn-cta rounded-lg px-4 py-2 text-sm font-semibold";
const ghostButtonClass =
  "rounded-lg border border-white/10 px-4 py-2 text-sm text-neutral-300 transition-colors duration-150 hover:border-white/20 hover:bg-white/[0.04]";

/** Seeds a few fields when creating a brand-new gateway (e.g. deep-linked from another tab). Ignored in edit mode. */
export interface GatewayDraft {
  protocol?: GatewayProtocol;
  baseUrl?: string;
  apiKey?: string;
}

interface Props {
  initial?: GatewayConfig | null;
  initialDraft?: GatewayDraft;
  onSubmit: (input: GatewayConfigInput) => Promise<void>;
  onCancel: () => void;
}

function safeJsonStringify(value: unknown): string {
  try {
    return JSON.stringify(value ?? {}, null, 2);
  } catch {
    return "{}";
  }
}

export function GatewayForm({ initial, initialDraft, onSubmit, onCancel }: Props) {
  const [name, setName] = useState(initial?.name ?? "");
  const [protocol, setProtocol] = useState<GatewayProtocol>(initial?.protocol ?? initialDraft?.protocol ?? "openai");
  const [baseUrl, setBaseUrl] = useState(initial?.baseUrl ?? initialDraft?.baseUrl ?? "");
  const [apiKey, setApiKey] = useState(initial?.apiKey ?? initialDraft?.apiKey ?? "");
  const [defaultModel, setDefaultModel] = useState(initial?.defaultModel ?? "");
  const [extraHeaders, setExtraHeaders] = useState(safeJsonStringify(initial?.extraHeaders));
  const [azureDeployment, setAzureDeployment] = useState(initial?.azure?.deployment ?? "");
  const [azureApiVersion, setAzureApiVersion] = useState(initial?.azure?.apiVersion ?? "2024-02-15-preview");
  const [customMethod, setCustomMethod] = useState<"GET" | "POST">(initial?.custom?.method ?? "POST");
  const [customUrl, setCustomUrl] = useState(initial?.custom?.url ?? "{{baseUrl}}/chat/completions");
  const [customHeaders, setCustomHeaders] = useState(
    safeJsonStringify(initial?.custom?.headers ?? { Authorization: "Bearer {{apiKey}}" }),
  );
  const [customBody, setCustomBody] = useState(
    initial?.custom?.bodyTemplate ??
      '{"model": "{{model}}", "messages": [{"role": "user", "content": "{{prompt}}"}]}',
  );
  const [customResponsePath, setCustomResponsePath] = useState(
    initial?.custom?.responsePath ?? "choices.0.message.content",
  );
  const [healthCheckEnabled, setHealthCheckEnabled] = useState(initial?.healthCheckEnabled ?? false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [modelOptions, setModelOptions] = useState<ModelInfo[]>([]);
  const [fetchingModels, setFetchingModels] = useState(false);
  const [modelsError, setModelsError] = useState<string | null>(null);
  const [connStatus, setConnStatus] = useState<ConnectionTestResult | null>(null);
  const [testingConn, setTestingConn] = useState(false);

  // Editing an existing gateway: auto-load its models once, keyed by the
  // saved gateway id so switching between gateways elsewhere in the app
  // doesn't re-fetch what's already cached.
  useEffect(() => {
    if (!initial?.id) return;
    setFetchingModels(true);
    fetchModelsForGateway(initial.id)
      .then((models) => {
        setModelOptions(models);
        if (models.length === 0) setModelsError("No models returned");
      })
      .catch((err) => setModelsError(err instanceof Error ? err.message : String(err)))
      .finally(() => setFetchingModels(false));
    // Only ever runs for the gateway this form was opened with.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial?.id]);

  function parsedExtraHeadersSafe(): Record<string, string> | undefined {
    try {
      return extraHeaders.trim() ? JSON.parse(extraHeaders) : undefined;
    } catch {
      return undefined;
    }
  }

  async function loadModels(force = false) {
    if (protocol === "custom") return;
    if (!baseUrl.trim()) {
      setModelsError("Enter a base URL first");
      return;
    }
    if (protocol === "azure-openai" && !azureApiVersion.trim()) {
      setModelsError("Enter an API version first");
      return;
    }
    setFetchingModels(true);
    setModelsError(null);
    try {
      const models = await fetchModelsForDraft(
        {
          protocol,
          baseUrl,
          apiKey,
          extraHeaders: parsedExtraHeadersSafe(),
          azure: protocol === "azure-openai" ? { deployment: azureDeployment, apiVersion: azureApiVersion } : undefined,
        },
        force,
      );
      setModelOptions(models);
      if (models.length === 0) setModelsError("No models returned");
    } catch (err) {
      setModelsError(err instanceof Error ? err.message : String(err));
      setModelOptions([]);
    } finally {
      setFetchingModels(false);
    }
  }

  function onModelFieldOpen() {
    if (modelOptions.length === 0 && !fetchingModels) void loadModels();
  }

  async function handleTestConnection() {
    if (!baseUrl.trim()) {
      setConnStatus({
        ok: false,
        message: "Enter a base URL first",
        latencyMs: 0,
        checkedAt: new Date().toISOString(),
      });
      return;
    }
    if (protocol === "azure-openai" && !azureApiVersion.trim()) {
      setConnStatus({
        ok: false,
        message: "Enter an API version first",
        latencyMs: 0,
        checkedAt: new Date().toISOString(),
      });
      return;
    }
    setTestingConn(true);
    try {
      const result = await testDraftConnection({
        protocol,
        baseUrl,
        apiKey,
        extraHeaders: parsedExtraHeadersSafe(),
        azure: protocol === "azure-openai" ? { deployment: azureDeployment, apiVersion: azureApiVersion } : undefined,
      });
      setConnStatus(result);
    } catch (err) {
      setConnStatus({
        ok: false,
        message: err instanceof Error ? err.message : String(err),
        latencyMs: 0,
        checkedAt: new Date().toISOString(),
      });
    } finally {
      setTestingConn(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    let parsedExtraHeaders: Record<string, string> = {};
    try {
      parsedExtraHeaders = extraHeaders.trim() ? JSON.parse(extraHeaders) : {};
    } catch {
      setError("Extra headers must be valid JSON");
      return;
    }

    const input: GatewayConfigInput = {
      name,
      protocol,
      baseUrl,
      apiKey,
      defaultModel,
      extraHeaders: parsedExtraHeaders,
      healthCheckEnabled,
    };

    if (protocol === "azure-openai") {
      input.azure = { deployment: azureDeployment, apiVersion: azureApiVersion };
    }

    if (protocol === "custom") {
      let parsedCustomHeaders: Record<string, string> = {};
      try {
        parsedCustomHeaders = customHeaders.trim() ? JSON.parse(customHeaders) : {};
      } catch {
        setError("Custom headers must be valid JSON");
        return;
      }
      input.custom = {
        method: customMethod,
        url: customUrl,
        headers: parsedCustomHeaders,
        bodyTemplate: customBody,
        responsePath: customResponsePath,
      };
    }

    setSubmitting(true);
    try {
      await onSubmit(input);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="glass-panel animate-fade-up flex flex-col gap-4 rounded-xl p-5">
      <div>
        <label className={labelClass}>Name</label>
        <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="My OpenRouter key" required />
      </div>

      <div>
        <label className={labelClass}>Protocol</label>
        <div role="radiogroup" className="flex flex-col gap-2">
          {PROTOCOLS.map((p) => {
            const selected = protocol === p.value;
            return (
              <button
                key={p.value}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => {
                  setProtocol(p.value);
                  setModelOptions([]);
                  setModelsError(null);
                  setConnStatus(null);
                }}
                className={`flex items-start gap-3 rounded-lg border px-3.5 py-2.5 text-left transition-colors duration-150 ${
                  selected
                    ? "border-cyan-300/40 bg-cyan-300/[0.06]"
                    : "border-white/10 bg-black/20 hover:border-white/20 hover:bg-white/[0.03]"
                }`}
              >
                <span
                  className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors duration-150 ${
                    selected ? "border-cyan-300" : "border-neutral-600"
                  }`}
                >
                  {selected && <span className="h-2 w-2 rounded-full bg-cyan-300" />}
                </span>
                <span className="flex flex-col gap-0.5">
                  <span className={`text-sm font-medium ${selected ? "text-cyan-100" : "text-neutral-200"}`}>
                    {p.title}
                  </span>
                  <span className="text-xs leading-snug text-neutral-500">{p.description}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className={labelClass}>Base URL</label>
        <input
          className={inputClass}
          value={baseUrl}
          onChange={(e) => setBaseUrl(e.target.value)}
          placeholder={protocol === "typesafe-eval" ? "https://api.typesafe.ai/v1" : "https://openrouter.ai/api/v1"}
          required
        />
      </div>

      <div>
        <label className={labelClass}>API key</label>
        <input className={inputClass} value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="sk-..." />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleTestConnection}
          disabled={testingConn}
          className={`${ghostButtonClass} disabled:opacity-50`}
        >
          {testingConn ? "Testing connection..." : "Test connection"}
        </button>
        {connStatus && (
          <span
            className={`flex items-center gap-1.5 text-xs ${connStatus.ok ? "text-emerald-300" : "text-red-300"}`}
          >
            <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${connStatus.ok ? "bg-emerald-400" : "bg-red-400"}`} />
            {connStatus.message} &middot; {connStatus.latencyMs}ms
          </span>
        )}
      </div>

      <div>
        <label className={labelClass}>Default model</label>
        {protocol === "custom" || protocol === "azure-openai" ? (
          <input
            className={inputClass}
            value={defaultModel}
            onChange={(e) => setDefaultModel(e.target.value)}
            placeholder="openai/gpt-4o-mini"
            required
          />
        ) : (
          <ModelCombobox
            value={defaultModel}
            onChange={setDefaultModel}
            options={modelOptions}
            loading={fetchingModels}
            error={modelsError}
            placeholder={protocol === "typesafe-eval" ? "jev-latest" : "openai/gpt-4o-mini"}
            required
            onOpen={onModelFieldOpen}
            onRefresh={() => loadModels(true)}
          />
        )}
      </div>

      <div>
        <label className={labelClass}>Extra headers (JSON, optional)</label>
        <textarea
          className={`${inputClass} font-mono`}
          rows={2}
          value={extraHeaders}
          onChange={(e) => setExtraHeaders(e.target.value)}
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-neutral-300">
        <input
          type="checkbox"
          checked={healthCheckEnabled}
          onChange={(e) => setHealthCheckEnabled(e.target.checked)}
        />
        Periodic health check (pings every 5 min, no completion cost -- feeds the Latency dashboard)
      </label>

      {protocol === "azure-openai" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Deployment name</label>
            <ModelCombobox
              value={azureDeployment}
              onChange={setAzureDeployment}
              options={modelOptions}
              loading={fetchingModels}
              error={modelsError}
              required
              onOpen={onModelFieldOpen}
              onRefresh={() => loadModels(true)}
            />
          </div>
          <div>
            <label className={labelClass}>API version</label>
            <input className={inputClass} value={azureApiVersion} onChange={(e) => setAzureApiVersion(e.target.value)} required />
          </div>
        </div>
      )}

      {protocol === "custom" && (
        <div className="flex flex-col gap-4 rounded-lg border border-white/10 bg-black/20 p-4">
          <div className="grid gap-4 sm:grid-cols-[100px_1fr]">
            <div>
              <label className={labelClass}>Method</label>
              <select className={inputClass} value={customMethod} onChange={(e) => setCustomMethod(e.target.value as "GET" | "POST")}>
                <option value="POST">POST</option>
                <option value="GET">GET</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>URL template</label>
              <input className={`${inputClass} font-mono`} value={customUrl} onChange={(e) => setCustomUrl(e.target.value)} required />
            </div>
          </div>
          <div>
            <label className={labelClass}>Headers template (JSON)</label>
            <textarea className={`${inputClass} font-mono`} rows={2} value={customHeaders} onChange={(e) => setCustomHeaders(e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Body template (JSON, ignored for GET)</label>
            <textarea className={`${inputClass} font-mono`} rows={3} value={customBody} onChange={(e) => setCustomBody(e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Response text path (dot-path)</label>
            <input
              className={`${inputClass} font-mono`}
              value={customResponsePath}
              onChange={(e) => setCustomResponsePath(e.target.value)}
              placeholder="choices.0.message.content"
              required
            />
          </div>
          <p className="text-xs text-neutral-500">
            Templates may use <code>{"{{baseUrl}}"}</code>, <code>{"{{apiKey}}"}</code>, <code>{"{{model}}"}</code>, <code>{"{{prompt}}"}</code>.
          </p>
        </div>
      )}

      {error && (
        <p className="rounded-lg border border-red-500/20 bg-red-500/[0.07] px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}

      <div className="flex gap-3 pt-1">
        <button type="submit" disabled={submitting} className={primaryButtonClass}>
          {submitting ? "Saving..." : initial ? "Save changes" : "Add gateway"}
        </button>
        <button type="button" onClick={onCancel} className={ghostButtonClass}>
          Cancel
        </button>
      </div>
    </form>
  );
}
