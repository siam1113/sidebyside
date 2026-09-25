import type { LearnModule } from "../types";

const fundamentalsModule: LearnModule = {
  slug: "fundamentals",
  title: "AI Fundamentals",
  tagline: "Start here if AI still feels like a black box",
  description:
    "The absolute basics -- what a language model is, how it reads your words, and the settings that shape what it says back.",
  lessons: [
    {
      slug: "what-is-an-llm",
      title: "What Is a Large Language Model?",
      summary: "The 30-second version of what's actually running behind every chat box.",
      minutes: 7,
      blocks: [
        { type: "heading", text: "Overview" },
        {
          type: "p",
          text: "A Large Language Model (LLM) is a program trained on huge amounts of text -- books, websites, code, conversations -- to get extremely good at one specific skill: predicting what word (or word-fragment) comes next, given everything written so far. There's no built-in database of facts it looks up, and no separate 'understanding' module. Every reply you see, from a one-line answer to a 2,000-word essay, is built one predicted fragment at a time.",
        },
        {
          type: "p",
          text: "Training means feeding the model enormous amounts of text and repeatedly asking it to guess the next token, then nudging its internal parameters whenever it guesses wrong. Do this trillions of times across a big enough slice of the internet, books, and code, and the model ends up encoding a huge amount of world knowledge and language structure -- not because it was told facts directly, but because predicting text well turns out to require picking up on patterns, relationships, and even some reasoning-like behavior. 'Large' refers to the number of parameters (the internal numbers the model tunes during training) -- modern models range from a few billion to over a trillion.",
        },
        { type: "heading", text: "How It Works" },
        {
          type: "p",
          text: "Under the hood, generation is autoregressive: the model looks at every token so far (your prompt plus whatever it's already generated), computes a probability for every possible next token, samples one, appends it, and repeats. This continues until it produces a special 'stop' token, hits a length limit, or is told to stop. There's no separate planning step by default -- the 'plan' for a long answer emerges token by token, which is part of why asking a model to think step by step before answering can improve quality: it gives the model a scratchpad to work through the problem before committing to a final answer.",
        },
        {
          type: "list",
          items: [
            "It doesn't 'know' things the way a database does -- it generates the statistically likely continuation of your text.",
            "The same input can produce slightly different output each time (more on that in the temperature lesson).",
            "Bigger, more recently trained models tend to be more capable, but usually cost more per response too.",
          ],
        },
        { type: "heading", text: "A Worked Example" },
        {
          type: "example",
          title: "Example: a near-certain continuation",
          text: "Send the prompt 'The capital of France is' and the model doesn't look France up in a table. It's seen that exact phrase (or close variants) so many times during training that its learned probabilities put enormous weight on the token ' Paris' as the most likely continuation -- comfortably over 99% probability. Ask something the model has seen far less of, like a trivia question about a country you just invented in the prompt, and it has to lean much more heavily on general patterns instead of a near-certain memorized continuation -- which is exactly when you start seeing more hedging, more variation between runs, and occasional confident-sounding wrong answers (a 'hallucination').",
        },
        {
          type: "example",
          title: "Example: a code completion",
          text: "Ask a model to continue 'def add(a, b):\\n    return'. Its training included millions of Python functions with exactly this shape, so it predicts ' a + b' with very high confidence -- not because it 'understands' addition, but because that continuation was overwhelmingly the statistically likely one across everything it read.",
        },
        { type: "heading", text: "Analogies" },
        {
          type: "analogy",
          text: "Think of the world's most well-read autocomplete. When your phone suggests the next word as you type, it's doing a tiny, crude version of the same thing. An LLM is that same idea scaled up millions of times, trained on far more text, and good enough that 'predict the next word' starts to look like reasoning, writing, and conversation.",
        },
        {
          type: "analogy",
          text: "A second way to see it: picture an enormous committee where every member has read a different slice of the internet, and whenever you start a sentence, the committee votes on what a highly-read human would type next, weighted by how confident each member is. The model is the aggregate of that vote, compressed into one set of numbers you query instead of literally convening a committee each time.",
        },
        { type: "heading", text: "Key Terms" },
        {
          type: "terms",
          items: [
            {
              term: "Parameter",
              def: "One of the internal numbers a model tunes during training -- roughly, a knob that gets adjusted trillions of times until the model's predictions get good. Model size is usually quoted in parameter count.",
            },
            {
              term: "Inference",
              def: "Running a trained model to generate output (as opposed to training it) -- every time you send a prompt and get a reply, that's one inference pass.",
            },
            {
              term: "Hallucination",
              def: "A confident-sounding but incorrect or fabricated response -- a natural consequence of a model generating plausible text rather than looking up verified facts.",
            },
          ],
        },
        { type: "heading", text: "Common Pitfalls" },
        {
          type: "callout",
          variant: "warning",
          text: "Because an LLM will confidently produce plausible-sounding text even when it's effectively guessing, never treat a single unverified response as ground truth for anything high-stakes (medical, legal, financial) -- cross-check important claims.",
        },
        {
          type: "callout",
          variant: "tip",
          text: "It's easy to anthropomorphize an LLM as 'thinking' or 'wanting' something. That's useful shorthand, but it can lead to bad intuitions -- like assuming it 'remembers' your last conversation when, without explicit history being resent, it genuinely doesn't.",
        },
        { type: "heading", text: "In SideBySide" },
        {
          type: "app",
          text: "Every response you see in Playground and Sandbox is an LLM doing exactly this -- one prompt in, one predicted continuation out.",
          href: "/playground",
          linkLabel: "Try it in Playground",
        },
        { type: "heading", text: "Watch" },
        {
          type: "video",
          items: [
            {
              title: "But what is a GPT? Visual intro to transformers",
              url: "https://www.youtube.com/watch?v=yMQPQuz5WpA",
              source: "YouTube -- 3Blue1Brown",
            },
            {
              title: "[1hr Talk] Intro to Large Language Models",
              url: "https://www.youtube.com/watch?v=zjkBMFhNj_g",
              source: "YouTube -- Andrej Karpathy",
            },
          ],
        },
        {
          type: "resources",
          items: [
            {
              title: "What Are Large Language Models (LLMs)?",
              url: "https://www.ibm.com/think/topics/large-language-models",
              source: "IBM Think",
              kind: "article",
            },
          ],
        },
      ],
      quiz: [
        {
          question: "What is an LLM fundamentally doing when it generates a reply?",
          options: [
            "Looking up the answer in a database",
            "Predicting the most likely next piece of text, over and over",
            "Running a fixed decision tree of if/else rules",
            "Searching the internet in real time",
          ],
          correctIndex: 1,
          explanation:
            "LLMs generate text by repeatedly predicting the next token based on patterns learned during training -- they don't look anything up live unless a tool explicitly gives them that ability.",
        },
        {
          question: "Why might the same prompt produce a different answer on two separate runs?",
          options: [
            "The model is broken",
            "Generation involves picking from likely next-words, not one fixed answer",
            "The internet connection changed",
            "It only happens with cheap models",
          ],
          correctIndex: 1,
          explanation:
            "Unless settings are locked down (e.g. temperature 0), the model samples among several likely next-words at each step, so wording can vary run to run.",
        },
        {
          question: "What does 'training' an LLM primarily involve?",
          options: [
            "Manually writing rules for every possible question",
            "Repeatedly predicting next tokens across huge amounts of text and adjusting internal parameters when wrong",
            "Copying answers from a search engine into a database",
            "Recording every user conversation to learn from",
          ],
          correctIndex: 1,
          explanation:
            "Training is the repeated next-token-prediction-and-correction process across a large text corpus -- there's no step where facts get manually entered.",
        },
        {
          question:
            "Why might an LLM answer a well-known fact very confidently but hedge or vary on an obscure or made-up one?",
          options: [
            "It has a bug",
            "Well-known facts appear so often in training data that the model's learned probabilities are sharply peaked on the correct continuation; obscure or novel prompts rely more on general patterns, which is less certain",
            "Obscure questions use more tokens",
            "The model refuses to answer obscure questions",
          ],
          correctIndex: 1,
          explanation:
            "The more consistently a pattern appeared during training, the more confidently peaked the model's next-token probabilities are for it; rare or novel inputs get less certain, more variable predictions.",
        },
        {
          question: "What does 'autoregressive' generation mean?",
          options: [
            "The model regenerates its training data automatically",
            "Each new token is produced based on all tokens so far, one at a time, feeding back into the next step",
            "The model automatically corrects grammar errors",
            "Generation happens in a random, non-sequential order",
          ],
          correctIndex: 1,
          explanation:
            "Autoregressive generation means the model predicts the next token conditioned on everything generated (and prompted) so far, then repeats -- a sequential feedback loop.",
        },
      ],
    },
    {
      slug: "what-is-a-prompt",
      title: "What Is a Prompt?",
      summary: "The input side of the conversation -- and why how you phrase it changes everything.",
      minutes: 7,
      blocks: [
        { type: "heading", text: "Overview" },
        {
          type: "p",
          text: "A prompt is simply the text you send to a model to get a response. It can be a single question, a full document you want summarized, or a detailed set of instructions. Because the model has no memory between separate requests, the prompt -- plus anything explicitly sent alongside it -- is the entire world the model can see when it answers.",
        },
        {
          type: "p",
          text: "Prompts aren't limited to plain instructions -- they can include reference text to summarize, examples of the exact output format you want (few-shot examples), or structured data like a schema the model should follow. Everything you want the model to consider has to be present in the prompt (or the conversation history sent alongside it) at the moment you send the request; there's no side channel where the model can go check something you didn't include.",
        },
        { type: "heading", text: "How It Works" },
        {
          type: "p",
          text: "Even though system prompt, history, and the latest user message feel like separate inputs in a chat UI, most APIs assemble them into a single ordered sequence of tokens before the model ever sees them, with role markers (system/user/assistant) woven in so the model can tell whose turn is whose. That's also why a system prompt isn't a hard security boundary by default -- it's just text earlier in the same sequence, which is part of why prompt injection (getting a model to ignore its instructions via cleverly crafted input) is a real concern in agentic and tool-using systems.",
        },
        { type: "heading", text: "A Worked Example" },
        {
          type: "example",
          title: "Example: the same question, two system prompts",
          text: "System prompt: 'You are a terse assistant. Answer in one sentence, no pleasantries.' User prompt: 'What's the boiling point of water at sea level?' Response: '100 degrees Celsius (212 degrees Fahrenheit).' Swap the system prompt to 'You are a friendly tutor explaining things to a curious 10-year-old,' keep the exact same user prompt, and the response balloons into an enthusiastic multi-sentence explanation with an analogy -- same question, same facts, completely different shape, because the system prompt is doing all the steering.",
        },
        {
          type: "example",
          title: "Example: history changes the answer",
          text: "Turn 1 -- user: 'My favorite color is teal.' Turn 2 -- user: 'What color should I paint my room?' If turn 1 isn't resent as history alongside turn 2, the model has no idea teal was ever mentioned and suggests something generic. Resend it, and the model can reasonably suggest teal or a complementary color -- the only difference is whether that earlier text was included in the request.",
        },
        { type: "heading", text: "Analogies" },
        {
          type: "analogy",
          text: "Imagine handing a very capable, very literal assistant a sticky note with zero other context, every single time you ask something. The system prompt is like a standing instruction taped to their desk ('always answer in French, be concise'); the user prompt is today's sticky note; conversation history is the stack of previous sticky notes you hand over so they remember what was already said.",
        },
        {
          type: "analogy",
          text: "Or think of it like ordering at a restaurant with a very literal waiter who has zero memory between visits. The chef's standing instructions from the owner (system prompt) apply to every dish; what you say at the table today (user prompt) is your specific order; and if you want the waiter to remember you asked for no onions last time, you have to say it again today (conversation history) -- the kitchen never automatically remembers a past visit.",
        },
        { type: "heading", text: "Key Terms" },
        {
          type: "terms",
          items: [
            {
              term: "System prompt",
              def: "Background instructions set before the conversation starts -- tone, role, rules the model should follow. The user doesn't usually see or write this.",
            },
            { term: "User prompt", def: "The actual message a person types -- the question or task." },
            {
              term: "Conversation history",
              def: "Earlier turns resent alongside a new message so the model has context; without it, each request is a blank slate.",
            },
            {
              term: "Few-shot prompt",
              def: "A prompt that includes a handful of example input/output pairs to show the model the exact pattern you want, rather than only describing it in words.",
            },
            {
              term: "Prompt injection",
              def: "Text inside user input or retrieved content that tries to override the system prompt's instructions -- a real risk for anything that feeds untrusted text into a prompt.",
            },
          ],
        },
        { type: "heading", text: "Common Pitfalls" },
        {
          type: "callout",
          variant: "tip",
          text: "If you want consistent formatting (e.g. always JSON, always three bullet points), showing one or two example outputs in the prompt (few-shot) is usually more reliable than only describing the format in prose.",
        },
        {
          type: "callout",
          variant: "warning",
          text: "Don't assume a system prompt is unbreakable -- if a user, or a document the model reads, can inject text that looks like new instructions, a determined adversary may get the model to disregard the original system prompt.",
        },
        { type: "heading", text: "In SideBySide" },
        {
          type: "app",
          text: "In Playground, the box you type into is the user prompt -- it gets sent to every gateway/model you've selected, in parallel, so you can compare how differently each one responds to the exact same input.",
          href: "/playground",
          linkLabel: "Open Playground",
        },
        {
          type: "resources",
          items: [
            {
              title: "What should go in the system prompt vs. the user prompt?",
              url: "https://hamel.dev/blog/posts/evals-faq/what-should-go-in-the-system-prompt-vs-the-user-prompt.html",
              source: "Hamel's Blog",
              kind: "article",
            },
          ],
        },
      ],
      quiz: [
        {
          question: "Why does conversation history need to be resent with every message?",
          options: [
            "Models remember previous chats automatically",
            "Models have no memory between separate requests unless history is included",
            "It's only needed for long conversations",
            "It makes responses cheaper",
          ],
          correctIndex: 1,
          explanation:
            "Each request is independent -- if you want the model to 'remember' earlier turns, that earlier text has to be included again in the new request.",
        },
        {
          question: "What's the difference between a system prompt and a user prompt?",
          options: [
            "There is no difference",
            "System prompt sets standing background instructions; user prompt is the specific ask",
            "System prompt is always longer",
            "User prompt is optional",
          ],
          correctIndex: 1,
          explanation: "System prompts configure behavior/role ahead of time; the user prompt is the actual per-turn request.",
        },
        {
          question:
            "You want an LLM to always reply in exactly three numbered bullet points. What's typically the most reliable way to get that consistently?",
          options: [
            "Just say 'be concise' in the prompt",
            "Show one or two example outputs in the exact three-bullet format (few-shot) alongside the instruction",
            "Increase the temperature",
            "It's not possible to control output format",
          ],
          correctIndex: 1,
          explanation:
            "Concrete examples (few-shot prompting) tend to lock in formatting more reliably than a prose description alone, since the model can pattern-match the example's exact shape.",
        },
        {
          question: "What is 'prompt injection'?",
          options: [
            "A technique for making prompts shorter",
            "Text within user input or retrieved content that tries to override a system prompt's instructions",
            "A type of API key",
            "Automatically injecting conversation history into every request",
          ],
          correctIndex: 1,
          explanation:
            "Prompt injection is when untrusted text embedded in the input tries to hijack the model's instructions -- a security concern especially for agents that read external content.",
        },
        {
          question:
            "Why do system prompt, user prompt, and history all end up feeding into 'the same model call' rather than being handled as separate isolated inputs?",
          options: [
            "They aren't actually combined, each is processed separately",
            "Most APIs assemble them into one ordered token sequence with role markers before the model ever runs",
            "Only the user prompt is ever sent to the model",
            "History is stored on the provider's servers automatically",
          ],
          correctIndex: 1,
          explanation:
            "Despite feeling like separate UI fields, system/user/history text is typically concatenated into a single sequence with role markers so the model can attend to all of it together.",
        },
      ],
    },
    {
      slug: "tokens-and-context-windows",
      title: "Tokens & Context Windows",
      summary: "The units models actually think in, and the hard limit on how much they can see at once.",
      minutes: 8,
      blocks: [
        { type: "heading", text: "Overview" },
        {
          type: "p",
          text: "Models don't read in whole words -- they break text into chunks called tokens. A token is often close to a word, but can be a piece of a word, a punctuation mark, or a few characters. As a rough rule of thumb in English, about 750 words is roughly 1,000 tokens.",
        },
        {
          type: "p",
          text: "Tokenization isn't purely word-based -- common words often map to a single token, while rarer words, made-up words, or non-English text can split into several token pieces. This is also why the same sentence can cost a different number of tokens depending on the model's tokenizer, and why dense languages or heavy use of rare technical jargon can quietly eat more of your budget than plain English of the same length.",
        },
        { type: "heading", text: "How It Works" },
        {
          type: "p",
          text: "The context window is the maximum number of tokens a model can consider at once -- your prompt, any attached documents, conversation history, and the model's own reply all have to fit inside this single budget. When a request would exceed it, what happens depends on the API: some providers simply reject the request with an error, others (especially in chat UIs) silently drop or summarize the oldest messages to make room for the new ones. Either way, tokens spent on padding out irrelevant history are tokens unavailable for the answer -- which is why trimming stale context matters for both cost and for leaving enough headroom for a long response.",
        },
        {
          type: "terms",
          items: [
            { term: "Token", def: "The basic unit of text a model reads and generates -- roughly a word-piece." },
            { term: "Context window", def: "The total token budget for one request: input plus output combined." },
            {
              term: "Output cap",
              def: "A separate, usually smaller, limit on how many tokens the model is allowed to generate in its reply.",
            },
            {
              term: "Tokenizer",
              def: "The specific algorithm a model uses to split text into tokens -- different model families use different tokenizers, so token counts for the same text can vary between them.",
            },
            {
              term: "Truncation",
              def: "What happens when content is cut to fit inside the context window, either by rejecting the request or dropping the oldest parts.",
            },
          ],
        },
        { type: "heading", text: "A Worked Example" },
        {
          type: "example",
          title: "Example: how much actually fits",
          text: "A 200,000-token context window sounds enormous, but an average paperback novel is roughly 100,000-120,000 words, which is around 130,000-160,000 tokens -- meaning you could fit almost two whole novels' worth of text in one request, prompt and reply included. Compare that to an 8,000-token context window (common on older or smaller models): that's only about 6,000 words, roughly ten pages -- paste in a 30-page PDF and most of it simply won't fit.",
        },
        {
          type: "example",
          title: "Example: turning tokens into a dollar figure",
          text: "If a model prices input at $3 per million tokens and output at $15 per million tokens, sending a 2,000-token prompt and getting back a 500-token reply costs (2,000 / 1,000,000 x $3) + (500 / 1,000,000 x $15) = $0.006 + $0.0075 = $0.0135 -- roughly a penny and a half for that one exchange.",
        },
        { type: "heading", text: "Analogies" },
        {
          type: "analogy",
          text: "Picture the context window as a desk of fixed size. Every document, note, and sticky reminder you place on it (your prompt, your files, the chat history) has to physically fit -- and the model's own notepad for writing its answer takes up desk space too. A bigger desk lets you hand over a whole book instead of one page, but it doesn't make the assistant smarter, just able to see more at once.",
        },
        {
          type: "analogy",
          text: "Or think of a moving truck with a fixed cargo capacity: your prompt, your attached documents, the conversation history, and the model's own written answer all have to be loaded into the same truck. Rent a bigger truck (a model with a larger context window) and you can move more at once, but the truck doesn't get smarter at packing or driving -- it just has more room.",
        },
        { type: "heading", text: "Common Pitfalls" },
        {
          type: "callout",
          variant: "tip",
          text: "When working with long documents, check a model's context window in Insights before you start -- discovering mid-task that your file got silently truncated is a common and confusing failure mode.",
        },
        {
          type: "callout",
          variant: "warning",
          text: "A large context window doesn't mean a model reads everything in it equally well -- information buried in the middle of a very long context can get less attention than information near the start or end, an effect sometimes called 'lost in the middle.'",
        },
        { type: "heading", text: "In SideBySide" },
        {
          type: "app",
          text: "The Insights tab lists every model's context window and output cap side by side, so you can pick a model that actually fits your document instead of finding out mid-run that it got truncated.",
          href: "/insights",
          linkLabel: "Compare context windows in Insights",
        },
        {
          type: "resources",
          items: [
            {
              title: "LLM context windows: what they are & how they work",
              url: "https://redis.io/blog/llm-context-windows/",
              source: "Redis Blog",
              kind: "article",
            },
          ],
        },
      ],
      quiz: [
        {
          question: "Roughly how many tokens is 750 English words?",
          options: ["~100 tokens", "~1,000 tokens", "~10,000 tokens", "Exactly 750 tokens, always"],
          correctIndex: 1,
          explanation:
            "The common rule of thumb is about 1,000 tokens per 750 words of English text, though it varies by tokenizer and language.",
        },
        {
          question: "What does a model's context window actually limit?",
          options: [
            "Only how long its reply can be",
            "Only how long your prompt can be",
            "The combined total of input plus output tokens for one request",
            "How many requests you can send per day",
          ],
          correctIndex: 2,
          explanation: "The context window is a shared budget -- prompt, history, and the generated reply all draw from the same total.",
        },
        {
          question: "A model has an 8,000-token context window. You send a 7,500-token prompt. Roughly how many tokens are left for the reply?",
          options: ["About 7,500", "About 500", "Exactly 8,000", "There's no limit on the reply"],
          correctIndex: 1,
          explanation:
            "Context window is a shared budget -- 8,000 total minus the 7,500 already used by the prompt leaves roughly 500 tokens of headroom for the response.",
        },
        {
          question: "Why can the same sentence cost different numbers of tokens on two different models?",
          options: [
            "It can't, token counts are universal",
            "Different models use different tokenizers, which can split the same text differently",
            "Only English text gets tokenized",
            "Token count depends on temperature",
          ],
          correctIndex: 1,
          explanation: "Tokenization is model/family-specific -- there's no single universal tokenizer, so identical text can yield different token counts across models.",
        },
        {
          question: "What's a practical reason to check a model's context window before sending it a large document?",
          options: [
            "Context window has no practical effect",
            "Exceeding it can cause the request to fail or silently drop content, wasting your prompt",
            "It only affects cost, never correctness",
            "Context window only matters for images",
          ],
          correctIndex: 1,
          explanation:
            "Going over budget either errors out or silently truncates content -- checking the window ahead of time avoids a confusing partial or failed result.",
        },
      ],
    },
    {
      slug: "generation-settings",
      title: "Temperature & Other Generation Settings",
      summary: "The dials that control how creative, focused, or predictable a model's output is.",
      minutes: 7,
      blocks: [
        { type: "heading", text: "Overview" },
        {
          type: "p",
          text: "At each step, a model computes a probability for many possible next tokens and then samples one -- it doesn't just pick a single 'correct' token. Generation settings control how that sampling happens.",
        },
        {
          type: "p",
          text: "These settings don't change what the model 'knows' -- they only change how it samples from the probability distribution it already computed for the next token. That means the same underlying model can feel wildly different in personality (terse and predictable vs. wandering and inventive) purely from generation settings, with zero change to the model itself or the prompt.",
        },
        { type: "heading", text: "How It Works" },
        {
          type: "p",
          text: "Mechanically, temperature rescales the model's raw next-token probabilities before sampling: lower temperature sharpens the distribution so the top candidate dominates even more, while higher temperature flattens it so less-likely tokens get a real chance of being picked. Top-p works differently -- it doesn't reshape probabilities, it truncates the candidate pool to only the most likely tokens whose probabilities add up to p, then samples from just that shortlist. The two are often used together: top-p narrows the field to sensible options, and temperature controls how boldly to pick among them.",
        },
        {
          type: "terms",
          items: [
            {
              term: "Temperature",
              def: "Controls randomness. Near 0 = almost always picks the most likely token (focused, repeatable). Higher (0.8-1.2) = more variety and creativity, but more chance of going off the rails.",
            },
            {
              term: "Top-p (nucleus sampling)",
              def: "Instead of considering every possible token, only samples from the smallest set of tokens whose combined probability reaches p (e.g. 0.9 = the top 90% likely mass).",
            },
            {
              term: "Max tokens",
              def: "A hard cap on how long the generated reply is allowed to be, regardless of whether the model was 'finished.'",
            },
            {
              term: "Seed",
              def: "An optional fixed starting value for the random sampling process -- setting the same seed (with temperature above 0) can make output more reproducible run to run, though it isn't a guarantee across all providers.",
            },
          ],
        },
        { type: "heading", text: "A Worked Example" },
        {
          type: "example",
          title: "Example: five runs, two temperatures",
          text: "Prompt: 'Write a tagline for a coffee shop.' At temperature 0, asking the same prompt five times in a row is likely to return the exact same tagline every time, or very close to it -- the model keeps picking its single most-probable next word at each step. At temperature 1.0, five runs might return five genuinely different taglines, some sharp, maybe one a little strange, because the model is willing to pick a less-obvious next word here and there.",
        },
        {
          type: "example",
          title: "Example: when top-p barely matters",
          text: "A pipeline extracting structured fields from receipts sets temperature to 0 and leaves top-p at its default. With the single top candidate already dominating the distribution at temperature 0, top-p's filtering has almost nothing left to narrow -- it's the temperature setting doing essentially all the work here.",
        },
        { type: "heading", text: "Analogies" },
        {
          type: "analogy",
          text: "Temperature is like telling a chef how strictly to follow a recipe. At temperature 0: same dish, exactly the recipe, every time -- reliable but never surprising. At temperature 1+: the chef starts improvising with substitutions -- sometimes brilliant, sometimes a strange combination you didn't want.",
        },
        {
          type: "analogy",
          text: "Or picture a musician improvising over a chord progression. Temperature 0 is playing the sheet music exactly as written, note for note, every performance identical. Higher temperature is more improvisation -- straying from the expected notes more often, which can produce something more interesting but occasionally a clunker.",
        },
        { type: "heading", text: "Common Pitfalls" },
        {
          type: "callout",
          variant: "tip",
          text: "Use low temperature for tasks with one right answer (data extraction, code, math). Use higher temperature for brainstorming, creative writing, or generating varied options.",
        },
        {
          type: "callout",
          variant: "warning",
          text: "Cranking temperature all the way up isn't 'more creative' in a reliably useful way past a certain point -- very high temperature (roughly above 1.3-1.5, depending on the model) tends to produce output that's less coherent rather than more inspired.",
        },
        {
          type: "resources",
          items: [
            {
              title: "How do temperature, top-k, and top-p sampling differ?",
              url: "https://sebastianraschka.com/faq/docs/temperature-topk-topp-sampling.html",
              source: "Sebastian Raschka",
              kind: "article",
            },
            {
              title: "LLM Settings",
              url: "https://www.promptingguide.ai/introduction/settings",
              source: "Prompt Engineering Guide",
              kind: "article",
            },
          ],
        },
      ],
      quiz: [
        {
          question:
            "You're extracting structured data from invoices and need consistent, repeatable output. What temperature should you lean toward?",
          options: ["High, e.g. 1.2", "Low, e.g. 0-0.2", "It doesn't matter", "Always exactly 0.5"],
          correctIndex: 1,
          explanation:
            "Low temperature makes the model consistently pick its most likely (usually most 'correct') tokens -- ideal for deterministic tasks like extraction.",
        },
        {
          question: "What does max tokens control?",
          options: [
            "How random the output is",
            "How many tokens the model is allowed to see as input",
            "A hard cap on the length of the generated reply",
            "The model's temperature",
          ],
          correctIndex: 2,
          explanation: "Max tokens caps the output length -- generation stops there even mid-thought if the limit is hit.",
        },
        {
          question: "What does top-p (nucleus sampling) do differently from temperature?",
          options: [
            "They do the exact same thing",
            "Top-p restricts sampling to a shortlist of the most likely tokens up to a probability mass p, rather than reshaping the whole distribution",
            "Top-p controls the output length",
            "Top-p is only used for images",
          ],
          correctIndex: 1,
          explanation:
            "Top-p truncates the candidate pool to the smallest set of tokens covering probability mass p, then samples from that shortlist -- distinct from temperature's global reshaping of probabilities.",
        },
        {
          question: "Running the same prompt five times at temperature 0 typically produces:",
          options: [
            "Five completely different answers",
            "The same or nearly the same answer each time",
            "An error after the first run",
            "Random gibberish",
          ],
          correctIndex: 1,
          explanation: "At temperature 0 the model consistently picks its single most probable next token at each step, so output is highly repeatable.",
        },
        {
          question: "Why doesn't cranking temperature very high reliably make output 'more creative and better'?",
          options: [
            "High temperature always improves quality",
            "Past a point, very high temperature tends to reduce coherence rather than add useful creativity",
            "Temperature has no effect on output at all",
            "High temperature only affects cost, not content",
          ],
          correctIndex: 1,
          explanation:
            "Very high temperature flattens the probability distribution so much that the model starts picking implausible tokens too often, degrading coherence rather than yielding better creativity.",
        },
      ],
    },
  ],
  test: [
    {
      question:
        "Why does an LLM answer 'What's the capital of France?' with high, consistent confidence but give more varied answers to an obscure question barely covered in its training data?",
      options: [
        "It's a bug that only affects obscure topics",
        "Frequently-seen patterns produce sharply peaked next-token probabilities; rare or novel prompts rely more on general patterns, which are less certain",
        "Obscure questions always exceed the context window",
        "Temperature automatically increases for unfamiliar topics",
      ],
      correctIndex: 1,
      explanation:
        "How confidently peaked a model's next-token predictions are tracks how often that pattern appeared during training -- common facts are near-certain, rare or novel ones are not.",
    },
    {
      question:
        "You're writing a very long system prompt packed with detailed instructions and few-shot examples. What's a real cost of doing that?",
      options: [
        "No cost, system prompts are free",
        "It consumes part of the context window and token budget on every single request, leaving less room for the user's content and the reply",
        "It makes the model ignore temperature settings",
        "It disables conversation history",
      ],
      correctIndex: 1,
      explanation:
        "System prompt text counts against the same token budget as everything else in the request -- a long system prompt leaves less room for user content and the reply.",
    },
    {
      question:
        "For extracting exact dates and amounts from long scanned invoices (long input, short structured output), which setup is most appropriate?",
      options: [
        "A model with a small context window and high temperature",
        "A model with a context window large enough for the invoice, set to a low temperature for consistent structured output",
        "Context window and temperature are irrelevant to this task",
        "Always maximize max tokens regardless of expected output length",
      ],
      correctIndex: 1,
      explanation:
        "Long input needs enough context window to avoid truncation; structured, deterministic output benefits from low temperature.",
    },
    {
      question:
        "A user pastes a document into the prompt and asks a question about it, but the model answers as if it never saw the document. What's the most likely cause?",
      options: [
        "The model is broken",
        "The document text wasn't actually included in the request that was sent (e.g. dropped due to truncation or a bug), so the model has no access to it",
        "Temperature was set too low",
        "The model refuses to read documents",
      ],
      correctIndex: 1,
      explanation:
        "Since the prompt (plus history) is the model's entire world, if the document text didn't actually make it into the request, the model has no way to know about it.",
    },
    {
      question: "Two runs of the exact same prompt at temperature 0.9 produce different wording. Does this indicate a problem?",
      options: [
        "Yes, it indicates a bug",
        "No -- at nonzero temperature, generation intentionally samples among several likely next tokens at each step, so variation is expected",
        "Yes, only paid models should vary",
        "No, but it means the context window was exceeded",
      ],
      correctIndex: 1,
      explanation: "Variation at nonzero temperature is expected sampling behavior, not a malfunction.",
    },
    {
      question: "A model prices output at $15 per million tokens. A reply uses 2,000 output tokens. Roughly what does that cost in output tokens alone?",
      options: ["$0.03", "$3.00", "$0.30", "$30.00"],
      correctIndex: 0,
      explanation: "(2,000 / 1,000,000) x $15 = $0.03.",
    },
    {
      question:
        "You want a support bot to always respond in a strict, identical JSON schema for automated parsing. Which combination best supports that?",
      options: [
        "High temperature and a vague instruction",
        "A few-shot example of the exact JSON shape in the prompt, plus a low temperature",
        "Only raising max tokens",
        "Removing the system prompt entirely",
      ],
      correctIndex: 1,
      explanation: "Concrete few-shot examples anchor the exact format, and low temperature keeps output consistent across calls.",
    },
    {
      question: "Which statement correctly relates tokens, context window, prompt, and temperature?",
      options: [
        "Tokens are pieces of text; the context window is the total token budget for a request; the prompt (plus history) fills part of that budget; temperature controls how the model samples among likely next tokens during generation",
        "Temperature sets the context window size",
        "The context window is measured in words, not tokens, and temperature has no relation to tokens",
        "Prompts are unrelated to tokens or context windows",
      ],
      correctIndex: 0,
      explanation:
        "Tokens are the atomic unit; the context window is the token budget; the prompt/history occupies part of it; temperature is a separate sampling-time control over next-token choice.",
    },
  ],
};

export default fundamentalsModule;
