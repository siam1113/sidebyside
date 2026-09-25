import type { LearnModule } from "../types";

const toolsAndAgentsModule: LearnModule = {
  slug: "tools-and-agents",
  title: "Tools, Agents & MCP",
  tagline: "What's actually happening inside Sandbox and the MCP tab",
  description: "Coding agents, why they run in a sandbox, and the protocol that lets them use outside tools safely.",
  lessons: [
    {
      slug: "coding-agents",
      title: "What Is a Coding Agent / CLI Tool?",
      summary: "Claude Code, Codex CLI, Copilot CLI -- what makes them different from a chat window.",
      minutes: 6,
      blocks: [
        { type: "heading", text: "Overview" },
        {
          type: "p",
          text: "A coding agent is an LLM wired up with the ability to take actions, not just talk -- reading and editing files, running shell commands, searching a codebase -- usually in a loop: think, take an action, observe the result, decide the next action, repeat until the task is done.",
        },
        {
          type: "p",
          text: "Claude Code, Codex CLI, and Copilot CLI are all examples: command-line tools that connect a model to your terminal and file system so it can actually do the software engineering task you described, not just describe how you'd do it.",
        },
        { type: "heading", text: "How It Works" },
        {
          type: "p",
          text: "Under the hood, a coding agent's loop looks like this: the model reads its instructions and current context, decides on a single next action (read a file, run a command, edit a file), that action actually executes, the result -- file contents, command output, an error -- gets fed back into the model's context, and the model decides the next action based on what just happened. This repeats until the model decides the task is complete or it hits a limit.",
        },
        {
          type: "list",
          items: [
            "Actions are usually mediated through defined tools (read_file, run_command, edit_file) rather than raw unrestricted access.",
            "Many agents pause for human approval before higher-risk actions, like running a shell command or deleting something.",
            "The loop ends when the model decides the goal is met, or when it runs out of budget -- time, token limit, or max iterations.",
          ],
        },
        { type: "heading", text: "A Worked Example" },
        {
          type: "example",
          title: "Fixing a failing test",
          text: "Say a test named test_discount_calculation is failing. A coding agent's trace might look like: (1) run the test suite, observe the failure message pointing at discount.py line 42; (2) read discount.py to see the current logic; (3) notice the discount is applied before tax instead of after; (4) edit the file to reorder the calculation; (5) re-run the test suite; (6) see it pass and report the fix. Six discrete actions, each one informed by the result of the last.",
        },
        { type: "heading", text: "Analogies" },
        {
          type: "analogy",
          text: "A plain chat model is like a consultant who can only give you written advice through a slot in the door. A coding agent is that same consultant let into the room with a keyboard -- it can open files, make the edit, run the tests, and check whether it worked, instead of just telling you what to type.",
        },
        {
          type: "analogy",
          text: "Or think of a thermostat versus a weather app. An app (chat model) can only tell you the current temperature and suggest what to do about it. A thermostat (coding agent) actually turns the heat on, watches the room warm up, and keeps adjusting until the target is hit -- it closes its own feedback loop instead of leaving that step to you.",
        },
        { type: "heading", text: "Key Terms" },
        {
          type: "terms",
          items: [
            {
              term: "Agent loop",
              def: "The think -> act -> observe -> decide cycle a coding agent repeats until the task is done or a limit is hit.",
            },
            {
              term: "Tool call",
              def: "A structured request the model makes to run a specific action (e.g. read a file), instead of writing free-form text -- lets the surrounding program actually execute it.",
            },
            {
              term: "Permission / approval",
              def: "A checkpoint where a human confirms a risky action (like running a command) before the agent proceeds, common in coding-agent CLIs.",
            },
          ],
        },
        { type: "heading", text: "Common Pitfalls" },
        {
          type: "callout",
          variant: "tip",
          text: "Give a coding agent a narrow, well-defined task ('fix this failing test') rather than a vague one ('make the code better') -- vague goals make it harder for the loop to know when it's actually done.",
        },
        {
          type: "callout",
          variant: "warning",
          text: "A coding agent will confidently run destructive commands if asked to and not stopped -- always review what it's about to do before approving anything that deletes, force-pushes, or touches production.",
        },
        { type: "heading", text: "In SideBySide" },
        {
          type: "app",
          text: "Sandbox launches any of these three CLIs for you, already wired to whichever gateway/model you pick.",
          href: "/sandbox",
          linkLabel: "Open Sandbox",
        },
        {
          type: "resources",
          items: [
            {
              title: "Claude Code Overview",
              url: "https://code.claude.com/docs/en/overview",
              source: "Claude Code Docs (official)",
              kind: "article",
            },
          ],
        },
      ],
      quiz: [
        {
          question: "What distinguishes a coding agent from a plain chat model?",
          options: [
            "Coding agents are always more accurate",
            "Coding agents can take actions (edit files, run commands) in a loop, not just produce text",
            "There's no real difference",
            "Coding agents don't use LLMs at all",
          ],
          correctIndex: 1,
          explanation: "The defining feature is the think-act-observe loop with real tool access, not just generating advice as text.",
        },
        {
          question: "Which of these is a coding-agent CLI tool this platform can sandbox?",
          options: ["LiteLLM", "Claude Code", "OpenRouter", "MCP"],
          correctIndex: 1,
          explanation:
            "Claude Code (along with Codex CLI and Copilot CLI) is a coding-agent CLI; LiteLLM/OpenRouter are gateways and MCP is a protocol, not an agent itself.",
        },
        {
          question: "In the think-act-observe loop, what typically happens right after an agent takes an action?",
          options: [
            "The loop immediately ends",
            "The result of that action is fed back into the model's context to inform the next decision",
            "The model forgets what it just did",
            "Nothing -- the loop is one-directional",
          ],
          correctIndex: 1,
          explanation:
            "Observing the result of the last action is what lets the agent decide its next step -- without that feedback it isn't really a loop.",
        },
        {
          question: "Why might a coding agent pause and ask for approval before running a shell command?",
          options: [
            "It's required by the operating system",
            "Because some actions are higher-risk (deleting, force-pushing) and worth a human check first",
            "It always asks before every single action, no exceptions",
            "Approval steps make the agent faster",
          ],
          correctIndex: 1,
          explanation:
            "Many coding-agent CLIs add approval checkpoints for higher-risk actions specifically because the agent can take real, hard-to-reverse actions.",
        },
        {
          question: "Which task description is more likely to help a coding agent succeed?",
          options: [
            "'Make the code better'",
            "'Fix the failing test_discount_calculation test'",
            "'Do something useful'",
            "'Improve everything'",
          ],
          correctIndex: 1,
          explanation:
            "A narrow, well-defined task gives the agent a clear stopping condition -- vague goals make it hard to know when the loop should end.",
        },
      ],
    },
    {
      slug: "what-is-a-sandbox",
      title: "What Is a Sandbox, and Why Isolate It?",
      summary: "Why letting an agent run commands on your real machine is a bad first move.",
      minutes: 6,
      blocks: [
        { type: "heading", text: "Overview" },
        {
          type: "p",
          text: "A sandbox is an isolated environment -- here, a throwaway Docker container -- where code can run with no access to your actual computer's files, credentials, or installed programs. When the session ends, the container (and anything it did) is simply destroyed.",
        },
        {
          type: "p",
          text: "Coding agents can run arbitrary shell commands on your behalf. That's the whole point -- but it also means a bad prompt, a bug, or an unexpected model action could delete files, leak secrets, or make changes you didn't want, if it were running directly on your real machine.",
        },
        { type: "heading", text: "How It Works" },
        {
          type: "p",
          text: "A container is created from an image -- a frozen snapshot of an operating system plus whatever tools are installed, like a shell, git, or a language runtime. When a Sandbox session starts, a fresh container spins up from that image in seconds, the coding agent runs entirely inside it, and when the session ends the container is deleted -- including every file it touched. The next session starts from the same clean image again, with no memory of the last one.",
        },
        {
          type: "list",
          items: [
            "The container shares your machine's kernel but has its own isolated filesystem, process list, and network namespace.",
            "No folder on your real machine is mounted in -- the agent can create, edit, and delete files freely inside the container without any of it existing outside it.",
            "Because every session starts from the same image, a broken or messy session doesn't carry over -- you just get a fresh container next time.",
          ],
        },
        { type: "heading", text: "A Worked Example" },
        {
          type: "example",
          title: "What happens if a command goes wrong",
          text: "Suppose the agent runs `rm -rf ./build` intending to clear a stale build folder, but a typo makes it `rm -rf ./` instead. Inside the sandbox, that wipes the container's own filesystem -- annoying, but it only destroys a disposable container that gets thrown away anyway. Your actual project folder, sitting on your real machine, was never mounted into that container in the first place, so it's completely unaffected. Outside a sandbox, that same typo run directly on your machine would delete your real files.",
        },
        { type: "heading", text: "Analogies" },
        {
          type: "analogy",
          text: "It's a supervised test kitchen versus your home kitchen. In the test kitchen, a trainee chef can chop, burn, and experiment freely -- if something goes wrong, you close that kitchen and open a fresh one. Nothing that happens there touches the food actually being served at your restaurant (your real machine).",
        },
        {
          type: "analogy",
          text: "Or think of a rented car versus your own car. A rented sandbox container is disposable -- you can drive it hard, and if something goes wrong you just return it and get a new one. Your own machine is the car you actually own and can't casually total.",
        },
        { type: "heading", text: "Key Terms" },
        {
          type: "terms",
          items: [
            {
              term: "Container",
              def: "A lightweight, isolated environment that looks like its own computer to whatever's running inside it, but shares the host's kernel -- fast to create and destroy.",
            },
            {
              term: "Image",
              def: "The frozen template (an OS plus installed tools) a container is created from -- the same image can spin up many identical, independent containers.",
            },
            {
              term: "Host volume mount",
              def: "A way to let a container read/write specific folders on your real machine. This platform deliberately never does this for Sandbox sessions.",
            },
          ],
        },
        { type: "heading", text: "Common Pitfalls" },
        {
          type: "callout",
          variant: "tip",
          text: "Don't assume 'sandboxed' means 'safe to run literally anything' -- it protects your real machine, but a mistake can still waste the current session's work (fine, since it's disposable) or reach real external systems if the agent has network access to them.",
        },
        {
          type: "callout",
          variant: "warning",
          text: "This is why Sandbox never mounts your real folders into the container -- the agent gets a real terminal and a real filesystem to work in, just not yours.",
        },
        { type: "heading", text: "In SideBySide" },
        {
          type: "app",
          text: "Every Sandbox session works exactly this way -- a disposable container, wired to your chosen gateway, gone the moment you close it.",
          href: "/sandbox",
          linkLabel: "Open Sandbox",
        },
        { type: "heading", text: "Watch" },
        {
          type: "video",
          items: [
            {
              title: "What Is a Docker Container? Explained Simply for Beginners (vs Image)",
              url: "https://www.youtube.com/watch?v=1YzaS2GxGa4",
              source: "YouTube",
            },
            {
              title: "Docker in 100 Seconds",
              url: "https://www.youtube.com/watch?v=Gjnup-PuquQ",
              source: "YouTube -- Fireship",
            },
          ],
        },
        {
          type: "resources",
          items: [
            {
              title: "What is a container?",
              url: "https://docs.docker.com/get-started/docker-concepts/the-basics/what-is-a-container/",
              source: "Docker Docs (official)",
              kind: "article",
            },
          ],
        },
      ],
      quiz: [
        {
          question: "Why does Sandbox run CLI tools in a Docker container instead of directly on your machine?",
          options: [
            "Docker is required by all CLI tools",
            "To isolate whatever the agent does from your real files, credentials, and configs",
            "It makes the agent smarter",
            "Containers are faster than running locally, that's the only reason",
          ],
          correctIndex: 1,
          explanation: "Isolation is the point -- a mistake or unexpected action inside the container can't touch your host machine's real data.",
        },
        {
          question: "What does it mean that Sandbox never mounts host volumes?",
          options: [
            "The container has no filesystem at all",
            "The container's filesystem is entirely separate from your real machine's folders",
            "It means the agent can't read any files, ever",
            "It's unrelated to security",
          ],
          correctIndex: 1,
          explanation:
            "No host volume mount means the container's files are isolated from your real machine -- nothing the agent does inside can read or write your actual folders.",
        },
        {
          question: "What is a container created from?",
          options: [
            "A live snapshot of your real machine",
            "An image -- a frozen template of an OS plus installed tools",
            "A backup of your last session",
            "Nothing -- it starts completely empty",
          ],
          correctIndex: 1,
          explanation: "Containers are instantiated from images, a reusable template that produces identical, independent containers each time.",
        },
        {
          question:
            "If a coding agent accidentally runs a destructive command like `rm -rf` inside a Sandbox container, what happens to your real project files?",
          options: [
            "They get deleted too",
            "Nothing -- your real files were never mounted into the container in the first place",
            "It depends on your internet connection",
            "The command is silently blocked",
          ],
          correctIndex: 1,
          explanation:
            "Because Sandbox never mounts host folders into the container, a destructive command inside it has nothing of yours to actually reach.",
        },
        {
          question: "Why does a fresh Sandbox session start from a clean image instead of continuing from the last one?",
          options: [
            "To save disk space only",
            "So a messy or broken previous session never carries over into the next one",
            "Because containers can only be used once ever, system-wide",
            "It doesn't -- sessions always resume where they left off",
          ],
          correctIndex: 1,
          explanation: "Each session gets a brand-new container from the same starting image, so nothing from a previous session's mess persists.",
        },
      ],
    },
    {
      slug: "what-is-mcp",
      title: "What Is MCP (Model Context Protocol)?",
      summary: "How agents connect to outside tools and data without a custom integration for each one.",
      minutes: 6,
      blocks: [
        { type: "heading", text: "Overview" },
        {
          type: "p",
          text: "MCP (Model Context Protocol) is an open protocol that standardizes how an LLM-powered application talks to external tools, data sources, and predefined prompts. It defines a common message format and a common way to ask 'what can you do?' so any two MCP-compatible pieces of software can talk to each other without one being built specifically for the other.",
        },
        {
          type: "p",
          text: "Without a shared protocol, every agent needing to talk to every tool means a custom integration for each pairing -- an agent that wants to use a Slack tool, a database tool, and a ticketing tool needs three separate bespoke integrations, and a second agent wanting the same three tools needs to rebuild all three again. MCP turns that many-to-many integration problem into a one-time investment: build one MCP server for a capability, and every MCP client can use it.",
        },
        { type: "heading", text: "How It Works" },
        {
          type: "p",
          text: "An MCP client connects to a server -- often over a local process pipe or an HTTP-based transport -- and starts by asking it to list what it offers. The server responds with its available tools, resources, and prompts, along with a description of each and what inputs a tool expects. From there, the client (usually on behalf of the LLM) can call a specific tool with arguments, read a specific resource, or fetch a specific prompt template, and the server handles the request and returns a result in the standard format.",
        },
        {
          type: "list",
          items: [
            "Discovery happens first -- the client always asks 'what do you have?' before trying to use anything.",
            "Each tool advertises its own input shape, so the calling agent knows exactly what arguments it needs to supply.",
            "The same MCP server can be used by completely different clients -- a coding agent, a chat app, a workflow tool -- without any changes on the server side.",
          ],
        },
        { type: "heading", text: "A Worked Example" },
        {
          type: "example",
          title: "A tool-call exchange",
          text: "Say an MCP server exposes a tool called search_docs that takes a query string. A coding agent trying to answer 'how do I authenticate against this API' would: discover that search_docs exists and what arguments it needs, call it with {query: 'authentication'}, and receive back a result like {results: [{title: 'Auth Guide', snippet: '...'}]}. The agent then reads that snippet and uses it to answer the original question -- the server never needed to know anything about coding agents specifically, and the agent never needed custom code for this particular docs site.",
        },
        { type: "heading", text: "Analogies" },
        {
          type: "analogy",
          text: "MCP is often compared to USB-C: before it, every device needed its own specific cable and port. USB-C gave manufacturers one standard connector, so any USB-C device works with any USB-C port without a custom adapter. MCP does the same thing for connecting AI applications to tools and data.",
        },
        {
          type: "analogy",
          text: "Or think of a restaurant menu versus a chef calling every supplier directly. Without a menu (protocol), a customer (client) would need to know each supplier's (server's) exact ordering process. A menu standardizes what's available and how to order it, so any customer can order from any restaurant that uses menus, without learning a new process each time.",
        },
        { type: "heading", text: "Key Terms" },
        {
          type: "terms",
          items: [
            {
              term: "MCP server",
              def: "The side exposing capabilities -- e.g. 'search our docs,' 'query this database,' 'create a ticket' -- over the standard protocol.",
            },
            {
              term: "MCP client",
              def: "The application (e.g. a coding agent) that connects to one or more MCP servers to discover and call what they expose.",
            },
            {
              term: "Transport",
              def: "The underlying channel an MCP client and server communicate over -- commonly a local process pipe (stdio) for tools running on your machine, or an HTTP-based connection for remote servers.",
            },
          ],
        },
        { type: "heading", text: "Common Pitfalls" },
        {
          type: "callout",
          variant: "tip",
          text: "A server's tools are only as useful as their descriptions -- if a tool's description is vague, the model calling it is more likely to use it wrong or not find it at all.",
        },
        {
          type: "callout",
          variant: "warning",
          text: "Connecting to an MCP server means trusting it with whatever access its tools grant -- treat adding a new server with the same caution as installing a new piece of software, especially for servers you didn't write yourself.",
        },
        { type: "heading", text: "In SideBySide" },
        {
          type: "app",
          text: "The MCP tab lets you register a server, test the connection live, and see exactly what it exposes -- before wiring it into an agent session.",
          href: "/mcp",
          linkLabel: "Open MCP Servers",
        },
        { type: "heading", text: "Watch" },
        {
          type: "video",
          items: [
            {
              title: "Model Context Protocol (MCP), clearly explained (why it matters)",
              url: "https://www.youtube.com/watch?v=7j_NE6Pjv-E",
              source: "YouTube",
            },
            {
              title: "The Model Context Protocol (MCP)",
              url: "https://www.youtube.com/watch?v=CQywdSdi5iA",
              source: "YouTube -- Anthropic",
            },
          ],
        },
        {
          type: "resources",
          items: [
            {
              title: "Introducing the Model Context Protocol",
              url: "https://www.anthropic.com/news/model-context-protocol",
              source: "Anthropic (official)",
              kind: "article",
            },
          ],
        },
      ],
      quiz: [
        {
          question: "What problem does MCP solve?",
          options: [
            "It makes models faster",
            "It standardizes how agents connect to external tools/data, avoiding a custom integration per tool",
            "It replaces the need for API keys",
            "It's a benchmarking framework",
          ],
          correctIndex: 1,
          explanation: "MCP's core value is a common protocol so any compatible client can use any compatible server without bespoke integration work.",
        },
        {
          question: "In the USB-C analogy, what does the MCP server represent?",
          options: [
            "The cable",
            "The device/port offering its capability through the standard connector",
            "The electricity itself",
            "The laptop's operating system",
          ],
          correctIndex: 1,
          explanation: "The MCP server is the thing exposing capabilities (like a device with a USB-C port) that any standard-compliant client can plug into.",
        },
        {
          question: "What's the first thing an MCP client does when it connects to a server?",
          options: [
            "Immediately calls every tool available",
            "Asks the server to list what it offers (tools, resources, prompts)",
            "Deletes the server's data",
            "Nothing -- connection alone is enough",
          ],
          correctIndex: 1,
          explanation: "Discovery comes first -- the client asks what's available before trying to use any of it.",
        },
        {
          question:
            "Without MCP, what happens if 3 different agent products all want to use 3 different tools?",
          options: [
            "Nothing changes either way",
            "Up to 9 separate bespoke integrations instead of 3 reusable MCP servers",
            "MCP has nothing to do with multiple agents",
            "It would require 9 servers no matter what",
          ],
          correctIndex: 1,
          explanation:
            "Without a shared protocol, each agent-tool pairing can need its own integration -- MCP collapses that into one server per tool, reusable by any compatible client.",
        },
        {
          question: "In the tool-call exchange example, what does the MCP server need to know about the coding agent calling it?",
          options: [
            "Nothing specific -- it just handles the standard request format",
            "Exactly which coding agent product is calling",
            "The agent's entire conversation history",
            "The user's API keys for other services",
          ],
          correctIndex: 0,
          explanation: "A well-built MCP server just implements the standard protocol -- it doesn't need special-case code for whichever client happens to be calling it.",
        },
      ],
    },
    {
      slug: "mcp-tools-resources-prompts",
      title: "Tools, Resources & Prompts in MCP",
      summary: "The three things an MCP server can actually offer.",
      minutes: 6,
      blocks: [
        { type: "heading", text: "Overview" },
        {
          type: "p",
          text: "An MCP server can expose exactly three kinds of things: tools, resources, and prompts. Tools are actions the agent can invoke; resources are data the agent can read; prompts are reusable templates for common requests. Together they cover the three basic things a piece of software might want to offer an LLM-powered client.",
        },
        {
          type: "p",
          text: "When you connect to an MCP server, the client asks it to list what it exposes across these three categories. A single server might offer all three -- e.g. a docs server could expose a search tool, individual pages as resources, and a 'summarize this page' prompt template.",
        },
        { type: "heading", text: "How It Works" },
        {
          type: "p",
          text: "The distinction matters because each primitive has different implications for the model. A tool call is an action with a return value -- the model decides when to call it and what arguments to pass, and it can have side effects (creating a ticket, sending a message). A resource is just data -- reading it never changes anything, so it's safe for a client to fetch resources speculatively for context. A prompt is a starting point provided by the server rather than the model -- it's the server's opinion on how a particular task should be framed.",
        },
        {
          type: "list",
          items: [
            "If an action changes something or could fail in an interesting way, it should be a tool, not a resource.",
            "If it's pure information the model might want as context, it should be a resource, not a tool.",
            "If it's a common request pattern worth standardizing (e.g. 'summarize this page'), it's a good candidate for a prompt.",
          ],
        },
        { type: "heading", text: "A Worked Example" },
        {
          type: "example",
          title: "One server, all three primitives",
          text: "A support-ticket MCP server might expose: a create_ticket(title, body, priority) tool (an action, has a side effect); a ticket://12345 resource representing one specific ticket's current contents (pure data, no side effect); and a triage-new-ticket prompt template that pre-fills a structured way to ask the model to categorize an incoming request. An agent handling a user complaint could read the relevant ticket resource for context, use the triage prompt to frame its reasoning, and then call the create_ticket tool to actually file a new one.",
        },
        { type: "heading", text: "Analogies" },
        {
          type: "analogy",
          text: "Tools, resources, and prompts map roughly to a restaurant's kitchen, menu, and specials board. The kitchen (tools) does things when you order. The menu (resources) is just information you can read any time, with no effect on anything. The specials board (prompts) is the restaurant's own suggested way to order something, pre-composed for you.",
        },
        {
          type: "analogy",
          text: "Or think of a web page with buttons, static text, and form templates. Buttons (tools) perform actions when clicked. Static text (resources) is just there to be read. Pre-filled form templates (prompts) are a starting point someone else prepared so you don't have to build the request from scratch.",
        },
        { type: "heading", text: "Key Terms" },
        {
          type: "terms",
          items: [
            {
              term: "Tool",
              def: "An action the agent can invoke, usually with inputs and a return value -- e.g. run_query(sql), create_ticket(title, body). This is what lets an agent do things, not just read things.",
            },
            {
              term: "Resource",
              def: "A piece of data the server exposes for the agent to read -- a file, a database record, a document -- context rather than an action.",
            },
            {
              term: "Prompt",
              def: "A pre-written, often parameterized prompt template the server offers, so common tasks against that server don't need to be re-written from scratch each time.",
            },
            {
              term: "Side effect",
              def: "A change caused by an action -- something a tool call can have (like creating a ticket) that a resource read never does, since resources are read-only by design.",
            },
          ],
        },
        { type: "heading", text: "Common Pitfalls" },
        {
          type: "callout",
          variant: "tip",
          text: "When registering a server in the MCP tab, check whether a capability you expect is exposed as a tool or a resource -- calling something read-only won't have the side effect you might be expecting.",
        },
        {
          type: "callout",
          variant: "warning",
          text: "A tool with a side effect (like creating a ticket or sending a message) should be treated carefully -- an agent calling it unintentionally has real-world consequences, unlike reading a resource.",
        },
        { type: "heading", text: "In SideBySide" },
        {
          type: "app",
          text: "When you test a connection in the MCP tab, it's these three lists -- tools, resources, prompts -- that get shown to you, exactly what the agent itself would see.",
          href: "/mcp",
          linkLabel: "Inspect an MCP server",
        },
        {
          type: "resources",
          items: [
            {
              title: "MCP Specification -- Tools",
              url: "https://modelcontextprotocol.io/specification/2025-06-18/server/tools",
              source: "Model Context Protocol (official spec)",
              kind: "article",
            },
          ],
        },
      ],
      quiz: [
        {
          question: "What's the difference between an MCP tool and an MCP resource?",
          options: [
            "No difference, they're the same thing",
            "A tool is an invokable action; a resource is data the agent can read",
            "Resources can only be images",
            "Tools are always slower than resources",
          ],
          correctIndex: 1,
          explanation: "Tools let the agent do something (with inputs/effects); resources are readable context/data with no action performed.",
        },
        {
          question: "What is an MCP prompt?",
          options: [
            "The user's chat message",
            "A pre-written, reusable prompt template the server offers for common tasks",
            "An error message from the server",
            "A system-level security setting",
          ],
          correctIndex: 1,
          explanation: "MCP prompts are templates a server provides so common request patterns against it don't need to be authored from scratch each time.",
        },
        {
          question: "Which MCP primitive is appropriate for an action that has a side effect, like sending an email?",
          options: ["Resource", "Tool", "Prompt", "None of these support side effects"],
          correctIndex: 1,
          explanation: "Tools are for actions, including ones with side effects -- resources are read-only and prompts are just templates.",
        },
        {
          question: "What is a prompt, in MCP terms, actually provided by?",
          options: [
            "The end user typing into a chat box",
            "The MCP server, as a pre-written template for a common task",
            "The LLM itself, generated fresh every time",
            "The client application's source code",
          ],
          correctIndex: 1,
          explanation: "MCP prompts are authored and exposed by the server -- they're the server's own suggested way to frame a common request.",
        },
        {
          question: "In the support-ticket server example, why is a specific ticket's contents modeled as a resource rather than a tool?",
          options: [
            "Because resources are faster than tools",
            "Because reading it doesn't change anything -- it's pure data, not an action",
            "Because tools can't return text",
            "There's no real reason, either would work identically",
          ],
          correctIndex: 1,
          explanation:
            "Resources are for read-only data with no side effect -- since reading a ticket's contents doesn't change anything, it fits the resource primitive rather than the tool primitive.",
        },
      ],
    },
  ],
  test: [
    {
      question: "What do a coding agent's internal tool calls and an MCP server's exposed tools have in common?",
      options: [
        "Nothing, they're unrelated concepts",
        "Both represent an action being invoked with defined inputs, whose result feeds back into what happens next",
        "Both require a Docker container to function",
        "Both are exclusive to Claude Code",
      ],
      correctIndex: 1,
      explanation:
        "A coding agent's internal tool calls and an MCP server's exposed tools are the same basic idea -- an invokable action with inputs and a result, whether the tool is built into the agent or provided over MCP.",
    },
    {
      question:
        "A coding agent running in Sandbox calls a tool exposed by a connected MCP server. What's true about where that call executes?",
      options: [
        "It always runs on your real machine, outside the container",
        "It runs wherever the MCP server's code lives -- inside the isolated container if local, or on a remote service if the server is remote -- never touching your real machine directly",
        "It can't happen -- Sandbox and MCP are incompatible",
        "It only happens inside the MCP tab's browser page",
      ],
      correctIndex: 1,
      explanation:
        "The agent inside the container is the one making the call; the tool's own code runs wherever the MCP server lives, but in neither case does it reach your real machine's files.",
    },
    {
      question: "Why does running a coding agent inside a Sandbox container matter specifically because agents can call tools autonomously?",
      options: [
        "It doesn't matter -- tool calls are always safe",
        "Because an autonomous agent might invoke a destructive tool or command without a human reviewing every step, and isolation limits the blast radius",
        "Because tools only work inside containers",
        "Because MCP requires Docker to run at all",
      ],
      correctIndex: 1,
      explanation:
        "The reason isolation matters more for agents than for a passive chatbot is that agents can actually execute actions on their own -- sandboxing limits what a wrong or unintended action can reach.",
    },
    {
      question: "Which of the following would an MCP server expose as a resource, not a tool?",
      options: [
        "A function that creates a new support ticket",
        "The current read-only contents of an existing ticket",
        "A function that sends a Slack message",
        "A function that deletes a file",
      ],
      correctIndex: 1,
      explanation: "Reading existing data with no side effect is what resources are for; anything that performs an action (create, send, delete) is a tool.",
    },
    {
      question: "In the think-act-observe loop, what plays a role most similar to an MCP tool call?",
      options: ["The 'think' step", "The 'act' step -- invoking something and getting a result back", "The loop ending entirely", "The initial task description"],
      correctIndex: 1,
      explanation:
        "An MCP tool call is exactly an 'act' -- the agent invokes it with inputs and gets a result back to inform its next decision, just like any other action in the loop.",
    },
    {
      question:
        "A new MCP server is registered that exposes a delete_record(id) tool. What's the most sensible precaution before wiring it into an autonomous coding-agent session?",
      options: [
        "None needed -- MCP tools are always safe by design",
        "Treat it like installing new software -- understand what access it has, and be cautious about letting an agent call it without review",
        "Only use it inside a plain chat window, never in an agent",
        "Nothing changes since Sandbox isolates everything anyway",
      ],
      correctIndex: 1,
      explanation:
        "MCP servers can expose real, consequential actions -- a delete tool deserves the same scrutiny as any new piece of software with access to something that matters, regardless of what else is isolated.",
    },
    {
      question: "What do a 'container' and an 'MCP server' have in common as concepts in this module?",
      options: [
        "They're literally the same thing",
        "Both are well-defined units that isolate something behind a fixed interface -- a container isolates execution, an MCP server isolates a capability behind a protocol",
        "Neither can be reused across sessions",
        "Both require an internet connection to exist",
      ],
      correctIndex: 1,
      explanation:
        "Both are a form of encapsulation -- a container isolates where code runs, and an MCP server isolates a capability behind a standard interface -- even though they solve different problems.",
    },
    {
      question: "Why would 'fix the failing test_discount_calculation test' generally work better as a task for a coding agent than 'improve the codebase'?",
      options: [
        "It's shorter to type",
        "It gives the agent a clear, checkable stopping condition for its think-act-observe loop",
        "Vague tasks are technically impossible for agents to attempt",
        "It has nothing to do with how the loop terminates",
      ],
      correctIndex: 1,
      explanation: "A narrow, checkable goal lets the agent's loop know when it's actually done (the test passes) -- a vague goal has no clear termination condition.",
    },
  ],
};

export default toolsAndAgentsModule;
