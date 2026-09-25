import type { SessionSummary } from "./sessionManager";
import type { SandboxTool } from "./envMapping";

export type { SessionSummary };

export interface HarnessLaunch {
  tool: SandboxTool;
  gatewayId: string;
  model?: string;
}

export type GroupSessionResult =
  | { tool: string; sessionId: string }
  | { tool: string; error: string };

export async function createSandboxGroup(
  harnesses: HarnessLaunch[],
  prompt: string,
): Promise<{ groupId: string; sessions: GroupSessionResult[] }> {
  const res = await fetch("/api/sandbox/groups", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ harnesses, prompt }),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error ?? "Failed to launch sandbox group");
  return body;
}

export async function listSandboxSessions(): Promise<SessionSummary[]> {
  const res = await fetch("/api/sandbox/sessions");
  if (!res.ok) throw new Error("Failed to list sandbox sessions");
  const body = await res.json();
  return (body.sessions ?? []) as SessionSummary[];
}

export async function stopSandboxSession(id: string): Promise<void> {
  const res = await fetch(`/api/sandbox/sessions/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? "Failed to stop sandbox session");
  }
}
