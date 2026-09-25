import type { GatewayConfig, RunParams, RunResult } from "@/lib/gateways/types";

export type AssertionMode = "contains" | "not-contains" | "equals" | "regex";

export type GradingStrategy =
  | { kind: "assertion"; mode: AssertionMode; value: string; caseSensitive: boolean }
  | { kind: "judge"; judgeGatewayId: string; rubric: string; passThreshold: number };

export interface TestCase {
  id: string;
  name: string;
  prompt: string;
  /** Falls back to the target gateway's defaultModel when blank, and is ignored
   *  entirely for a run that picks explicit run-level models. */
  modelOverride?: string;
  params?: RunParams;
  grading: GradingStrategy;
}

export type GradeOutcome =
  | { status: "graded"; pass: boolean; detail: string; score?: number }
  | { status: "error"; message: string };

/** One named system-prompt variation to run every selected test case against.
 *  The default (no variants configured) is the single no-op entry below. */
export interface PromptVariant {
  id: string;
  /** Empty for the default (no-variant) case -- nothing extra to show in the column header. */
  label: string;
  systemPrompt?: string;
}

export const DEFAULT_PROMPT_VARIANT: PromptVariant = { id: "default", label: "" };

/** One (gateway, model, variant) triple -- a single column in the results matrix. */
export interface RunTarget {
  key: string;
  gateway: GatewayConfig;
  modelId: string;
  variant: PromptVariant;
}

export function targetKey(gatewayId: string, modelId: string, variantId: string): string {
  return `${gatewayId}::${modelId}::${variantId}`;
}

/** One repetition of a (test case, target) run -- either the HTTP call itself failed,
 *  or it succeeded and was graded (grading can still separately fail). */
export type AttemptOutcome =
  | { kind: "run-error"; message: string }
  | { kind: "graded"; run: RunResult; grade: GradeOutcome };

export type CellState =
  | { status: "idle" }
  | { status: "running" }
  | { status: "done"; attempts: AttemptOutcome[] };

export function cellKey(testCaseId: string, targetKeyStr: string): string {
  return `${testCaseId}::${targetKeyStr}`;
}
