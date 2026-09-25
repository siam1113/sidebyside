import type { FinalExam } from "./types";

// 20 questions spanning all five modules -- written after every module's
// content was finalized, so it can pull from the whole picture without
// duplicating any lesson-quiz or module-test question.
export const FINAL_EXAM: FinalExam = {
  title: "Final Exam",
  description: "20 questions spanning every module -- the last check before you call yourself fluent in this platform.",
  questions: [
    {
      question:
        "A model has a 128K-token context window. You send a 100K-token document, a 500-token question, and ask for a 2K-token summary. Does this fit?",
      options: [
        "No, only the document counts against the window",
        "Yes -- 100K + 500 + 2K is comfortably under 128K, and input plus output share the same budget",
        "No, output tokens don't count against the context window so it's irrelevant either way",
        "It's impossible to know without knowing the temperature",
      ],
      correctIndex: 1,
      explanation:
        "The context window is a shared budget for input plus output combined -- roughly 102,500 tokens here, well under the 128K limit.",
    },
    {
      question: "Which best describes why an LLM can write a coherent multi-paragraph answer despite having no explicit 'planning' step?",
      options: [
        "It secretly runs a separate planning algorithm before generating any text",
        "Coherence emerges token by token -- each new token is predicted using everything generated so far, so the 'plan' forms as it goes rather than being decided upfront",
        "It always copies the structure from a memorized document",
        "Planning isn't actually required for any generated text to be coherent",
      ],
      correctIndex: 1,
      explanation:
        "Generation is autoregressive: each token is conditioned on everything before it, including the model's own prior output, which is how structure and coherence emerge without a separate planning phase.",
    },
    {
      question: "You're brainstorming ten wildly different taglines for a product launch. Which generation setting should you lean toward, and why?",
      options: [
        "Low temperature, so every tagline is nearly identical and safe",
        "Higher temperature, since more randomness in next-token sampling produces more varied, less predictable output",
        "Temperature has no effect on variety, only on speed",
        "Max tokens set to 1, to force short taglines",
      ],
      correctIndex: 1,
      explanation: "Higher temperature widens the model's willingness to sample less-likely tokens, which is exactly what produces varied, less repetitive output across multiple generations.",
    },
    {
      question: "A chatbot has no access to what the user said two messages ago, even though the user assumes it does. What's the most likely explanation?",
      options: [
        "The model has a memory limit of one message by design and can never be fixed",
        "The application isn't resending prior conversation turns alongside the new message, so each request looks like a blank slate to the model",
        "The user's second message exceeded the context window",
        "Temperature was set to 0",
      ],
      correctIndex: 1,
      explanation:
        "Models have no memory between separate requests -- if earlier turns aren't explicitly included in the new request, the model genuinely has no way to know what was said before.",
    },
    {
      question: "A public GitHub repo accidentally includes a hardcoded API key in a committed file. What's the realistic risk, even if the repo is deleted five minutes later?",
      options: [
        "None, deleting the repo instantly erases all trace of the key everywhere",
        "The key may already have been scraped by automated bots that continuously scan public commits, so it should be treated as compromised and rotated immediately",
        "Only a risk if the repo has more than 1,000 stars",
        "API keys can't be extracted from committed files, only from live servers",
      ],
      correctIndex: 1,
      explanation:
        "Public commits are scraped by bots within minutes; deleting the repo afterward doesn't undo an exposure that already happened -- the only safe move is rotating the key.",
    },
    {
      question: "Which pairing correctly separates a model provider from an LLM gateway?",
      options: [
        "Google Gemini is a provider; Portkey is a gateway",
        "Portkey is a provider; Google Gemini is a gateway",
        "Both are gateways",
        "Both are providers",
      ],
      correctIndex: 0,
      explanation: "Google trains and directly serves Gemini (a provider); Portkey is a managed layer that sits in front of providers like Google, Anthropic, and OpenAI (a gateway).",
    },
    {
      question: "A team wants cheap, fast responses for simple FAQ queries but a stronger model for complex troubleshooting, all through one integration. What gateway feature is this?",
      options: ["Caching", "Routing by request type", "Rate limiting", "A decision record"],
      correctIndex: 1,
      explanation: "This is a routing rule -- directing different kinds of requests to different models/providers based on criteria you define, through one consistent interface.",
    },
    {
      question: "A company needs full control over its LLM infrastructure for compliance reasons and is willing to run its own servers. Which option fits best?",
      options: [
        "A hosted gateway like OpenRouter",
        "A self-hosted gateway like LiteLLM",
        "Calling a provider's consumer chat app directly",
        "This isn't possible with any current option",
      ],
      correctIndex: 1,
      explanation:
        "Self-hosting (LiteLLM being the common open-source choice) trades setup convenience for full control over infrastructure and data flow, which is exactly what strict compliance requirements often demand.",
    },
    {
      question: "Two models answer the same prompt. Model A is 20% cheaper per token but its response uses twice as many tokens as Model B's equally good answer. Which actually costs less for this response?",
      options: [
        "Model A, since it's always cheaper per token",
        "Model B, since total cost is price-per-token multiplied by tokens used, and B used half as many",
        "They cost exactly the same",
        "There's no way to determine this from the given information",
      ],
      correctIndex: 1,
      explanation: "Total cost is price times quantity -- a lower per-token price can still lose to a model that needs far fewer tokens to say the same thing.",
    },
    {
      question: "A voice assistant needs to start speaking almost immediately after a request, even if the full answer takes a couple seconds to finish generating. Which metric matters most here?",
      options: ["Time to first token (TTFT)", "Total tokens in the model's training set", "Context window size", "Cost per million tokens"],
      correctIndex: 0,
      explanation: "TTFT is specifically about how long before output starts streaming -- the number that determines how quickly a voice assistant can begin speaking.",
    },
    {
      question: "You need a test case to verify a model's output is always exactly one of five fixed category labels. What kind of check fits best?",
      options: ["An LLM-as-judge rubric", "A deterministic assertion checking membership in the fixed set", "A decision record", "A resource block"],
      correctIndex: 1,
      explanation: "Checking membership in a fixed, known set of values is an unambiguous, code-checkable rule -- exactly what deterministic assertions are for, with no need for a judge model.",
    },
    {
      question: "After using an LLM judge to compare two models across 200 rubric-graded test cases, what's the recommended next step to make the resulting choice durable for the team?",
      options: [
        "Nothing further is needed, the benchmark result speaks for itself forever",
        "Record the decision -- which model was chosen, the rationale, alternatives considered, and links to the benchmark run as evidence",
        "Delete the losing model's test cases so nobody re-litigates it",
        "Re-run the exact same 200 cases every day indefinitely",
      ],
      correctIndex: 1,
      explanation:
        "A benchmark result is evidence, not a permanent record on its own -- writing the decision down with its rationale and linked evidence is what keeps the reasoning from being lost later.",
    },
    {
      question: "A coding agent is midway through its think-act-observe loop when a file-edit action fails with a permissions error. What happens next in a well-behaved agent?",
      options: [
        "The loop terminates instantly with no explanation",
        "The error result gets fed back into the model's context, and it decides its next action based on that failure -- for example, trying a different approach",
        "The agent ignores the error and pretends the edit succeeded",
        "The agent restarts the entire task from scratch every time any action fails",
      ],
      correctIndex: 1,
      explanation: "The observe step is what makes it a loop -- the outcome of every action, including failures, becomes context the model uses to decide what to do next.",
    },
    {
      question: "A coding agent running inside Sandbox is instructed (incorrectly) to run a command that would delete important files. What actually happens?",
      options: [
        "Your real files on your host machine are deleted",
        "At most, files inside the throwaway container are affected -- since no host folders are mounted, your real machine's files are never reachable",
        "The command silently does nothing anywhere",
        "Docker prevents any file deletion in any context"
      ],
      correctIndex: 1,
      explanation: "Because Sandbox never mounts host volumes, even a destructive command run inside the container has no path to your real machine's files -- the damage, if any, is confined to the disposable container.",
    },
    {
      question: "In the USB-C analogy for MCP, what does the 'agent connecting through a standard protocol instead of a custom integration' correspond to?",
      options: [
        "A proprietary charging cable that only works with one specific device",
        "A USB-C device plugging into any USB-C port without needing its own custom adapter",
        "A device with no port at all",
        "An electrical outlet with no standard shape"
      ],
      correctIndex: 1,
      explanation: "The whole point of the analogy is that one standard connector (protocol) lets many devices (clients) and many ports (servers) work together without a custom adapter for every pairing.",
    },
    {
      question: "An MCP server exposes a get_ticket(id) function and a create_ticket(title, body) function. How are these classified?",
      options: [
        "Both are resources, since they both relate to tickets",
        "get_ticket is a resource-like read; create_ticket is a tool, since it performs an action with a side effect",
        "Both are prompts",
        "Both are tools, since they're both functions"
      ],
      correctIndex: 1,
      explanation: "The distinguishing factor is action vs. read: create_ticket performs an action with a side effect (a tool), while retrieving existing ticket data with no side effect is what resources are for.",
    },
    {
      question:
        "You're benchmarking the same prompt against two models routed through two different gateways, one of which has response caching enabled. Why could that caching setting quietly bias your results?",
      options: [
        "Caching has no effect on benchmark timing or cost measurements",
        "A cached response returns near-instantly and at no extra cost, which could make that gateway look artificially faster/cheaper on repeated runs than an apples-to-apples comparison would show",
        "Caching always makes responses less accurate",
        "Caching only affects images, never text"
      ],
      correctIndex: 1,
      explanation:
        "If one path is serving a cached response and the other is generating fresh every time, you're no longer comparing the models under identical conditions -- the caching gateway's latency/cost numbers would look better for reasons unrelated to the model itself.",
    },
    {
      question:
        "A coding agent in Sandbox is wired to a gateway with fallback configured. Mid-task, the primary provider goes down. What most likely happens to the agent's loop?",
      options: [
        "The entire agent session crashes immediately with no recovery",
        "The gateway's fallback rule reroutes the failing request to a backup provider, often transparently enough that the agent's loop simply continues with the next observation",
        "The agent automatically switches to running entirely offline",
        "Fallback only works for Playground requests, never for agent sessions",
      ],
      correctIndex: 1,
      explanation:
        "Fallback operates at the gateway level regardless of what's calling it -- an agent's request is just another API call, so a transparent retry against a backup keeps the think-act-observe loop moving.",
    },
    {
      question: "Why might raising a model's temperature make it harder to get a benchmark suite's deterministic assertions to pass consistently?",
      options: [
        "Temperature has no effect on deterministic assertions",
        "Higher temperature introduces more run-to-run variation in wording and structure, which can make output less likely to consistently match a strict, exact-format rule",
        "Deterministic assertions automatically adjust to any temperature setting",
        "Temperature only affects cost, never output content",
      ],
      correctIndex: 1,
      explanation:
        "Deterministic assertions expect a specific, exact-format output. Higher temperature increases variability in exactly the wording/structure those rules check, making consistent passes less likely -- another reason low temperature suits structured tasks.",
    },
    {
      question: "After registering a new MCP server and confirming in Sandbox that its tools work reliably with a coding agent, what's the recommended way to make that choice durable for the rest of the team?",
      options: [
        "Nothing -- once it works once, no further action is needed",
        "Record a decision noting which MCP server was adopted, why, and link the Sandbox session or evidence that validated it",
        "Delete the MCP server registration so no one else can change it",
        "Only mention it verbally in a meeting",
      ],
      correctIndex: 1,
      explanation:
        "The same logic that applies to choosing a model applies here -- a verified integration choice is worth writing down with its rationale and evidence, so the reasoning survives past the person who did the testing.",
    },
  ],
};
