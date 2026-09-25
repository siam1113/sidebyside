import type { RunParams } from "@/lib/gateways/types";

/** Merges run-level parameter overrides with a test case's own -- the test case
 *  wins for any field it actually set; the run-level value only fills gaps. */
export function mergeParams(runParams: RunParams, testCaseParams: RunParams | undefined): RunParams {
  const merged: RunParams = { ...runParams };
  if (!testCaseParams) return merged;
  for (const [key, value] of Object.entries(testCaseParams) as Array<[keyof RunParams, RunParams[keyof RunParams]]>) {
    if (value !== undefined) {
      (merged as Record<string, unknown>)[key] = value;
    }
  }
  return merged;
}
