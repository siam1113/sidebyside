"use client";

import { useEffect, useState } from "react";
import { GatewayForm, type GatewayDraft } from "@/components/GatewayForm";
import { GatewayCard } from "@/components/GatewayCard";
import type { GatewayConfig, GatewayConfigInput, GatewayProtocol } from "@/lib/gateways/types";
import { invalidateGatewayModels } from "@/lib/gateways/modelsClient";

const PENDING_DRAFT_KEY = "pendingGatewayDraft";

export default function SettingsPage() {
  const [gateways, setGateways] = useState<GatewayConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<GatewayConfig | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [initialDraft, setInitialDraft] = useState<GatewayDraft | undefined>();

  // Deep-linked from elsewhere in the app (e.g. "/settings?protocol=typesafe-eval"),
  // optionally with a pre-filled draft (baseUrl/apiKey) stashed in sessionStorage
  // rather than the URL, so secrets never round-trip through a query string.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const protocolParam = params.get("protocol");
    if (!protocolParam) return;

    let draft: GatewayDraft = { protocol: protocolParam as GatewayProtocol };
    try {
      const stashed = sessionStorage.getItem(PENDING_DRAFT_KEY);
      if (stashed) {
        draft = { ...draft, ...(JSON.parse(stashed) as GatewayDraft) };
        sessionStorage.removeItem(PENDING_DRAFT_KEY);
      }
    } catch {
      // ignore malformed stash
    }

    setInitialDraft(draft);
    setEditing(null);
    setShowForm(true);
    window.history.replaceState(null, "", "/settings");
  }, []);

  async function refresh() {
    setLoading(true);
    try {
      const res = await fetch("/api/gateways");
      setGateways(await res.json());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/gateways");
        const data = await res.json();
        if (!cancelled) setGateways(data);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleCreate(input: GatewayConfigInput) {
    const res = await fetch("/api/gateways", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error ?? "Failed to create gateway");
    }
    setShowForm(false);
    setInitialDraft(undefined);
    await refresh();
  }

  async function handleUpdate(id: string, input: GatewayConfigInput) {
    const res = await fetch(`/api/gateways/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error ?? "Failed to update gateway");
    }
    // baseUrl/apiKey/protocol may have changed -- the cached model list no
    // longer necessarily matches what this gateway id actually serves.
    invalidateGatewayModels(id);
    setEditing(null);
    await refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this gateway config?")) return;
    await fetch(`/api/gateways/${id}`, { method: "DELETE" });
    invalidateGatewayModels(id);
    await refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="animate-fade-up flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-50">Gateway Settings</h1>
          <p className="mt-1.5 text-sm text-neutral-400">
            Configs are stored locally in{" "}
            <code className="rounded bg-white/[0.06] px-1.5 py-0.5 font-mono text-[13px] text-neutral-300">
              data/gateways.json
            </code>{" "}
            (gitignored) and never leave this machine.
          </p>
        </div>
        {!showForm && (
          <button
            onClick={() => {
              setEditing(null);
              setInitialDraft(undefined);
              setShowForm(true);
            }}
            className="btn-cta shrink-0 rounded-lg px-4 py-2 text-sm font-semibold"
          >
            Add gateway
          </button>
        )}
      </div>

      {showForm && !editing && (
        <GatewayForm
          initialDraft={initialDraft}
          onSubmit={handleCreate}
          onCancel={() => {
            setShowForm(false);
            setInitialDraft(undefined);
          }}
        />
      )}

      {editing && (
        <GatewayForm
          initial={editing}
          onSubmit={(input) => handleUpdate(editing.id, input)}
          onCancel={() => setEditing(null)}
        />
      )}

      {loading ? (
        <div className="flex flex-col gap-3">
          {[0, 1].map((i) => (
            <div key={i} className="animate-shimmer h-[68px] rounded-xl" />
          ))}
        </div>
      ) : gateways.length === 0 ? (
        <p className="text-neutral-400">No gateways configured yet.</p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {gateways.map((gw, i) => (
            <GatewayCard
              key={gw.id}
              gateway={gw}
              index={i}
              onEdit={() => {
                setShowForm(false);
                setEditing(gw);
              }}
              onDelete={() => handleDelete(gw.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
