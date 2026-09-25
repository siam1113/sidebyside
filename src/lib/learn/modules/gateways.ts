import type { LearnModule } from "../types";

const gatewaysModule: LearnModule = {
  slug: "gateways",
  title: "APIs, Providers & Gateways",
  tagline: "The part this whole platform is built around",
  description: "What an API actually is, why there isn't just one 'AI company' to call, and what a gateway does for you.",
  lessons: [
    {
      slug: "what-is-an-api",
      title: "What Is an API (and an API Key)?",
      summary: "How your prompt actually travels from a text box to a model and back.",
      minutes: 6,
      blocks: [
        { type: "heading", text: "Overview" },
        {
          type: "p",
          text: "An API (Application Programming Interface) is a defined way for one piece of software to ask another piece of software to do something, over the network. When you use an AI product, code underneath it sends a request to a model provider's API -- a formatted message saying 'here's a prompt, here are my settings, please generate a reply' -- and gets a response back, usually as JSON.",
        },
        {
          type: "p",
          text: "An API key is a secret string that identifies and authorizes you to the provider, and it's how usage gets billed to your account. Anyone who has your key can spend your money and access your account's data, which is why keys should never be shared, committed to git, or placed in client-side code.",
        },
        { type: "heading", text: "How It Works" },
        {
          type: "p",
          text: "Under the hood, an API call is just an HTTP request. You send it to a specific endpoint (a URL), using an HTTP method (almost always POST for LLM calls, since you're submitting data rather than fetching it), with a header carrying your API key, and a body containing the actual payload -- the model name, the prompt or message history, and any generation settings like temperature or max tokens. The provider processes that request and sends back an HTTP response: a status code indicating success or failure, plus a JSON body containing the generated text, or an error message if something went wrong.",
        },
        {
          type: "list",
          items: [
            "Endpoint -- the specific URL the request is sent to, e.g. /v1/chat/completions.",
            "Headers -- metadata sent alongside the request, most importantly Authorization: Bearer <your-api-key>.",
            "Body -- the JSON payload: which model, what to say, and any generation settings.",
            "Status code -- 200 means success; 401 means a bad or missing API key; 429 means you've hit a rate limit; 500 means the provider had a problem on its end.",
          ],
        },
        { type: "heading", text: "A Worked Example" },
        {
          type: "example",
          title: "A real request",
          text: "A minimal request to an OpenAI-compatible chat endpoint looks like: POST https://api.example.com/v1/chat/completions, with header Authorization: Bearer sk-abc123..., and a body of {\"model\": \"gpt-4o\", \"messages\": [{\"role\": \"user\", \"content\": \"Summarize this email in one sentence.\"}]}. Send that, and the provider streams back something like {\"choices\": [{\"message\": {\"role\": \"assistant\", \"content\": \"The email asks...\"}}]} -- that content field is what ends up shown in Playground.",
        },
        {
          type: "example",
          title: "When it goes wrong",
          text: "Forget the Authorization header, or use an expired key, and instead of a completion you get back something like {\"error\": {\"message\": \"Incorrect API key provided\"}} with a 401 status -- no tokens spent, no response generated, just a rejection at the door before the model ever sees the prompt.",
        },
        { type: "heading", text: "Analogies" },
        {
          type: "analogy",
          text: "Think of an API like a restaurant's order window, and the API key like your tab. You write your order (the prompt) on a ticket in the format the kitchen expects, hand it through the window with your tab number, and food (the response) comes back. Anyone who steals your tab number can order food and put it on your bill.",
        },
        {
          type: "analogy",
          text: "Or think of an API key like a hotel keycard. It doesn't announce your name to the front desk -- it just proves you're authorized for a specific room (account) and lets housekeeping track which room used the minibar (usage billing). Lose the card, and whoever finds it can walk right in and run up charges on your room.",
        },
        { type: "heading", text: "Key Terms" },
        {
          type: "terms",
          items: [
            { term: "Endpoint", def: "The specific URL a request is sent to -- different endpoints do different things (e.g. one for chat, one for embeddings)." },
            {
              term: "HTTP status code",
              def: "A 3-digit number in the response indicating what happened -- 2xx means success, 4xx means a problem with your request (like a bad key), 5xx means a problem on the provider's side.",
            },
            { term: "Rate limit", def: "A cap on how many requests (or tokens) can be sent in a given time window, enforced per API key." },
          ],
        },
        { type: "heading", text: "Common Pitfalls" },
        {
          type: "callout",
          variant: "warning",
          text: "This is exactly why this platform runs every Sandbox session inside a throwaway Docker container -- so a CLI tool wired to your gateway can never accidentally read or leak the real API keys sitting in your machine's global config.",
        },
        {
          type: "callout",
          variant: "tip",
          text: "Store API keys in environment variables or a secrets manager, never in source code -- a key committed to a public git repo gets scraped and abused within minutes, sometimes by automated bots scanning GitHub in real time.",
        },
        {
          type: "resources",
          items: [
            { title: "What is an API?", url: "https://aws.amazon.com/what-is/api/", source: "AWS", kind: "article" },
            {
              title: "What Is an API Key?",
              url: "https://blog.postman.com/what-is-an-api-key/",
              source: "Postman Blog",
              kind: "article",
            },
          ],
        },
      ],
      quiz: [
        {
          question: "What is an API key primarily used for?",
          options: [
            "Formatting your prompt",
            "Authorizing and billing your requests to a provider",
            "Making the model smarter",
            "Storing your conversation history",
          ],
          correctIndex: 1,
          explanation: "The key proves who's calling and whose account to bill/rate-limit -- it has nothing to do with model quality.",
        },
        {
          question: "Why is it risky to put an API key in client-side (browser) code?",
          options: [
            "It makes the app slower",
            "Anyone viewing the page's network requests or source could extract and misuse it",
            "Browsers don't support API keys",
            "It's not risky at all",
          ],
          correctIndex: 1,
          explanation: "Client-side code is visible/interceptable by anyone using the app, so secrets placed there can be extracted and abused.",
        },
        {
          question: "What HTTP method do LLM API calls typically use, and why?",
          options: [
            "GET, because you're retrieving data",
            "POST, because you're submitting a payload (the prompt and settings)",
            "DELETE, because you're removing the previous response",
            "PUT, because you're replacing a resource",
          ],
          correctIndex: 1,
          explanation:
            "LLM calls submit data -- the prompt, model choice, and settings -- to be processed, which is what POST requests are for; GET requests don't carry a body.",
        },
        {
          question: "What does a 401 status code from an LLM API usually mean?",
          options: [
            "The model is overloaded",
            "The request succeeded",
            "The API key is missing, invalid, or expired",
            "The prompt was too long",
          ],
          correctIndex: 2,
          explanation:
            "401 Unauthorized specifically flags an authentication problem -- almost always a bad or missing API key, not an issue with the prompt content itself.",
        },
        {
          question: "Where should an API key be stored in an application?",
          options: [
            "Hardcoded directly in the source code for convenience",
            "In an environment variable or secrets manager, never committed to source control",
            "In a public README so teammates can find it easily",
            "It doesn't matter as long as the app works",
          ],
          correctIndex: 1,
          explanation:
            "Environment variables and secrets managers keep keys out of version control -- a key committed to git, even in a private repo, is one leak away from being exposed.",
        },
      ],
    },
    {
      slug: "providers-vs-gateways",
      title: "Model Providers vs. LLM Gateways",
      summary: "Two different layers that are easy to confuse when you're new to this.",
      minutes: 7,
      blocks: [
        { type: "heading", text: "Overview" },
        {
          type: "p",
          text: "A model provider is the company that trains and serves a model directly -- Anthropic serving Claude, OpenAI serving GPT, Google serving Gemini. Each one has its own API shape, its own auth method, its own rate limits and pricing.",
        },
        {
          type: "p",
          text: "An LLM gateway sits in front of one or more providers and gives you a single, consistent API to call instead. Behind that one interface, the gateway can route your request to whichever provider/model you asked for, track spend, add fallback/retry logic, cache responses, and normalize the differences between providers' formats.",
        },
        { type: "heading", text: "How It Works" },
        {
          type: "p",
          text: "Mechanically, a gateway looks the same to your code as a provider would -- you send it a normal-looking chat completion request. The difference is what happens after it arrives: the gateway inspects the model field (or a routing rule you configured), decides which real provider to forward the request to, translates it into whatever shape that provider actually expects, sends it, waits for the response, and translates that response back into a consistent shape before handing it to you.",
        },
        {
          type: "list",
          items: [
            "Static routing -- a fixed mapping, e.g. this model name always goes to this provider.",
            "Rule-based routing -- route by request type, e.g. cheap model for short queries, stronger model for long ones.",
            "Load-balanced routing -- spread requests across multiple providers/keys to avoid any single rate limit.",
            "Cost- or latency-aware routing -- pick whichever available option is cheapest or fastest right now.",
          ],
        },
        { type: "heading", text: "A Worked Example" },
        {
          type: "example",
          title: "Switching providers without touching code",
          text: "Say you write your application once against a gateway using the model alias gateway/best-writer. Behind the scenes, that alias might point to Anthropic's Claude today. If the gateway config is later changed to point best-writer at a different provider entirely, your application code and prompts don't have to change at all -- only the gateway's routing rule does.",
        },
        {
          type: "example",
          title: "The direct-integration alternative",
          text: "Compare that to calling providers directly: switching from OpenAI to Anthropic would mean rewriting how you authenticate, how you format the message list, and how you parse the response, since each provider's API shape differs in small but breaking ways.",
        },
        { type: "heading", text: "Analogies" },
        {
          type: "analogy",
          text: "A universal power adapter for travel is a good analogy: every country's wall socket (provider) has a different shape, but the adapter (gateway) gives every device the same plug to use, regardless of which wall it's actually plugged into.",
        },
        {
          type: "analogy",
          text: "Or think of a call center's single published phone number that routes you to whichever available agent (provider) can handle your request. You dial one number, the routing happens invisibly behind it, and if one agent is busy or off the line, you get connected to another without redialing.",
        },
        { type: "heading", text: "Key Terms" },
        {
          type: "terms",
          items: [
            { term: "Provider", def: "The company training and directly serving a model -- Anthropic, OpenAI, Google, etc." },
            { term: "Gateway", def: "A layer in front of one or more providers that gives you one consistent API to call." },
            {
              term: "Model alias",
              def: "A friendly name you reference in your code (e.g. best-writer) that the gateway maps to a specific real provider and model, so the mapping can change without touching your application code.",
            },
          ],
        },
        { type: "heading", text: "Common Pitfalls" },
        {
          type: "callout",
          variant: "tip",
          text: "Don't treat 'a gateway' and 'a provider' as interchangeable words -- when someone says 'just call the OpenAI API,' that's a provider; when they say 'call it through LiteLLM,' that's a gateway sitting in front of one or more providers.",
        },
        {
          type: "callout",
          variant: "warning",
          text: "A gateway adds a real, if usually small, extra network hop. For latency-sensitive production traffic at scale, that hop is worth measuring directly rather than just assuming it's negligible.",
        },
        { type: "heading", text: "In SideBySide" },
        {
          type: "app",
          text: "This is the entire point of the Playground and Settings tabs -- register several gateways once, then send one prompt through all of them to see how each provider, routed through your chosen gateway, responds.",
          href: "/settings",
          linkLabel: "See gateway settings",
        },
        {
          type: "resources",
          items: [
            {
              title: "LLM Gateway: What It Is and How to Choose One",
              url: "https://openrouter.ai/blog/insights/llm-gateway/",
              source: "OpenRouter Blog",
              kind: "article",
            },
          ],
        },
      ],
      quiz: [
        {
          question: "What's the main benefit of calling models through a gateway instead of each provider directly?",
          options: [
            "Gateways always make responses faster",
            "A single, consistent interface regardless of which provider is behind it",
            "Gateways are free",
            "Providers can't be called directly at all",
          ],
          correctIndex: 1,
          explanation:
            "The core value is abstraction -- one integration point instead of one per provider -- plus features like usage tracking and fallback that gateways often add.",
        },
        {
          question: "Is there any tradeoff to routing through a gateway?",
          options: [
            "No, it's strictly better in every way",
            "Yes -- it adds an extra network hop, which can add a small amount of latency",
            "Yes -- gateways can only talk to one provider",
            "No, gateways remove the need for API keys entirely",
          ],
          correctIndex: 1,
          explanation:
            "The gateway is an additional layer your request passes through, so it typically adds a bit of latency in exchange for its convenience.",
        },
        {
          question: "If you switch which model a gateway alias points to, what has to change in your application code?",
          options: [
            "Nothing -- the alias and the calling code stay the same",
            "The entire authentication flow",
            "You must rewrite every prompt",
            "You have to redeploy your whole application from scratch",
          ],
          correctIndex: 0,
          explanation: "That's the point of routing through an alias -- the gateway config changes, not the code that calls it.",
        },
        {
          question: "Which of these is an example of a model provider, not a gateway?",
          options: ["LiteLLM", "OpenRouter", "Anthropic", "Portkey"],
          correctIndex: 2,
          explanation:
            "Anthropic trains and directly serves Claude -- it's a provider. LiteLLM, OpenRouter, and Portkey are gateways that sit in front of providers like Anthropic.",
        },
        {
          question: "Why might switching providers directly (without a gateway) require more code changes than switching a gateway's routing rule?",
          options: [
            "It wouldn't -- they're identical amounts of work",
            "Because each provider's API has its own request/response shape and auth method that your code has to handle directly",
            "Because providers don't allow switching at all",
            "Because gateways are always slower, so switching is pointless",
          ],
          correctIndex: 1,
          explanation:
            "Without a gateway normalizing the differences, your code has to speak each provider's specific API shape directly -- switching means rewriting that integration.",
        },
      ],
    },
    {
      slug: "why-use-a-gateway",
      title: "Why Use a Gateway? Routing, Fallback & Cost Tracking",
      summary: "The practical reasons teams put a gateway in front of raw provider APIs.",
      minutes: 6,
      blocks: [
        { type: "heading", text: "Overview" },
        {
          type: "p",
          text: "Beyond a single integration point, gateways typically add operational features that get painful to build yourself once you're using more than one model in production.",
        },
        {
          type: "p",
          text: "These aren't hypothetical nice-to-haves -- they're the operational gap that shows up the moment a team goes from 'we call one model' to 'we call several models across several providers, for real users, at real scale.' At that point, routing, fallback, cost tracking, and caching stop being optional extras and start being the difference between a system that degrades gracefully and one that goes fully down the moment a single provider hiccups.",
        },
        { type: "heading", text: "How It Works" },
        {
          type: "p",
          text: "A routing rule is typically just configuration: 'requests tagged summarization go to a cheap, fast model; requests tagged code-review go to a stronger one.' Fallback works by wrapping the primary call in a retry policy -- if the first provider times out or returns an error, the gateway immediately retries against a configured backup, often transparently enough that the calling code never sees the failure at all. Caching works by hashing the request (model, prompt, and settings together) and checking a store before hitting the provider -- an exact repeat returns instantly from cache instead of spending tokens on a fresh generation.",
        },
        { type: "heading", text: "A Worked Example" },
        {
          type: "example",
          title: "Routing by request type",
          text: "Say a support bot handles two kinds of requests: quick FAQ lookups and complex troubleshooting. A routing rule sends FAQ-tagged requests to a cheap, fast model and troubleshooting-tagged requests to a stronger, pricier one -- same gateway, same integration, two different cost/quality tradeoffs applied automatically based on the tag.",
        },
        {
          type: "example",
          title: "Fallback during an outage",
          text: "Now imagine that stronger model's provider has an outage. Without fallback, every troubleshooting request starts failing outright. With a fallback rule configured -- a backup provider's comparable model -- the gateway detects the failure and retries against the backup within the same request, so users see a slightly different but still working response instead of an error page.",
        },
        { type: "heading", text: "Analogies" },
        {
          type: "analogy",
          text: "It's the difference between managing five separate vendor relationships and having one procurement desk that knows all five vendors, automatically picks a backup supplier if one is out of stock, and hands you one consolidated invoice at the end of the month.",
        },
        {
          type: "analogy",
          text: "Or think of an understudy in a stage play: the lead actor (primary model) usually performs, but if they're out sick (an outage), the understudy (fallback model) steps in without the show being canceled -- the audience still gets a performance, just not from the usual lead.",
        },
        { type: "heading", text: "Key Terms" },
        {
          type: "terms",
          items: [
            {
              term: "Routing",
              def: "Sending a request to a specific model/provider based on rules -- e.g. cheap model for simple tasks, powerful model for hard ones.",
            },
            {
              term: "Fallback",
              def: "If the primary model/provider errors out or times out, automatically retry with a backup, so a single provider outage doesn't take your app down.",
            },
            {
              term: "Cost tracking",
              def: "Aggregated visibility into spend per model, per project, or per API key, in one place instead of several separate billing dashboards.",
            },
            { term: "Caching", def: "Storing responses to identical/similar requests so repeat queries don't re-spend tokens." },
            {
              term: "Retry policy",
              def: "The rules governing how and when a failed request gets retried -- how many attempts, against which backup, with what delay between tries.",
            },
          ],
        },
        { type: "heading", text: "Common Pitfalls" },
        {
          type: "callout",
          variant: "warning",
          text: "Fallback only helps if the backup model is actually a reasonable substitute -- silently falling back from a strong reasoning model to a much weaker one can produce a response that 'succeeds' technically but is wrong in a way nobody notices until later.",
        },
        {
          type: "callout",
          variant: "tip",
          text: "Caching identical requests is safe; caching requests with a deliberately high temperature (meant to vary) can quietly make a 'creative' feature always return the same cached answer -- make sure caching rules account for settings that are supposed to produce variety.",
        },
        {
          type: "resources",
          items: [
            {
              title: "The LLM layer you're probably missing (LLM gateway pattern explained)",
              url: "https://www.red-gate.com/simple-talk/ai/the-llm-layer-youre-probably-missing-llm-gateway-pattern-explained/",
              source: "Redgate Simple-Talk",
              kind: "article",
            },
          ],
        },
      ],
      quiz: [
        {
          question: "What problem does 'fallback' solve?",
          options: [
            "It makes responses cheaper",
            "It keeps your app working if your primary model/provider has an outage",
            "It speeds up every request",
            "It reduces token usage",
          ],
          correctIndex: 1,
          explanation: "Fallback automatically reroutes to a backup provider/model when the primary one fails, improving reliability.",
        },
        {
          question: "Why might caching matter for cost?",
          options: [
            "It doesn't affect cost",
            "Repeated identical requests can be served from cache instead of re-generating (and re-billing) a fresh response",
            "Caching only applies to images",
            "Caching increases token usage",
          ],
          correctIndex: 1,
          explanation: "Serving a cached response for a repeat/similar request avoids paying for a new generation.",
        },
        {
          question: "How does gateway-level caching typically decide if a request can be served from cache?",
          options: [
            "It never checks, it always calls the model",
            "By hashing the request (model, prompt, settings) and checking if that exact combination was seen before",
            "By asking the user if they want a cached answer",
            "Caching is unrelated to the request content",
          ],
          correctIndex: 1,
          explanation:
            "Caching keys off the full request signature -- same model, same prompt, same settings -- so it can recognize an exact repeat and skip a fresh generation.",
        },
        {
          question: "What's a risk of relying on fallback to a much weaker backup model?",
          options: [
            "There is no risk, fallback is always safe",
            "The response may 'succeed' technically but be lower quality in a way that isn't obviously flagged as an error",
            "Fallback always costs more than the primary model",
            "Fallback disables caching",
          ],
          correctIndex: 1,
          explanation:
            "A fallback that quietly swaps in a weaker model avoids an outright failure, but can produce a worse answer that looks fine on the surface -- worth monitoring, not just trusting blindly.",
        },
        {
          question: "Why might caching be risky for a request that intentionally uses a high temperature?",
          options: [
            "High temperature disables caching automatically",
            "Caching could return the same cached response every time, defeating the intended variety",
            "It isn't risky at all",
            "High-temperature requests can't technically be cached",
          ],
          correctIndex: 1,
          explanation:
            "If a feature is deliberately meant to vary its output, naive caching of identical prompts would flatten that variety by always replaying the first cached answer.",
        },
      ],
    },
    {
      slug: "meet-the-gateways",
      title: "Meet the Gateways: LiteLLM, OpenRouter, Portkey & More",
      summary: "A quick field guide to the gateway options this platform supports.",
      minutes: 6,
      blocks: [
        { type: "heading", text: "Overview" },
        {
          type: "p",
          text: "This platform doesn't build or run any of the gateways it lets you compare -- it's a workbench for trying out different options and registering the ones you already use. This lesson is a quick field guide to what each of the main options actually is, since the names get thrown around interchangeably even though the products differ in meaningful ways.",
        },
        {
          type: "p",
          text: "None of these is objectively 'best' -- they differ on hosting (self-hosted vs. managed), which providers they cover, pricing markup (if any), and how much operational tooling (logging, guardrails) they bundle in.",
        },
        { type: "heading", text: "How It Works" },
        {
          type: "list",
          items: [
            "Self-hosted vs. managed -- LiteLLM you run yourself (more control, more ops burden); OpenRouter and Portkey are managed services (less setup, an ongoing platform fee or markup instead).",
            "Provider coverage -- check that the gateway actually supports the specific provider/model you need before committing.",
            "Pricing model -- some gateways pass through provider pricing near cost, others add a per-token markup or a flat platform fee.",
            "Observability -- if you need detailed logs, guardrails, or audit trails, that's more of a Portkey-style strength than a bare LiteLLM install out of the box.",
          ],
        },
        { type: "heading", text: "A Worked Example" },
        {
          type: "example",
          title: "Same model, three gateways",
          text: "Say you want to call Claude Sonnet through three different gateways -- same model, same prompt. Through LiteLLM (self-hosted), you'd deploy the LiteLLM proxy yourself, point it at your Anthropic API key, and call your own proxy's OpenAI-compatible endpoint. Through OpenRouter, you'd sign up, add credit, and call OpenRouter's hosted endpoint with a model string like anthropic/claude-sonnet-5 -- no infrastructure to run yourself. Through Portkey, you'd register your Anthropic key in Portkey's dashboard and call Portkey's endpoint instead, getting request logs and guardrail rules along the way. Same model, same output -- different operational tradeoffs to get there.",
        },
        {
          type: "example",
          title: "When a custom endpoint fits better",
          text: "If your company already runs an internal LLM proxy for compliance reasons, that's exactly what the 'Custom HTTP endpoint' option is for -- point this platform at your existing proxy's URL instead of registering one of the public gateways.",
        },
        { type: "heading", text: "Analogies" },
        {
          type: "analogy",
          text: "Choosing between these is a bit like choosing between renting a car (a managed gateway -- someone else maintains the fleet), leasing and running your own (self-hosted LiteLLM -- more control, more responsibility), or already owning a company car (a custom internal endpoint you point this platform at instead of registering a public option).",
        },
        {
          type: "analogy",
          text: "Or think of them like payment processors: Stripe handles a lot for you and takes a cut (a managed gateway), versus building your own payment rails in-house (full control, full maintenance burden) -- same underlying job, very different operational shape.",
        },
        { type: "heading", text: "Key Terms" },
        {
          type: "terms",
          items: [
            {
              term: "LiteLLM",
              def: "An open-source gateway/SDK that normalizes 100+ providers behind one OpenAI-compatible API. Popular for self-hosting.",
            },
            {
              term: "OpenRouter",
              def: "A hosted gateway/marketplace giving access to many providers' models through one API and one bill, with per-model pricing shown upfront.",
            },
            {
              term: "Portkey",
              def: "A hosted gateway focused on production observability -- logging, guardrails, caching, and fallback rules on top of multiple providers.",
            },
            {
              term: "Azure OpenAI / Google Vertex",
              def: "A cloud platform's own managed endpoint for a specific provider's models (e.g. OpenAI models via Azure, Gemini via Google Cloud) -- more like a provider with extra enterprise plumbing than a multi-provider gateway.",
            },
            {
              term: "Custom HTTP endpoint",
              def: "Any other OpenAI-compatible or custom-shaped API you point this platform at -- your own self-hosted router, an internal proxy, etc.",
            },
          ],
        },
        { type: "heading", text: "Common Pitfalls" },
        {
          type: "callout",
          variant: "tip",
          text: "Don't pick a gateway purely on brand recognition -- check it actually supports the specific model/provider combination you need before committing, since coverage varies between products and changes over time.",
        },
        {
          type: "callout",
          variant: "warning",
          text: "A hosted gateway is another vendor in your dependency chain -- if OpenRouter or Portkey has an outage, your app is down even if the underlying model provider is fine, unless you've configured a way to bypass the gateway entirely.",
        },
        { type: "heading", text: "In SideBySide" },
        {
          type: "app",
          text: "Every gateway you register in Settings becomes selectable in Playground, Insights, and Benchmarks -- the platform doesn't favor one, it just gives you one place to compare them.",
          href: "/settings",
          linkLabel: "Register a gateway",
        },
        {
          type: "resources",
          items: [
            { title: "LiteLLM Docs", url: "https://docs.litellm.ai/", source: "LiteLLM Docs (official)", kind: "article" },
            {
              title: "OpenRouter Quickstart",
              url: "https://openrouter.ai/docs/quickstart",
              source: "OpenRouter Docs (official)",
              kind: "article",
            },
            {
              title: "What is Portkey?",
              url: "https://portkey.ai/docs/introduction/what-is-portkey",
              source: "Portkey Docs (official)",
              kind: "article",
            },
          ],
        },
      ],
      quiz: [
        {
          question: "What's a key difference between LiteLLM and a hosted gateway like Portkey?",
          options: [
            "LiteLLM only supports one model",
            "LiteLLM is commonly self-hosted/open-source; Portkey is a hosted service with built-in observability",
            "They are identical products",
            "Portkey doesn't support multiple providers",
          ],
          correctIndex: 1,
          explanation:
            "LiteLLM is widely used as a self-hosted, open-source router; Portkey is a managed, hosted gateway that adds production features like logging and guardrails.",
        },
        {
          question: "What is Azure OpenAI, in this context?",
          options: [
            "A multi-provider gateway like OpenRouter",
            "A cloud platform's managed endpoint for a specific provider's models",
            "An open-source project",
            "A benchmarking tool",
          ],
          correctIndex: 1,
          explanation:
            "Azure OpenAI serves a specific provider's (OpenAI's) models through Microsoft's cloud, closer to a managed provider endpoint than a multi-provider router.",
        },
        {
          question: "What's a practical first check before committing to a gateway for a specific project?",
          options: [
            "Its logo design",
            "Whether it actually supports the specific provider/model combination you need",
            "How many employees the company has",
            "Whether it's the newest one on the market",
          ],
          correctIndex: 1,
          explanation:
            "Coverage varies between gateways -- confirming your specific model/provider is supported avoids discovering a gap after you've already integrated.",
        },
        {
          question:
            "What operational risk does routing through a hosted gateway (like OpenRouter or Portkey) introduce that a direct provider call wouldn't have?",
          options: [
            "None, hosted gateways are risk-free",
            "The gateway itself becomes another point of failure -- if it's down, your app is down even if the underlying model provider is fine",
            "Hosted gateways make your app more secure with no tradeoffs",
            "There's no difference from calling providers directly",
          ],
          correctIndex: 1,
          explanation:
            "A hosted gateway is an additional dependency in the chain -- its uptime becomes your uptime, unless you've built in a way to bypass it on failure.",
        },
        {
          question: "Which factor most distinguishes LiteLLM from OpenRouter and Portkey?",
          options: [
            "LiteLLM supports more programming languages",
            "LiteLLM is commonly self-hosted (you run it); OpenRouter and Portkey are hosted managed services",
            "LiteLLM only works with one provider",
            "There is no meaningful difference",
          ],
          correctIndex: 1,
          explanation:
            "The self-hosted vs. managed distinction is the biggest practical difference -- it changes who's responsible for uptime, updates, and infrastructure.",
        },
      ],
    },
  ],
  test: [
    {
      question: "You're debugging a 401 error when calling a gateway's endpoint. What's the most likely cause?",
      options: [
        "The prompt was too creative",
        "A missing or invalid API key in the Authorization header",
        "The model's context window was exceeded",
        "The gateway is down",
      ],
      correctIndex: 1,
      explanation: "401 Unauthorized specifically points to an authentication problem -- almost always the API key, whether you're calling a provider directly or through a gateway.",
    },
    {
      question:
        "Your team currently calls Anthropic's API directly and wants to add OpenAI as a fallback option without rewriting all your integration code. What's the most direct fix?",
      options: [
        "Manually rewrite every code path to branch between two different SDKs",
        "Put a gateway in front of both providers and configure a fallback rule",
        "Just wait for one provider to add support for the other's API",
        "This isn't possible",
      ],
      correctIndex: 1,
      explanation:
        "This is exactly the problem gateways solve -- one consistent interface with fallback logic, instead of hand-rolled branching between provider-specific SDKs.",
    },
    {
      question: "Which pairing correctly matches a product to its category?",
      options: ["Anthropic -- gateway", "LiteLLM -- provider", "OpenRouter -- gateway", "Claude -- gateway"],
      correctIndex: 2,
      explanation:
        "OpenRouter is a gateway sitting in front of multiple providers' models; Anthropic is a provider, LiteLLM is a gateway, and Claude is a model, not a gateway.",
    },
    {
      question: "A request is billed to your account based on which credential?",
      options: ["Your IP address", "The API key included in the request", "The model's name", "The time of day"],
      correctIndex: 1,
      explanation: "The API key both authorizes the request and identifies the account it should be billed to.",
    },
    {
      question: "What's the main tradeoff of self-hosting a gateway like LiteLLM versus using a managed one like Portkey?",
      options: [
        "Self-hosting is always cheaper and easier",
        "Self-hosting gives more control but shifts operational/maintenance burden onto you",
        "There is no tradeoff",
        "Managed gateways can't be used in production",
      ],
      correctIndex: 1,
      explanation: "Self-hosting trades convenience for control -- you own uptime, updates, and infrastructure instead of a vendor.",
    },
    {
      question: "If a gateway's caching layer serves a cached response instead of calling the model, what does that save?",
      options: [
        "Nothing, it's purely for speed with no cost impact",
        "Tokens/cost for that repeated request, and usually latency too",
        "Only latency, never cost",
        "It saves nothing measurable",
      ],
      correctIndex: 1,
      explanation: "Serving from cache means skipping a fresh generation entirely, which avoids both the token cost and the wait for a new response.",
    },
    {
      question: "Why does normalizing request/response formats matter when a gateway sits in front of multiple providers?",
      options: [
        "It doesn't matter, all providers use identical formats already",
        "Different providers have different API shapes, so normalization lets your code use one consistent format regardless of which provider actually handles the request",
        "Normalization is only cosmetic and has no functional purpose",
        "It's required by law",
      ],
      correctIndex: 1,
      explanation:
        "Providers differ in how they structure requests/responses -- normalization is what lets a gateway present one consistent shape to your code no matter which provider is behind it.",
    },
    {
      question: "Which of these operational features is NOT something a typical LLM gateway adds on top of a raw provider API?",
      options: [
        "Routing requests to different models based on rules",
        "Automatically training a new custom model from scratch",
        "Fallback to a backup provider on failure",
        "Aggregated cost tracking across providers",
      ],
      correctIndex: 1,
      explanation: "Gateways route, fall back, cache, and track cost/usage -- they don't train models. Model training is a provider-side (or separate ML infra) concern.",
    },
  ],
};

export default gatewaysModule;
