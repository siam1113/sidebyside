import path from "node:path";
import { readFile } from "node:fs/promises";
import type { SandboxTool } from "./envMapping";

export const IMAGE_NAME = "ai-gateway-sandbox:latest";
const CODEX_TEMPLATE_PATH = path.join(
  process.cwd(),
  "docker",
  "codex-config.toml.tmpl",
);

export async function buildDockerArgs(
  sessionId: string,
  tool: SandboxTool,
  env: Record<string, string>,
  model: string,
): Promise<string[]> {
  const finalEnv: Record<string, string> = { ...env, TOOL: tool };

  if (tool === "codex") {
    const template = await readFile(CODEX_TEMPLATE_PATH, "utf-8");
    const rendered = template
      .replaceAll("{{MODEL}}", model)
      .replaceAll("{{BASE_URL}}", env.OPENAI_BASE_URL ?? "");
    finalEnv.CODEX_CONFIG_TOML_B64 = Buffer.from(rendered, "utf-8").toString(
      "base64",
    );
  }

  const envArgs = Object.entries(finalEnv).flatMap(([key, value]) => [
    "-e",
    `${key}=${value}`,
  ]);

  return [
    "run",
    "--rm",
    "-i",
    "-t",
    "--name",
    `sandbox-${sessionId}`,
    "--label",
    "ai-gateway-sandbox=true",
    "--cpus",
    "2",
    "--memory",
    "2g",
    "--pids-limit",
    "256",
    "--security-opt",
    "no-new-privileges",
    "--cap-drop",
    "ALL",
    ...envArgs,
    IMAGE_NAME,
  ];
}
