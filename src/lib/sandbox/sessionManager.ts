import { randomUUID } from "node:crypto";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import * as pty from "node-pty";
import type { IPty } from "node-pty";
import { getGateway } from "@/lib/gateways/store";
import { buildToolEnv, type SandboxTool } from "./envMapping";
import { buildDockerArgs } from "./dockerArgs";

const execFileAsync = promisify(execFile);

interface SessionRecord {
  id: string;
  tool: SandboxTool;
  containerName: string;
  env: Record<string, string>;
  model: string;
  ptyProcess: IPty | null;
  status: "pending" | "running" | "stopped";
  createdAt: string;
  groupId?: string;
  label?: string;
  /** Typed into the terminal (not submitted) shortly after the CLI starts -- see spawnSession. */
  initialPrompt?: string;
}

const sessions = new Map<string, SessionRecord>();

export type CreateSessionResult =
  | { ok: true; sessionId: string }
  | { ok: false; error: string };

export interface SessionSummary {
  id: string;
  tool: SandboxTool;
  model: string;
  status: SessionRecord["status"];
  createdAt: string;
  groupId?: string;
  label?: string;
}

export interface CreateSessionOptions {
  groupId?: string;
  label?: string;
  initialPrompt?: string;
}

export async function createSession(
  tool: SandboxTool,
  gatewayId: string,
  modelOverride?: string,
  options?: CreateSessionOptions,
): Promise<CreateSessionResult> {
  const gateway = await getGateway(gatewayId);
  if (!gateway) return { ok: false, error: "Gateway not found" };

  const mapping = buildToolEnv(tool, gateway, modelOverride);
  if (!mapping.ok) return { ok: false, error: mapping.error };

  const id = randomUUID();
  sessions.set(id, {
    id,
    tool,
    containerName: `sandbox-${id}`,
    env: mapping.env,
    model: mapping.model,
    ptyProcess: null,
    status: "pending",
    createdAt: new Date().toISOString(),
    groupId: options?.groupId,
    label: options?.label,
    initialPrompt: options?.initialPrompt,
  });
  return { ok: true, sessionId: id };
}

export function getSession(id: string): SessionRecord | undefined {
  return sessions.get(id);
}

/** Newest first -- what the "active sessions" UI lists and polls. */
export function listSessions(): SessionSummary[] {
  return [...sessions.values()]
    .map((r) => ({
      id: r.id,
      tool: r.tool,
      model: r.model,
      status: r.status,
      createdAt: r.createdAt,
      groupId: r.groupId,
      label: r.label,
    }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function spawnSession(
  id: string,
  cols: number,
  rows: number,
): Promise<IPty | null> {
  const record = sessions.get(id);
  if (!record) return null;
  if (record.status !== "pending") return record.ptyProcess;

  const args = await buildDockerArgs(id, record.tool, record.env, record.model);
  const ptyProcess = pty.spawn("docker", args, {
    name: "xterm-256color",
    cols,
    rows,
    cwd: process.cwd(),
    env: process.env as Record<string, string>,
  });
  record.ptyProcess = ptyProcess;
  record.status = "running";

  ptyProcess.onExit(() => {
    const current = sessions.get(id);
    if (current) {
      current.status = "stopped";
      current.ptyProcess = null;
    }
  });

  if (record.initialPrompt) {
    const prompt = record.initialPrompt;
    // Typed (not submitted) into the terminal once the CLI's had a moment to
    // start up -- there's no reliable "ready" signal from these interactive
    // CLIs to hook instead, and the user reviewing before hitting Enter makes
    // a fixed delay fine even when it's a bit early or late.
    setTimeout(() => {
      if (sessions.get(id)?.ptyProcess === ptyProcess) {
        ptyProcess.write(prompt);
      }
    }, 2500);
  }

  return ptyProcess;
}

async function dockerStop(containerName: string): Promise<void> {
  try {
    await execFileAsync("docker", ["stop", "-t", "2", containerName]);
  } catch {
    // container may already be gone -- fine.
  }
}

export async function stopSession(id: string): Promise<void> {
  const record = sessions.get(id);
  if (!record) return;
  record.ptyProcess?.kill();
  sessions.delete(id);
  await dockerStop(record.containerName);
}

export async function stopAllSessions(): Promise<void> {
  await Promise.all([...sessions.keys()].map((id) => stopSession(id)));
}

/**
 * Stops any container labeled ai-gateway-sandbox=true that this process
 * doesn't know about -- the real orphan-proofing, since the in-memory
 * session map is wiped on every server restart/crash.
 */
export async function sweepOrphans(): Promise<void> {
  try {
    const { stdout } = await execFileAsync("docker", [
      "ps",
      "--filter",
      "label=ai-gateway-sandbox=true",
      "--format",
      "{{.Names}}",
    ]);
    const names = stdout
      .split("\n")
      .map((n) => n.trim())
      .filter(Boolean);
    if (names.length === 0) return;
    await Promise.all(names.map((name) => dockerStop(name)));
    console.log(
      `[sandbox] Swept ${names.length} orphaned container(s): ${names.join(", ")}`,
    );
  } catch (err) {
    console.warn("[sandbox] Orphan sweep failed (is Docker running?):", err);
  }
}
