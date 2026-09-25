import type { Attachment, GatewayConfig, RunParams, RunResult } from "../types";
import { run as runOpenAi, runWithTools as runOpenAiWithTools } from "./openai";
import { run as runAnthropic, runWithTools as runAnthropicWithTools } from "./anthropic";
import { run as runAzureOpenAi, runWithTools as runAzureOpenAiWithTools } from "./azureOpenai";
import { run as runGoogleGemini, runWithTools as runGoogleGeminiWithTools } from "./googleGemini";
import { run as runCustom } from "./custom";
import type { ChatMessage, ToolDef, ToolTurnResult } from "./toolTypes";

export async function runGateway(
  config: GatewayConfig,
  prompt: string,
  model?: string,
  params?: RunParams,
  attachments?: Attachment[],
): Promise<RunResult> {
  switch (config.protocol) {
    case "openai":
      return runOpenAi(config, prompt, model, params, attachments);
    case "anthropic":
      return runAnthropic(config, prompt, model, params, attachments);
    case "azure-openai":
      return runAzureOpenAi(config, prompt, params, attachments);
    case "google-gemini":
      return runGoogleGemini(config, prompt, model, params, attachments);
    case "custom":
      return runCustom(config, prompt, model, params, attachments);
    case "typesafe-eval":
      return {
        gatewayId: config.id,
        text: "",
        latencyMs: 0,
        raw: null,
        error: "This is a TypeSafe Evaluation gateway -- use the Evaluation tab instead of Chat.",
      };
    default: {
      const exhaustiveCheck: never = config.protocol;
      throw new Error(`Unknown protocol: ${exhaustiveCheck}`);
    }
  }
}

/** Tool-calling counterpart to runGateway(), used by the MCP agent loop. Custom and
 *  TypeSafe Eval gateways have no stable tool-calling contract, so they return an error
 *  ToolTurnResult instead of throwing -- callers (the agent loop) treat that like any other
 *  failed turn. */
export async function runGatewayWithTools(
  config: GatewayConfig,
  model: string | undefined,
  params: RunParams | undefined,
  messages: ChatMessage[],
  tools: ToolDef[],
): Promise<ToolTurnResult> {
  switch (config.protocol) {
    case "openai":
      return runOpenAiWithTools(config, model, params, messages, tools);
    case "anthropic":
      return runAnthropicWithTools(config, model, params, messages, tools);
    case "azure-openai":
      return runAzureOpenAiWithTools(config, model, params, messages, tools);
    case "google-gemini":
      return runGoogleGeminiWithTools(config, model, params, messages, tools);
    case "custom":
      return { latencyMs: 0, raw: null, error: "Custom gateways don't support tool calling -- their body template has no stable place to inject a tools array." };
    case "typesafe-eval":
      return { latencyMs: 0, raw: null, error: "This is a TypeSafe Evaluation gateway -- it has no chat/tool-calling endpoint." };
    default: {
      const exhaustiveCheck: never = config.protocol;
      throw new Error(`Unknown protocol: ${exhaustiveCheck}`);
    }
  }
}
