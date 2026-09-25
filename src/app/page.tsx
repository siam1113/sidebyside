import Link from "next/link";

const CARDS = [
  {
    href: "/playground",
    title: "Gateway Playground",
    description:
      "Send the same prompt to multiple LLM API gateways at once and compare responses, latency, and cost side by side.",
    glyph: (
      <path d="M4 12h4l2-6 4 12 2-6h4" strokeLinecap="round" strokeLinejoin="round" />
    ),
  },
  {
    href: "/insights",
    title: "Insights",
    description:
      "See every model across every gateway side by side -- context window, output cap, modality, and cost per million tokens once priced.",
    glyph: (
      <>
        <rect x="4" y="4" width="16" height="16" rx="2" />
        <path d="M8 16V10M12 16V8M16 16v-4" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
  },
  {
    href: "/sandbox",
    title: "CLI Sandbox",
    description:
      "Launch Claude Code, Codex CLI, or Copilot CLI in an isolated Docker container wired to a gateway, driven from an in-browser terminal. Your real local configs are never touched.",
    glyph: (
      <>
        <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
        <path d="M7 9l3 3-3 3M13 15h4" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
  },
  {
    href: "/benchmarks",
    title: "Benchmarks",
    description:
      "Define prompt test cases, run them across your gateway configs, and grade each response with a deterministic assertion or an LLM judge.",
    glyph: (
      <>
        <path d="M4 19V10M10 19V5M16 19v-7M20 19H4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M8 6l2-2 2 2" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
  },
  {
    href: "/decisions",
    title: "Decisions",
    description:
      "Record which model/gateway was chosen and why -- rationale, alternatives considered, and links to the runs that backed it up.",
    glyph: (
      <>
        <path d="M12 3v6M12 21v-6M5 12h4M15 12h4" strokeLinecap="round" />
        <circle cx="12" cy="12" r="3" />
      </>
    ),
  },
  {
    href: "/mcp",
    title: "MCP Servers",
    description:
      "Register MCP servers, test the connection live, and see exactly which tools/resources/prompts each one exposes.",
    glyph: (
      <>
        <rect x="4" y="4" width="7" height="7" rx="1.5" />
        <rect x="13" y="13" width="7" height="7" rx="1.5" />
        <path d="M11 7.5h4a2 2 0 0 1 2 2V13M7.5 11v2a2 2 0 0 0 2 2h1.5" strokeLinecap="round" />
      </>
    ),
  },
  {
    href: "/learn",
    title: "Learn",
    description:
      "Structured lessons, analogies, and quick checks covering every concept behind this platform -- gateways, tokens, benchmarks, MCP, and more. No prior AI knowledge required.",
    glyph: (
      <>
        <path d="M4 6l6-2 6 2 4-1.5v13L16 19l-6-2-6 2V6Z" strokeLinejoin="round" strokeLinecap="round" />
        <path d="M10 4.3v13M16 6v13" strokeLinecap="round" />
      </>
    ),
  },
  {
    href: "/settings",
    title: "Gateway Settings",
    description:
      "Register gateway configs (LiteLLM, OpenRouter, Portkey, Azure, Google, or anything else) to use across the Playground and Sandbox.",
    glyph: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 13a1.7 1.7 0 000-2l1.4-1.2-1.5-2.6-1.8.5a1.7 1.7 0 00-1.7-1l-.3-1.8H9.5l-.3 1.8a1.7 1.7 0 00-1.7 1l-1.8-.5-1.5 2.6L5.6 11a1.7 1.7 0 000 2l-1.4 1.2 1.5 2.6 1.8-.5a1.7 1.7 0 001.7 1l.3 1.8h4.9l.3-1.8a1.7 1.7 0 001.7-1l1.8.5 1.5-2.6L19.4 13z" />
      </>
    ),
  },
];

export default function Home() {
  return (
    <div className="flex flex-col gap-14">
      <div className="animate-fade-up flex flex-col gap-4" style={{ animationDelay: "40ms" }}>
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-medium tracking-wide text-cyan-200/90">
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_8px_rgba(103,232,249,0.8)]" />
          Local-only playground
        </span>
        <h1 className="max-w-3xl text-[clamp(2.25rem,5vw,3.75rem)] font-semibold leading-[1.05] tracking-tight text-neutral-50">
          Compare gateways and models{" "}
          <span className="bg-gradient-to-br from-cyan-300 to-violet-400 bg-clip-text text-transparent">
            side by side
          </span>{" "}
          without touching your real configs.
        </h1>
        <p className="max-w-xl text-base leading-relaxed text-neutral-400">
          Run the same prompt across LLM API gateways, benchmark the results,
          and sandbox Claude Code, Codex CLI, or Copilot CLI in a throwaway
          container — all wired through configs that never leave this
          machine.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {CARDS.map((card, i) => (
          <Link
            key={card.href}
            href={card.href}
            style={{ animationDelay: `${140 + i * 90}ms` }}
            className="animate-fade-up glass-panel glass-panel-hover group relative flex flex-col gap-4 overflow-hidden rounded-xl p-5 hover:-translate-y-1 hover:shadow-[0_0_0_1px_rgba(103,232,249,0.15),0_20px_40px_-20px_rgba(103,232,249,0.25)]"
          >
            <span
              aria-hidden
              className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-gradient-to-br from-cyan-400/20 to-violet-400/10 opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100"
            />
            <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-cyan-200 transition-colors duration-200 group-hover:border-cyan-300/30 group-hover:text-cyan-100">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                className="h-4.5 w-4.5"
              >
                {card.glyph}
              </svg>
            </span>
            <div className="flex flex-col gap-1.5">
              <h2 className="font-medium tracking-tight text-neutral-100">
                {card.title}
              </h2>
              <p className="text-sm leading-relaxed text-neutral-400">
                {card.description}
              </p>
            </div>
            <span className="mt-auto inline-flex items-center gap-1 text-xs font-medium text-neutral-500 transition-colors duration-200 group-hover:text-cyan-200">
              Open
              <svg
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                className="h-3 w-3 transition-transform duration-200 group-hover:translate-x-0.5"
              >
                <path d="M3 8h9.5M9 4l4.5 4L9 12" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
