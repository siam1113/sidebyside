import type { LearnModule } from "../types";

const evaluatingModule: LearnModule = {
  slug: "evaluating",
  title: "Comparing & Evaluating Models",
  tagline: "Turning 'which model is better' from a guess into a measurement",
  description:
    "How to read a side-by-side comparison, what benchmarks actually test, and how to record the decision you land on.",
  lessons: [
    {
      slug: "reading-a-comparison",
      title: "Reading a Side-by-Side Comparison",
      summary: "What to actually look at when several models answer the same prompt.",
      minutes: 6,
      blocks: [
        { type: "heading", text: "Overview" },
        {
          type: "p",
          text: "When the same prompt goes to multiple gateways/models at once, you get several dimensions to compare, not just 'whose answer sounds nicer.' Quality is real but subjective -- pair it with the numbers underneath it: how long the response took, what it cost, and how many tokens it burned to get there.",
        },
        {
          type: "p",
          text: "A side-by-side comparison is only useful if you're comparing apples to apples: the same prompt, the same system instructions, and ideally the same generation settings (temperature, max tokens) across every model. Change any of those between runs and you're no longer measuring which model is better -- you're measuring which setup you gave it.",
        },
        { type: "heading", text: "How to Weigh the Dimensions" },
        {
          type: "p",
          text: "There's no universal formula for 'quality plus cost plus latency equals winner' -- the right weighting depends entirely on what you're building. A customer-facing chat feature might tolerate a higher cost per response in exchange for lower latency, since users notice delay immediately. A nightly batch job that processes ten thousand records overnight barely notices an extra two seconds per call but very much notices a 3x price difference multiplied by ten thousand.",
        },
        {
          type: "list",
          items: [
            "Read the actual output first, not just the numbers -- a fast, cheap answer that's subtly wrong is worse than a slower, pricier one that's right.",
            "Run more than one prompt before deciding -- one comparison can be a fluke; a handful of representative prompts tells you more.",
            "Note whether the difference is consistent or within noise -- two models nearly tied on one run might flip on the next.",
          ],
        },
        { type: "heading", text: "A Worked Example" },
        {
          type: "example",
          title: "Picking a model for a support-ticket summarizer",
          text: "Say you send the same 400-word support ticket to two models in Playground. Model A returns a 3-sentence summary in 1.1 seconds for $0.0009. Model B returns a nearly identical summary in 2.4 seconds for $0.0031. For a feature that summarizes tickets as agents open them, that 1.3-second gap is what an agent actually feels while the ticket loads -- so unless Model B's summary is meaningfully more accurate, Model A wins on this use case even though both answers 'look fine.'",
        },
        { type: "heading", text: "Analogies" },
        {
          type: "analogy",
          text: "It's like comparing job candidates: the answer to one interview question (output quality) matters, but so does how fast they responded and what they'd cost to hire (latency and price) -- a slightly-better answer that's 3x slower and 5x more expensive isn't automatically the right pick.",
        },
        {
          type: "analogy",
          text: "Or think of it like comparing three delivery services for the same package: whether it arrives is only half the story. You also care whether it showed up in 20 minutes or 2 hours, and whether it cost $4 or $40 -- a service that's slightly faster but ten times the price isn't obviously 'better' unless speed is the thing you're actually optimizing for.",
        },
        { type: "heading", text: "Key Terms" },
        {
          type: "terms",
          items: [
            {
              term: "Latency",
              def: "How long the request took, from send to full response. Matters a lot for interactive use, less for background batch jobs.",
            },
            { term: "Cost", def: "What that one response cost, based on input + output tokens at that model's price per million tokens." },
            {
              term: "Token usage",
              def: "How many tokens were consumed -- a very verbose model can cost more even at a lower per-token price.",
            },
            {
              term: "Apples-to-apples comparison",
              def: "Comparing models under identical conditions -- same prompt, same system instructions, same generation settings -- so differences in the output reflect the model, not the setup.",
            },
          ],
        },
        { type: "heading", text: "Common Pitfalls" },
        {
          type: "callout",
          variant: "tip",
          text: "Don't compare a one-off response and call it done -- run the same prompt more than once if the model's temperature isn't locked to 0, since a single sample can be misleading.",
        },
        {
          type: "callout",
          variant: "warning",
          text: "Watch out for accidentally comparing different generation settings across models (e.g. a higher max_tokens on one) -- that alone can produce a 'better' looking answer that has nothing to do with model quality.",
        },
        { type: "heading", text: "In SideBySide" },
        {
          type: "app",
          text: "This is exactly the layout Playground gives you: one prompt, several response cards side by side, each with its own latency and cost.",
          href: "/playground",
          linkLabel: "Run a comparison",
        },
        {
          type: "resources",
          items: [
            {
              title: "Comparing LLMs for optimizing cost and response quality",
              url: "https://developer.ibm.com/tutorials/awb-comparing-llms-cost-optimization-response-quality/",
              source: "IBM Developer",
              kind: "article",
            },
          ],
        },
      ],
      quiz: [
        {
          question: "Why look at latency and cost, not just answer quality?",
          options: [
            "They don't actually matter",
            "The best-sounding answer might not be the best choice once speed and price are factored in for your use case",
            "Latency and cost are always identical across models",
            "Only cost matters, never latency",
          ],
          correctIndex: 1,
          explanation:
            "A 'better' answer that's much slower or pricier may not be worth it depending on the use case -- comparison should weigh all three dimensions together.",
        },
        {
          question: "What could make one model more expensive than another even with a lower per-token price?",
          options: [
            "Nothing, price is fixed",
            "Generating a much longer/more verbose response, consuming more tokens",
            "The time of day",
            "The gateway you use never affects cost",
          ],
          correctIndex: 1,
          explanation: "Cost is price-per-token times tokens used -- a verbose model can cost more overall even at a cheaper rate.",
        },
        {
          question:
            "You compare two models on a single prompt and Model A's answer looks slightly better. What should you check before concluding Model A is better?",
          options: [
            "Nothing, one comparison is enough",
            "Whether both models were run under the same generation settings and whether the result holds across more than one prompt",
            "Only the cost, nothing else matters",
            "Whether Model A is more expensive",
          ],
          correctIndex: 1,
          explanation:
            "A single run under mismatched settings can be misleading -- consistent settings and more than one prompt make the comparison trustworthy.",
        },
        {
          question: "For a customer-facing chat feature, which dimension usually matters more than it would in an overnight batch job?",
          options: [
            "Cost per token",
            "Latency, since users notice delay immediately",
            "Context window size",
            "None of these differ by use case",
          ],
          correctIndex: 1,
          explanation: "Interactive use cases are latency-sensitive in a way batch jobs generally aren't, since a human is waiting on the response.",
        },
        {
          question: "What does 'apples-to-apples' mean in the context of comparing models?",
          options: [
            "Comparing only free models",
            "Using identical prompts, instructions, and generation settings across every model being compared",
            "Only comparing models from the same provider",
            "Ignoring cost entirely",
          ],
          correctIndex: 1,
          explanation:
            "Differences should come from the model itself, not from giving one model an easier prompt or more generous settings than another.",
        },
      ],
    },
    {
      slug: "cost-latency-throughput",
      title: "Cost, Latency & Throughput, Precisely",
      summary: "The exact definitions behind the numbers in Insights.",
      minutes: 6,
      blocks: [
        { type: "heading", text: "Overview" },
        {
          type: "p",
          text: "Three numbers show up constantly once you start comparing models seriously: cost, latency, and throughput. They sound related but measure different things, and mixing them up leads to picking the wrong model for the wrong reason.",
        },
        {
          type: "p",
          text: "Cost is priced per million tokens, split between input and output (output is usually pricier, since generating text is more computationally expensive than reading it). Latency and throughput both describe speed, but from different angles -- one is about how long you wait before anything happens, the other is about how fast things happen once they start.",
        },
        { type: "heading", text: "How the Speed Numbers Break Down" },
        {
          type: "p",
          text: "Total latency is the full wall-clock time from sending a request to receiving the complete response. It's made of two parts: time to first token (TTFT) -- the delay before the model starts producing any output at all -- and everything after that, which is governed by throughput, the rate tokens stream out once generation is underway.",
        },
        {
          type: "list",
          items: [
            "A model with fast TTFT but low throughput feels responsive immediately, but a long response still takes a while to finish streaming.",
            "A model with slow TTFT but high throughput feels like it's 'thinking' for a moment, then finishes quickly once it starts.",
            "Total latency for a short reply is dominated by TTFT; for a long reply, throughput matters more.",
          ],
        },
        { type: "heading", text: "A Worked Example" },
        {
          type: "example",
          title: "Two models, two very different speed profiles",
          text: "Model X has a TTFT of 0.3 seconds and throughput of 40 tokens/sec. Model Y has a TTFT of 1.2 seconds and throughput of 120 tokens/sec. For a 50-token chat reply, Model X finishes in about 0.3 + 50/40 = 1.55 seconds, while Model Y finishes in about 1.2 + 50/120 = 1.6 seconds -- nearly identical. But for a 1,000-token report, Model X takes about 0.3 + 1000/40 = 25.3 seconds, while Model Y takes about 1.2 + 1000/120 = 9.5 seconds -- Model Y is now far faster, because its higher throughput dominates once the response gets long.",
        },
        { type: "heading", text: "Analogies" },
        {
          type: "analogy",
          text: "Think of TTFT as how long it takes a barista to start making your coffee after you order, and throughput as how fast they work once they've started. A barista who starts instantly but pours slowly might still finish behind one who hesitates for a few seconds but then moves fast -- which one 'feels' faster depends on whether you're ordering a shot of espresso or a five-shot pot.",
        },
        {
          type: "analogy",
          text: "Or picture two delivery trucks: one pulls out of the depot the instant your order is placed but drives 30 mph; the other idles for five minutes before leaving but then does 70 mph. For a delivery two blocks away, the quick-starting truck wins easily. For a delivery across town, the fast highway truck catches up and passes it.",
        },
        { type: "heading", text: "Key Terms" },
        {
          type: "terms",
          items: [
            {
              term: "Cost per million tokens",
              def: "The standard way model pricing is quoted -- input and output are usually priced separately, with output often costing more than input.",
            },
            {
              term: "Time to first token (TTFT)",
              def: "How long you wait before the model starts streaming any output at all -- the 'does this feel responsive' number.",
            },
            { term: "Throughput (tokens/sec)", def: "Once generation starts, how fast tokens stream out -- matters for long responses." },
            {
              term: "Total latency",
              def: "TTFT plus however long full generation takes -- the end-to-end wait for the complete answer.",
            },
            {
              term: "Streaming",
              def: "Sending the response back token by token as it's generated, rather than waiting for the whole thing to finish -- this is what makes TTFT visible to a user at all, since a non-streamed response only shows up once it's fully done.",
            },
          ],
        },
        { type: "heading", text: "Common Pitfalls" },
        {
          type: "callout",
          variant: "tip",
          text: "Insights breaks these numbers out separately per model/gateway so you're not stuck guessing from a single blended 'latency' figure.",
        },
        {
          type: "callout",
          variant: "warning",
          text: "Don't judge a model's speed from a single request -- latency numbers can vary run to run depending on server load, so treat Insights' numbers as typical figures, not guarantees, especially for time-sensitive production decisions.",
        },
        {
          type: "resources",
          items: [
            {
              title: "LLM inference latency: TTFT, tokens per second, and what to measure",
              url: "https://clickhouse.com/resources/engineering/llm-inference-latency",
              source: "ClickHouse Engineering Blog",
              kind: "article",
            },
          ],
        },
      ],
      quiz: [
        {
          question: "What does 'time to first token' measure?",
          options: [
            "Total time for the full response",
            "How long before the model starts producing any output",
            "How much the response costs",
            "The model's context window",
          ],
          correctIndex: 1,
          explanation:
            "TTFT is specifically the wait before generation begins streaming -- it's the number that most affects how 'responsive' something feels to a user.",
        },
        {
          question: "For a background batch job with no human watching in real time, which matters most?",
          options: [
            "Time to first token",
            "Total latency/throughput, since nobody's staring at the screen waiting for the first word",
            "Neither matters",
            "Only cost matters, latency is irrelevant here too",
          ],
          correctIndex: 1,
          explanation:
            "Without a human waiting on the first visible token, total completion time and overall throughput matter more than how fast the first token appears.",
        },
        {
          question:
            "Using the worked example's numbers, why does Model Y overtake Model X on the 1,000-token report despite having slower TTFT?",
          options: [
            "It doesn't -- Model X is always faster",
            "Because throughput dominates total time once the response is long enough",
            "Because cost decreases with length",
            "Because TTFT stops mattering after 100 tokens exactly",
          ],
          correctIndex: 1,
          explanation:
            "As response length grows, the per-token throughput term outweighs the fixed TTFT delay, so a model with higher throughput eventually wins even if it starts slower.",
        },
        {
          question: "What makes streaming relevant to TTFT?",
          options: [
            "Streaming has nothing to do with TTFT",
            "Streaming is what allows a user to see the first token as soon as it's generated, rather than waiting for the full response",
            "Streaming always makes throughput faster",
            "Streaming only applies to images",
          ],
          correctIndex: 1,
          explanation:
            "Without streaming, a user wouldn't perceive TTFT at all -- they'd just see the complete response appear all at once when it's fully done.",
        },
        {
          question: "Why shouldn't you judge a model's typical speed from a single request?",
          options: [
            "You should, one request is always representative",
            "Latency can vary run to run due to factors like server load, so a single sample can be misleading",
            "Speed never varies between requests",
            "Because cost is the only number that matters",
          ],
          correctIndex: 1,
          explanation:
            "Real-world latency fluctuates, so a single measurement is a data point, not a guarantee -- treat published or observed numbers as typical, not fixed.",
        },
      ],
    },
    {
      slug: "what-is-a-benchmark",
      title: "What Is a Benchmark?",
      summary: "Moving from 'this response looked fine' to a repeatable test.",
      minutes: 6,
      blocks: [
        { type: "heading", text: "Overview" },
        {
          type: "p",
          text: "A benchmark, in this platform's sense, is a fixed set of test cases -- prompts with a defined way to check if the response was good -- that you run against one or more models/gateways, repeatably, so you can compare results objectively instead of relying on a one-off impression.",
        },
        {
          type: "p",
          text: "A good benchmark suite isn't just 'a bunch of prompts' -- it's a deliberate sample of the situations your feature actually needs to handle well, including the awkward edge cases (empty input, conflicting instructions, adversarial phrasing) that a quick manual test would never think to try.",
        },
        { type: "heading", text: "How Grading Works" },
        {
          type: "p",
          text: "Every test case needs a way to decide pass or fail. The two main approaches are a deterministic assertion (a hard, code-checkable rule) or an LLM-as-judge grade (covered in the next lesson) for cases too subjective for a fixed rule. Most real benchmark suites mix both: deterministic checks for anything mechanical (valid JSON, correct format, required fields present), and judge-based grading for anything about tone, helpfulness, or nuance.",
        },
        {
          type: "list",
          items: [
            "A test case that always passes regardless of the model's output is worthless -- it should be possible to fail it.",
            "Test cases should be independent -- one test's setup shouldn't depend on another test having already run.",
            "The suite should be re-run on every meaningful change: a new model, an updated prompt, a different gateway.",
          ],
        },
        { type: "heading", text: "A Worked Example" },
        {
          type: "example",
          title: "A test case for a JSON-extraction prompt",
          text: "Test case: prompt asks the model to extract {name, email, order_id} from a support email as JSON. Assertion: output must parse as valid JSON, must contain all three keys, and the email field must match a basic email-shape pattern. Running this against three models might show Model A passing 98/100 sample emails, Model B passing 91/100 (failing mostly on emails with unusual formatting), and Model C failing to return valid JSON at all on 15/100 because it wraps its answer in explanatory prose despite being told not to.",
        },
        { type: "heading", text: "Analogies" },
        {
          type: "analogy",
          text: "Running one prompt through Playground once is like trying a restaurant on a single visit. A benchmark suite is more like a standardized taste test run across many dishes, many times, with a checklist -- it tells you whether the kitchen is consistently good, not just whether one plate happened to be good tonight.",
        },
        {
          type: "analogy",
          text: "It's also like a pilot's pre-flight checklist. A pilot doesn't re-derive from scratch whether the plane is safe to fly each time -- they run the same fixed list of checks, every flight, because that repeatability is exactly what catches the one time something's actually wrong.",
        },
        { type: "heading", text: "Key Terms" },
        {
          type: "terms",
          items: [
            {
              term: "Test case",
              def: "One prompt plus a way to grade the response: an expected answer, a rule the response must satisfy, or a rubric.",
            },
            {
              term: "Deterministic assertion",
              def: "A hard, code-checkable rule -- e.g. 'output must be valid JSON,' 'must contain the word X,' 'must not exceed 100 words.' Fast, cheap, no ambiguity.",
            },
            {
              term: "Regression",
              def: "A previously-passing test case that starts failing -- often the first sign a prompt, model version, or gateway config broke something.",
            },
            {
              term: "Pass rate",
              def: "The percentage of test cases a model/gateway configuration passes -- the single number a benchmark run boils down to, though it's worth reading which specific cases failed, not just the percentage.",
            },
          ],
        },
        { type: "heading", text: "Common Pitfalls" },
        {
          type: "callout",
          variant: "tip",
          text: "Keep test cases small and specific -- a test case that checks five unrelated things at once makes it hard to tell what actually broke when it fails.",
        },
        {
          type: "callout",
          variant: "warning",
          text: "A benchmark suite only tests what you thought to include -- a 100% pass rate means the model handles your test cases well, not that it handles every real-world input well. Keep adding cases as you find gaps in production.",
        },
        { type: "heading", text: "In SideBySide" },
        {
          type: "app",
          text: "Benchmarks lets you define these test cases once and re-run the whole suite any time you change a prompt, swap a model, or want to check nothing regressed.",
          href: "/benchmarks",
          linkLabel: "Open Benchmarks",
        },
        {
          type: "resources",
          items: [
            {
              title: "30 LLM evaluation benchmarks and how they work",
              url: "https://www.evidentlyai.com/llm-guide/llm-benchmarks",
              source: "Evidently AI",
              kind: "article",
            },
          ],
        },
      ],
      quiz: [
        {
          question: "What makes a benchmark more useful than a single manual test?",
          options: [
            "Nothing, they're the same thing",
            "It's repeatable and covers many cases, catching regressions a one-off check would miss",
            "Benchmarks are always faster to run once",
            "Benchmarks don't require defining what a good answer looks like",
          ],
          correctIndex: 1,
          explanation:
            "The value of a benchmark suite is repeatability and coverage -- running the same fixed test cases every time surfaces regressions that a single spot-check wouldn't catch.",
        },
        {
          question: "What's a deterministic assertion?",
          options: [
            "A subjective quality opinion",
            "A hard, code-checkable pass/fail rule like 'output must be valid JSON'",
            "A random sampling method",
            "A type of API key",
          ],
          correctIndex: 1,
          explanation: "Deterministic assertions are unambiguous, code-evaluated checks -- no judgment call involved, unlike an LLM-judge grade.",
        },
        {
          question: "Why is a test case that always passes, regardless of output, considered worthless?",
          options: [
            "It isn't worthless",
            "It provides no signal -- it can never catch a regression since it can't fail",
            "It's too fast",
            "It costs too many tokens",
          ],
          correctIndex: 1,
          explanation:
            "A test that can't fail can't tell you anything -- the entire value of a test case is its ability to distinguish good output from bad.",
        },
        {
          question: "In the worked JSON-extraction example, why did Model C fail many test cases despite likely 'understanding' the task?",
          options: [
            "It didn't understand English",
            "It wrapped the JSON in explanatory prose despite instructions not to, breaking the deterministic assertion",
            "It was too slow",
            "It cost too much",
          ],
          correctIndex: 1,
          explanation:
            "A deterministic assertion checks the literal output shape -- a model that adds unrequested prose around valid JSON still fails a strict 'must parse as JSON' check.",
        },
        {
          question: "What does a 100% pass rate on a benchmark suite actually tell you?",
          options: [
            "The model handles every possible real-world input perfectly",
            "The model handles the specific cases in that suite well -- it says nothing about cases the suite doesn't cover",
            "The model is the cheapest option",
            "The benchmark is complete and can never be improved",
          ],
          correctIndex: 1,
          explanation: "A benchmark is only as good as its coverage -- a perfect score reflects the test cases you thought to write, not universal correctness.",
        },
      ],
    },
    {
      slug: "llm-as-judge",
      title: "LLM-as-a-Judge Evaluation",
      summary: "What to do when 'correct' isn't a simple rule to check in code.",
      minutes: 6,
      blocks: [
        { type: "heading", text: "Overview" },
        {
          type: "p",
          text: "Plenty of tasks -- summarization quality, tone, helpfulness, following nuanced instructions -- can't be graded by a simple deterministic rule. LLM-as-a-judge solves this by having a second model read the response (and often a rubric describing what 'good' means) and output a score or pass/fail verdict.",
        },
        {
          type: "p",
          text: "It's not perfect: judge models have their own biases (e.g. often favoring longer or more confident-sounding answers), and a bad rubric produces a bad grade regardless of how good the judge model is. Treat it as a strong signal at scale, not an infallible verdict on any single response.",
        },
        { type: "heading", text: "How Judging Works, Step by Step" },
        {
          type: "p",
          text: "In practice, an LLM-as-judge setup runs two model calls per test case: one to generate the response being evaluated, and a second to grade it. The judge call typically includes the original prompt, the response, and the rubric, then asks for either a numeric score (e.g. 1-5) or a pass/fail verdict plus a short justification.",
        },
        {
          type: "list",
          items: [
            "Pairwise comparison ('which of these two responses is better') tends to be more reliable than absolute scoring ('rate this 1-10'), since models are often more consistent at relative judgments than absolute ones.",
            "Giving the judge a few labeled examples of good/bad responses (few-shot) usually improves consistency over a bare rubric.",
            "Running the same judge call multiple times and taking a majority vote reduces noise from any single grading pass.",
          ],
        },
        { type: "heading", text: "A Worked Example" },
        {
          type: "example",
          title: "Grading a customer-support reply for tone",
          text: "Rubric: 'Score 1-5 on whether the reply is empathetic, avoids blaming the customer, and offers a concrete next step.' Response A: 'Unfortunately that's outside our return policy.' Response B: 'I completely understand the frustration -- let's see what we can do; I can offer a store credit or connect you with a supervisor for an exception.' A judge model following this rubric would reliably score Response B a 5 and Response A a 2, even though a simple deterministic check (does it mention 'return policy') couldn't tell the difference in quality at all.",
        },
        { type: "heading", text: "Analogies" },
        {
          type: "analogy",
          text: "It's like hiring a second, independent reviewer to grade essays instead of relying only on a rigid answer key. An answer key catches misspelled vocabulary words; a human reader catches whether the essay actually argues its point well -- which is exactly the kind of judgment call a deterministic rule can't make.",
        },
        {
          type: "analogy",
          text: "Or think of a wine-tasting panel versus a chemical analysis. The chemical analysis (deterministic assertion) reliably tells you the alcohol content and acidity -- hard facts. The panel (LLM judge) tells you whether it actually tastes good -- valuable, but more subjective and more prone to individual palate bias.",
        },
        { type: "heading", text: "Key Terms" },
        {
          type: "terms",
          items: [
            {
              term: "Rubric",
              def: "The explicit criteria given to the judge model describing what counts as a good response -- the judge is only as good as this.",
            },
            {
              term: "Judge model",
              def: "The (often separate, sometimes more capable) model doing the grading -- can be a different provider than the one being tested, to reduce bias.",
            },
            {
              term: "Pairwise comparison",
              def: "Asking the judge which of two responses is better, rather than scoring each independently -- generally more consistent than absolute scoring.",
            },
            {
              term: "Positional bias",
              def: "A judge model's tendency to favor whichever response appears first (or second) in the prompt, regardless of actual quality -- mitigated by randomizing response order across judged pairs.",
            },
          ],
        },
        { type: "heading", text: "Common Pitfalls" },
        {
          type: "callout",
          variant: "tip",
          text: "Use deterministic assertions wherever a hard rule can capture correctness, and reserve LLM-as-judge for the genuinely subjective cases -- it's slower and costs tokens on every grading pass.",
        },
        {
          type: "callout",
          variant: "warning",
          text: "Watch for positional and length bias -- judge models often favor the first response they see, or the longer, more confident-sounding one, independent of actual quality. Randomizing order and explicitly instructing the judge to ignore length helps.",
        },
        {
          type: "resources",
          items: [
            {
              title: "LLM-as-a-Judge Simply Explained",
              url: "https://www.confident-ai.com/blog/why-llm-as-a-judge-is-the-best-llm-evaluation-method",
              source: "Confident AI Blog",
              kind: "article",
            },
          ],
        },
      ],
      quiz: [
        {
          question: "Why use an LLM as a judge instead of only deterministic rules?",
          options: [
            "It's always cheaper",
            "Some qualities (tone, helpfulness, nuance) can't be captured by a simple hard-coded rule",
            "Deterministic rules are always wrong",
            "LLM judges never make mistakes",
          ],
          correctIndex: 1,
          explanation: "LLM judges handle subjective, rubric-based grading that a fixed rule can't express -- the tradeoff is cost, speed, and judge bias.",
        },
        {
          question: "What determines the quality of an LLM-judge's grading?",
          options: [
            "Only the judge model's raw intelligence",
            "Largely the rubric it's given -- a vague rubric produces vague, unreliable grades",
            "Nothing, judges are always accurate",
            "The temperature setting of the model being graded",
          ],
          correctIndex: 1,
          explanation: "A judge model can only grade against the criteria it's given -- a clear, specific rubric is what makes the grading meaningful.",
        },
        {
          question: "In the worked support-reply example, why couldn't a deterministic assertion tell Response A and B apart?",
          options: [
            "It could, deterministic checks handle tone fine",
            "Tone and empathy are subjective qualities a fixed rule can't reliably detect, unlike checking for a specific keyword",
            "Response A was longer",
            "The rubric was invalid",
          ],
          correctIndex: 1,
          explanation:
            "Deterministic checks are good at verifiable facts (keywords, format) but can't judge subjective qualities like empathy -- that's exactly the gap LLM-as-judge fills.",
        },
        {
          question: "Why is pairwise comparison often more reliable than absolute 1-10 scoring?",
          options: [
            "It's not, absolute scoring is always better",
            "Models tend to be more consistent making relative judgments between two options than assigning an absolute number",
            "Pairwise comparison is faster",
            "Pairwise comparison doesn't require a rubric",
          ],
          correctIndex: 1,
          explanation: "Relative judgments ('which is better') are typically more stable across repeated runs than trying to pin an exact absolute score.",
        },
        {
          question: "What is positional bias in LLM-as-judge evaluation?",
          options: [
            "A bias toward shorter responses only",
            "A judge's tendency to favor a response based on its position in the prompt (e.g. always first) rather than its actual quality",
            "A bias that only affects deterministic assertions",
            "A type of API rate limiting",
          ],
          correctIndex: 1,
          explanation: "Positional bias means the judge's verdict can be skewed by ordering alone -- randomizing which response appears first helps control for it.",
        },
      ],
    },
    {
      slug: "recording-decisions",
      title: "Making & Recording a Decision",
      summary: "Why 'we picked Claude for this' deserves a paper trail.",
      minutes: 6,
      blocks: [
        { type: "heading", text: "Overview" },
        {
          type: "p",
          text: "Once a comparison or benchmark run points toward a choice -- which model, which gateway, which prompt version -- it's worth writing that decision down: what was chosen, what the alternatives were, and why. This is the same idea as an Architecture Decision Record (ADR) used in software engineering, applied to model and gateway choices.",
        },
        {
          type: "p",
          text: "Without this, the reasoning lives in someone's memory or a chat thread that scrolls away, and months later nobody can say why a particular model is wired into production -- or whether the tradeoffs that justified it still hold.",
        },
        { type: "heading", text: "What a Good Decision Record Includes" },
        {
          type: "p",
          text: "A useful decision record isn't just a title and a checkbox -- it captures enough context that someone with none of the original conversation could understand not just what was chosen, but why, and under what conditions that choice might need revisiting.",
        },
        {
          type: "list",
          items: [
            "The decision itself -- which model, gateway, or prompt version was chosen",
            "The rationale -- what mattered most (cost, latency, a specific capability) and what evidence supported the choice",
            "Alternatives considered -- what else was evaluated and why it lost",
            "Linked evidence -- the actual runs, benchmark results, or comparisons that backed the decision up, so the claim isn't just asserted",
          ],
        },
        { type: "heading", text: "A Worked Example" },
        {
          type: "example",
          title: "A real decision record",
          text: "Title: 'Switched summarization pipeline to Model A.' Rationale: 'Model A scored 94% on our benchmark suite for extraction accuracy vs. Model B's 89%, and costs 40% less per request. Latency was comparable (1.2s vs. 1.4s median).' Alternatives considered: 'Model B (higher cost, marginal accuracy gain), Model C (failed 15% of JSON-format test cases).' Linked evidence: benchmark run #482, three Playground comparison runs from the week of rollout.",
        },
        { type: "heading", text: "Analogies" },
        {
          type: "analogy",
          text: "It's like a doctor's chart note after a diagnosis -- not just 'prescribed medication X,' but the symptoms observed, the alternatives ruled out, and the reasoning, so the next doctor who reads the chart (which might be the same doctor, six months later) doesn't have to start from zero.",
        },
        {
          type: "analogy",
          text: "Or think of it as a scientist's lab notebook entry versus just reporting a final result. 'The reaction worked' is far less useful than 'the reaction worked at 60 degrees C after failing at 40 and 50, with these specific reagents' -- the second version is reproducible and revisable; the first is just a claim.",
        },
        { type: "heading", text: "Key Terms" },
        {
          type: "terms",
          items: [
            {
              term: "Rationale",
              def: "The reasoning behind the choice -- what mattered most (cost? latency? quality on a specific task?) and what evidence supported it.",
            },
            {
              term: "Alternatives considered",
              def: "What else was evaluated and why it lost out -- makes it possible to know if 'have we tried X' was already answered.",
            },
            {
              term: "Linked evidence",
              def: "The actual runs, benchmark results, or comparison data a decision cites -- turns a decision record from an assertion into something verifiable.",
            },
          ],
        },
        { type: "heading", text: "Common Pitfalls" },
        {
          type: "callout",
          variant: "tip",
          text: "Write the decision record close to when the comparison happened, while the reasoning is still fresh -- reconstructing 'why we chose this' months later from memory is exactly the problem decision records exist to prevent.",
        },
        {
          type: "callout",
          variant: "warning",
          text: "A decision record that's never revisited can go stale -- if the tradeoffs that justified a choice change (a competitor model gets cheaper, a provider raises prices), it's worth noting that the original rationale may no longer hold, rather than treating the record as permanent.",
        },
        { type: "heading", text: "In SideBySide" },
        {
          type: "app",
          text: "Decisions lets you record exactly this, and link it directly to the Playground/Benchmark runs that backed it up, so the evidence and the conclusion stay attached to each other.",
          href: "/decisions",
          linkLabel: "Open Decisions",
        },
        {
          type: "resources",
          items: [
            {
              title: "Architecture Decision Record",
              url: "https://www.martinfowler.com/bliki/ArchitectureDecisionRecord.html",
              source: "Martin Fowler",
              kind: "article",
            },
            { title: "Architectural Decision Records (ADRs)", url: "https://adr.github.io/", source: "adr.github.io", kind: "article" },
          ],
        },
      ],
      quiz: [
        {
          question: "What problem does a recorded decision solve?",
          options: [
            "It makes models run faster",
            "It preserves the reasoning behind a choice so it isn't lost to memory or a scrolled-away chat",
            "It replaces the need for benchmarks",
            "It's required by the API providers",
          ],
          correctIndex: 1,
          explanation:
            "A decision record keeps the 'why' attached to the 'what,' so future readers (including future-you) don't have to reconstruct the reasoning from scratch.",
        },
        {
          question: "Why record alternatives considered, not just the final choice?",
          options: [
            "It's not useful, only the winner matters",
            "It shows what was already evaluated, avoiding redundant re-litigation later",
            "Alternatives are required by law",
            "It makes the decision record longer, which is the goal",
          ],
          correctIndex: 1,
          explanation:
            "Recording alternatives means someone later asking 'did we consider X?' can get an immediate answer instead of redoing the comparison.",
        },
        {
          question: "What does 'linked evidence' add to a decision record that rationale text alone doesn't?",
          options: [
            "Nothing extra",
            "It makes the decision verifiable -- pointing to the actual runs/benchmarks that back up the claim, not just asserting it",
            "It makes the record shorter",
            "It replaces the need for a rationale",
          ],
          correctIndex: 1,
          explanation: "Linked evidence turns 'trust me, it was better' into something someone else can go check for themselves.",
        },
        {
          question: "Why does it matter to write a decision record close to when the comparison actually happened?",
          options: [
            "It doesn't matter when it's written",
            "Because the reasoning and context are freshest right after the comparison -- reconstructing it later from memory defeats the purpose",
            "Because decision records expire after a week",
            "Because it needs to happen before the benchmark runs",
          ],
          correctIndex: 1,
          explanation: "The whole point of the record is to preserve reasoning that would otherwise decay -- writing it promptly captures it while it's accurate.",
        },
        {
          question: "Why might a decision record need to be revisited later, even if nothing about the record itself was wrong?",
          options: [
            "Decision records are never revisited",
            "Because the underlying tradeoffs (pricing, model capability) can change over time, potentially invalidating the original rationale",
            "Because the format changes",
            "Because only one decision can exist at a time",
          ],
          correctIndex: 1,
          explanation:
            "A decision that was correct when made can become outdated as the landscape shifts -- flagging that possibility keeps the record honest rather than treating it as eternally binding.",
        },
      ],
    },
  ],
  test: [
    {
      question:
        "You're deciding between two models for a nightly batch job with no human watching in real time. Which dimension should weigh least heavily in that decision?",
      options: ["Cost", "Time to first token", "Total throughput for long outputs", "Overall accuracy on your benchmark suite"],
      correctIndex: 1,
      explanation:
        "TTFT matters most when a human is waiting on the first visible token -- an unattended batch job doesn't notice it, so throughput and cost dominate instead.",
    },
    {
      question: "A test case checks whether a model's JSON output contains a required 'status' field. What kind of check is this?",
      options: ["An LLM-as-judge evaluation", "A deterministic assertion", "A decision record", "A rationale"],
      correctIndex: 1,
      explanation: "Checking for a specific field's presence is a hard, code-checkable rule -- exactly what a deterministic assertion is for.",
    },
    {
      question:
        "You're grading responses for 'how empathetic does this sound' across 500 test cases. Why is this a better fit for LLM-as-judge than a deterministic assertion?",
      options: [
        "It isn't, deterministic assertions handle tone fine",
        "Empathy is a subjective quality that a fixed rule can't reliably detect, but a rubric-guided judge model can approximate",
        "LLM-as-judge is always cheaper",
        "500 cases is too many for deterministic assertions",
      ],
      correctIndex: 1,
      explanation: "Subjective qualities like tone are exactly the gap LLM-as-judge exists to fill, where a hard-coded rule would fall short.",
    },
    {
      question: "After running a benchmark suite and finding Model A beats Model B by a wide margin, what should you do before considering the decision final?",
      options: [
        "Nothing, the benchmark result alone is sufficient",
        "Also review the actual response quality manually and record the decision with the rationale and linked evidence",
        "Immediately delete Model B from consideration everywhere",
        "Re-run the benchmark with different questions until Model B wins",
      ],
      correctIndex: 1,
      explanation: "Numbers should be paired with a look at real output, and the choice should be written down with its supporting evidence so the reasoning isn't lost.",
    },
    {
      question: "A model shows a fast time-to-first-token but comparatively low throughput. For which use case does this profile matter least?",
      options: [
        "A live chat interface where users watch the response stream in",
        "Generating a single short 20-token classification label",
        "Streaming a 3,000-word report to a live audience",
        "A voice assistant giving a quick spoken reply",
      ],
      correctIndex: 2,
      explanation:
        "For very long outputs, throughput dominates total time far more than the initial TTFT delay -- a slow-throughput model falls behind on long content regardless of how fast it started.",
    },
    {
      question:
        "Your LLM-as-judge grading consistently favors longer responses regardless of quality. What is this an example of, and what helps mitigate it?",
      options: [
        "Positional bias; fixed by adding more test cases",
        "A form of judge bias; fixed by instructing the judge to ignore length and by using pairwise comparison with randomized order",
        "A deterministic assertion failure; fixed by rewriting the rubric as code",
        "Token usage; fixed by lowering temperature",
      ],
      correctIndex: 1,
      explanation: "Length bias is a known judge-model failure mode; explicit instructions and randomized pairwise comparisons are standard mitigations.",
    },
    {
      question: "Six months after switching production to Model A, a teammate asks why. What answers that question fastest?",
      options: [
        "Re-running the original Playground comparison from scratch",
        "A decision record with rationale, alternatives considered, and linked evidence written at the time of the switch",
        "Asking the model itself why it was chosen",
        "There's no way to know after that much time",
      ],
      correctIndex: 1,
      explanation: "This is exactly the problem decision records solve -- preserving the reasoning so it doesn't have to be reconstructed later.",
    },
    {
      question: "A benchmark suite passes at 100% on every test case you've written. What can you correctly conclude?",
      options: [
        "The model is flawless in production",
        "The model handles the specific cases you tested well -- coverage of untested scenarios is still unknown",
        "No further evaluation is ever needed",
        "The model is the cheapest available option",
      ],
      correctIndex: 1,
      explanation: "A benchmark's result is bounded by what it actually tests -- a perfect score reflects known coverage, not universal correctness.",
    },
  ],
};

export default evaluatingModule;
