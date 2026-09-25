import type { LearnModule } from "../types";

const puttingItTogetherModule: LearnModule = {
  slug: "putting-it-together",
  title: "Putting It Together",
  tagline: "Map everything you've learned onto the actual platform",
  description: "A tour connecting each concept to the tab it lives in, plus a glossary to keep nearby.",
  lessons: [
    {
      slug: "platform-tour",
      title: "A Tour of SideBySide",
      summary: "Every tab, and the concept from this course it puts into practice.",
      minutes: 5,
      blocks: [
        {
          type: "heading",
          text: "Why This Tour Matters",
        },
        {
          type: "p",
          text: "SideBySide has seven tabs. Each one is really a hands-on version of something covered in this course.",
        },
        {
          type: "p",
          text: "The tabs also aren't seven unrelated tools -- they follow the same order most people actually work in. You register a gateway in Settings, run prompts against it in Playground, check the model catalog in Insights, formalize what you learned into a repeatable suite in Benchmarks, write down the choice you made in Decisions, and hook up outside tools through MCP Servers along the way. Sandbox sits off to the side as the place you actually build with whatever you picked.",
        },
        {
          type: "heading",
          text: "Tab by Tab",
        },
        {
          type: "compare",
          headers: ["Tab", "What it does", "Concepts from this course"],
          rows: [
            [
              "Playground",
              "Send one prompt to multiple gateways/models at once, compare responses",
              "Prompts, tokens, gateways vs. providers, reading a comparison",
            ],
            [
              "Insights",
              "Every model across every gateway side by side -- context window, cost, modality",
              "Context windows, cost per million tokens, latency/throughput",
            ],
            [
              "Sandbox",
              "Run Claude Code / Codex CLI / Copilot CLI in an isolated container",
              "Coding agents, sandboxing, MCP tool access",
            ],
            [
              "Benchmarks",
              "Define test cases, run them across configs, grade with rules or an LLM judge",
              "Benchmarks, deterministic assertions, LLM-as-judge",
            ],
            [
              "Decisions",
              "Record which model/gateway was chosen, why, and the evidence behind it",
              "Recording decisions, rationale, alternatives",
            ],
            [
              "MCP Servers",
              "Register servers, test connections, inspect exposed tools/resources/prompts",
              "MCP, tools vs. resources vs. prompts",
            ],
            ["Settings", "Register gateway configs used everywhere else in the app", "APIs, API keys, providers vs. gateways"],
          ],
        },
      ],
      quiz: [
        {
          question: "Which tab would you use to check a model's context window before sending it a long document?",
          options: ["Sandbox", "Insights", "Decisions", "MCP Servers"],
          correctIndex: 1,
          explanation: "Insights lists context window, output cap, and pricing for every model across every registered gateway.",
        },
        {
          question:
            "Where would you record why you chose a specific model for production, with links to the runs that proved it out?",
          options: ["Playground", "Decisions", "Settings", "Sandbox"],
          correctIndex: 1,
          explanation: "Decisions is built specifically to capture the choice, its rationale, alternatives considered, and linked evidence.",
        },
        {
          question: "Which tab lets you send the same prompt to multiple gateways/models at once and compare responses side by side?",
          options: ["Playground", "Insights", "Settings", "Decisions"],
          correctIndex: 0,
          explanation: "Playground is the side-by-side prompt comparison tool -- one prompt, several response cards at once.",
        },
        {
          question: "Which tab launches Claude Code, Codex CLI, or Copilot CLI inside an isolated, throwaway container?",
          options: ["Benchmarks", "MCP Servers", "Sandbox", "Insights"],
          correctIndex: 2,
          explanation: "Sandbox is where coding agents actually run, wired to a chosen gateway but isolated from your real machine.",
        },
        {
          question: "Which tab lets you register an MCP server and see exactly which tools, resources, and prompts it exposes?",
          options: ["MCP Servers", "Settings", "Benchmarks", "Playground"],
          correctIndex: 0,
          explanation: "MCP Servers is where you register a server, test the connection live, and inspect what it offers before wiring it into an agent.",
        },
      ],
    },
    {
      slug: "glossary",
      title: "Glossary Quick Reference",
      summary: "Every term from this course, in one place.",
      minutes: 3,
      blocks: [
        {
          type: "heading",
          text: "Glossary",
        },
        {
          type: "terms",
          items: [
            { term: "LLM", def: "A model trained to predict the next piece of text, given everything written so far." },
            { term: "Token", def: "The basic unit of text a model reads/generates -- roughly a word-piece." },
            { term: "Context window", def: "The total input+output token budget for one request." },
            { term: "Prompt", def: "The text sent to a model to get a response." },
            { term: "System prompt", def: "Standing background instructions set before a conversation starts." },
            { term: "Temperature", def: "Setting that controls how random/creative vs. focused the output is." },
            { term: "API", def: "A defined way for software to request an action from other software, over a network." },
            { term: "API key", def: "A secret string that authorizes and bills your requests to a provider." },
            { term: "Gateway", def: "A single API in front of multiple providers, adding routing, fallback, and cost tracking." },
            { term: "Provider", def: "The company that trains and directly serves a model (Anthropic, OpenAI, Google, etc.)." },
            { term: "Routing", def: "Sending a request to a specific model/provider based on rules." },
            { term: "Fallback", def: "Automatically retrying with a backup model/provider on failure." },
            { term: "Latency", def: "How long a request takes, end to end." },
            { term: "TTFT", def: "Time to first token -- how long before output starts streaming." },
            { term: "Throughput", def: "Tokens generated per second, once streaming has started." },
            { term: "Cost per million tokens", def: "The standard unit model pricing is quoted in." },
            { term: "Benchmark", def: "A fixed, repeatable set of test cases run against one or more models." },
            { term: "Deterministic assertion", def: "A hard, code-checkable pass/fail rule for grading a response." },
            { term: "LLM-as-judge", def: "Using a second model to grade a response against a rubric." },
            { term: "Rubric", def: "The explicit criteria given to a judge model for grading." },
            { term: "Decision record", def: "A written account of a choice, its rationale, and alternatives considered." },
            { term: "Coding agent", def: "An LLM wired up to take real actions (edit files, run commands) in a loop." },
            { term: "Sandbox / container", def: "An isolated, throwaway environment code can run in without touching the real machine." },
            { term: "MCP", def: "Model Context Protocol -- a standard way for agents to connect to external tools and data." },
            { term: "MCP tool", def: "An invokable action an MCP server exposes." },
            { term: "MCP resource", def: "Readable data an MCP server exposes." },
            { term: "MCP prompt", def: "A reusable prompt template an MCP server exposes." },
          ],
        },
      ],
      quiz: [
        {
          question: "Which term describes the maximum number of input-plus-output tokens a model can consider in one request?",
          options: ["Context window", "Throughput", "Rubric", "API key"],
          correctIndex: 0,
          explanation: "The context window is the shared token budget for a request -- prompt, history, and the reply all draw from it.",
        },
        {
          question: "Which term describes automatically retrying with a backup model or provider when the primary one fails?",
          options: ["Routing", "Fallback", "Caching", "Latency"],
          correctIndex: 1,
          explanation: "Fallback is the gateway feature that reroutes to a backup on failure, keeping your app up during an outage.",
        },
        {
          question: "Which term names the wait before a model starts streaming any output at all?",
          options: ["Throughput", "Context window", "TTFT", "Temperature"],
          correctIndex: 2,
          explanation: "TTFT (time to first token) measures the delay before generation starts streaming -- distinct from total latency.",
        },
        {
          question: "Which term describes a hard, code-checkable pass/fail rule used to grade a benchmark response?",
          options: ["Rubric", "Deterministic assertion", "Decision record", "System prompt"],
          correctIndex: 1,
          explanation: "A deterministic assertion is an unambiguous, code-evaluated check, unlike an LLM-judge's rubric-based grading.",
        },
        {
          question: "Which term describes an LLM wired up to take real actions like editing files or running commands, in a loop?",
          options: ["Provider", "Gateway", "Coding agent", "MCP resource"],
          correctIndex: 2,
          explanation: "A coding agent thinks, acts, and observes the result in a loop -- it does things, not just describes them.",
        },
      ],
    },
  ],
  test: [
    {
      question: "Which tab lets you register the gateways (LiteLLM, OpenRouter, Portkey, etc.) that every other tab pulls its model list from?",
      options: ["Settings", "Insights", "Decisions", "MCP Servers"],
      correctIndex: 0,
      explanation: "Settings is where gateway configs are registered once and then become selectable everywhere else in the app.",
    },
    {
      question: "Which term describes a fixed, repeatable set of test cases run against one or more models, which the Benchmarks tab is built around?",
      options: ["Benchmark", "Prompt", "Token", "Rubric"],
      correctIndex: 0,
      explanation: "A benchmark is the repeatable test suite itself -- a rubric is just one possible grading criterion within it.",
    },
    {
      question: "You suspect an MCP server integration silently broke after a config change. Which tab lets you test the connection live and see exactly what it exposes?",
      options: ["MCP Servers", "Sandbox", "Settings", "Decisions"],
      correctIndex: 0,
      explanation: "MCP Servers is where you register a server and test its live connection, inspecting its tools/resources/prompts.",
    },
    {
      question: "Which term is the standard unit LLM API pricing is quoted in?",
      options: ["Cost per million tokens", "Context window", "Throughput", "TTFT"],
      correctIndex: 0,
      explanation: "Model pricing is standardly quoted as cost per million tokens, usually split between input and output rates.",
    },
    {
      question: "A coding agent needs to run arbitrary shell commands to complete a task. Which platform feature makes this safe, and what's the isolation mechanism called?",
      options: [
        "Sandbox, using a throwaway Docker container",
        "Playground, using a cached response",
        "Insights, using a rate limit",
        "Decisions, using a rubric",
      ],
      correctIndex: 0,
      explanation: "Sandbox runs agents inside a throwaway Docker container with no host volume mounts, so nothing touches the real machine.",
    },
    {
      question: "Which tab is where you'd record which model was chosen for production and why, linking to the runs that backed it up?",
      options: ["Decisions", "Playground", "Settings", "Insights"],
      correctIndex: 0,
      explanation: "Decisions captures the choice, its rationale, alternatives considered, and links to the evidence behind it.",
    },
    {
      question: "Which term describes the wait before a model starts streaming its first token, a number Insights breaks out separately from total latency?",
      options: ["TTFT", "Throughput", "Output cap", "Rubric"],
      correctIndex: 0,
      explanation: "TTFT (time to first token) is reported separately from throughput and total latency, since each affects a different use case.",
    },
    {
      question: "MCP servers can expose three kinds of things to an agent. Which of these is NOT one of them?",
      options: ["Tools", "Resources", "Prompts", "Gateways"],
      correctIndex: 3,
      explanation: "MCP servers expose tools, resources, and prompts -- gateways are a separate concept from the LLM-provider layer, not an MCP primitive.",
    },
  ],
};

export default puttingItTogetherModule;
