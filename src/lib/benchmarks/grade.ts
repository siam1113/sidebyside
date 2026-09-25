import type { EvalAnswer, EvalRequestBody, EvalResult, GatewayConfig } from "@/lib/gateways/types";
import type { GradeOutcome, GradingStrategy } from "@/components/benchmarks/types";

function normalize(text: string, caseSensitive: boolean): string {
  return caseSensitive ? text : text.toLowerCase();
}

export function gradeAssertion(
  strategy: Extract<GradingStrategy, { kind: "assertion" }>,
  responseText: string,
): GradeOutcome {
  const { mode, value, caseSensitive } = strategy;

  if (mode === "regex") {
    try {
      const re = new RegExp(value, caseSensitive ? "" : "i");
      const pass = re.test(responseText);
      return { status: "graded", pass, detail: pass ? `matched /${value}/` : `did not match /${value}/` };
    } catch (err) {
      return { status: "error", message: `Invalid regex: ${err instanceof Error ? err.message : String(err)}` };
    }
  }

  const haystack = normalize(responseText, caseSensitive);
  const needle = normalize(value, caseSensitive);

  switch (mode) {
    case "contains": {
      const pass = haystack.includes(needle);
      return { status: "graded", pass, detail: pass ? `contains "${value}"` : `missing "${value}"` };
    }
    case "not-contains": {
      const pass = !haystack.includes(needle);
      return { status: "graded", pass, detail: pass ? `does not contain "${value}"` : `unexpectedly contains "${value}"` };
    }
    case "equals": {
      const pass = haystack.trim() === needle.trim();
      return { status: "graded", pass, detail: pass ? "exact match" : `expected exactly "${value}"` };
    }
    default: {
      const exhaustiveCheck: never = mode;
      return { status: "error", message: `Unknown assertion mode: ${exhaustiveCheck}` };
    }
  }
}

export async function gradeWithJudge(
  strategy: Extract<GradingStrategy, { kind: "judge" }>,
  judgeGateway: GatewayConfig,
  prompt: string,
  responseText: string,
): Promise<GradeOutcome> {
  const body: EvalRequestBody = {
    state: `Prompt:\n${prompt}\n\nResponse:\n${responseText}`,
    questions: {
      grade: { type: "score", instructions: strategy.rubric, criteria: ["1", "2", "3", "4", "5"] },
    },
  };

  let result: EvalResult;
  try {
    const res = await fetch(`/api/evaluate/${judgeGateway.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    result = (await res.json()) as EvalResult;
  } catch (err) {
    return { status: "error", message: err instanceof Error ? err.message : String(err) };
  }

  if (result.error) {
    return { status: "error", message: result.error };
  }

  const answer: EvalAnswer | undefined = result.answers.grade;
  if (!answer || answer.type !== "score") {
    return { status: "error", message: "Judge did not return a score answer" };
  }

  const pass = answer.score >= strategy.passThreshold;
  return {
    status: "graded",
    pass,
    detail: `${answer.score}/5 (threshold ${strategy.passThreshold})`,
    score: answer.score,
  };
}
