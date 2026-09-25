import Link from "next/link";
import type { LessonBlock } from "@/lib/learn/types";
import { getYouTubeEmbedUrl } from "@/lib/learn/youtube";

function AnalogyIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-4 w-4 shrink-0">
      <path
        d="M8 1.5c-2.5 0-4.5 2-4.5 4.5 0 1.6.85 3 2.1 3.8.28.18.4.5.4.85V11h4v-.35c0-.35.12-.67.4-.85 1.25-.8 2.1-2.2 2.1-3.8 0-2.5-2-4.5-4.5-4.5Z"
        strokeLinejoin="round"
      />
      <path d="M6 13.2h4M6.6 14.5h2.8" strokeLinecap="round" />
    </svg>
  );
}

function AppIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-4 w-4 shrink-0">
      <rect x="2" y="2" width="12" height="12" rx="2.5" />
      <path d="M6 8h4M8 6l2 2-2 2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function WarningIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-4 w-4 shrink-0">
      <path d="M8 1.5 14.8 13.5H1.2L8 1.5Z" strokeLinejoin="round" />
      <path d="M8 6.2v3.1" strokeLinecap="round" />
      <circle cx="8" cy="11.3" r="0.15" fill="currentColor" stroke="none" />
    </svg>
  );
}

function TipIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-4 w-4 shrink-0">
      <path d="M8 1.8v1.6M3.4 3.4l1.15 1.15M12.6 3.4l-1.15 1.15M1.8 8h1.6M12.6 8h1.6" strokeLinecap="round" />
      <circle cx="8" cy="8.6" r="3.2" />
    </svg>
  );
}

function VideoIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-3.5 w-3.5 shrink-0">
      <rect x="1.5" y="3.5" width="9" height="9" rx="1.5" />
      <path d="M10.5 6.5 14.5 4v8l-4-2.5" strokeLinejoin="round" />
    </svg>
  );
}

function ArticleIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-3.5 w-3.5 shrink-0">
      <path d="M4 2h6l2.5 2.5V14H4V2Z" strokeLinejoin="round" />
      <path d="M6 8h4M6 10.5h4M6 5.5h2" strokeLinecap="round" />
    </svg>
  );
}

function ExampleIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-4 w-4 shrink-0">
      <path d="M6 1.8h4M8 1.8v3.1M5.2 4.9h5.6l1.6 7.6a1.5 1.5 0 0 1-1.47 1.7H5.07a1.5 1.5 0 0 1-1.47-1.7l1.6-7.6Z" strokeLinejoin="round" strokeLinecap="round" />
      <path d="M5.6 9.3h4.8" strokeLinecap="round" />
    </svg>
  );
}

export function LessonBlocks({ blocks }: { blocks: LessonBlock[] }) {
  return (
    <div className="flex flex-col gap-5">
      {blocks.map((block, i) => {
        switch (block.type) {
          case "heading":
            return (
              <h2
                key={i}
                className="mt-3 flex items-center gap-2.5 border-t border-white/5 pt-6 text-base font-semibold tracking-tight text-neutral-100 first:mt-0 first:border-t-0 first:pt-0"
              >
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-gradient-to-br from-cyan-300 to-violet-400" />
                {block.text}
              </h2>
            );

          case "p":
            return (
              <p key={i} className="text-[0.95rem] leading-relaxed text-neutral-300">
                {block.text}
              </p>
            );

          case "example":
            return (
              <div key={i} className="glass-panel flex gap-3 rounded-xl border-l-2 border-l-cyan-300/50 p-4">
                <span className="mt-0.5 text-cyan-300">
                  <ExampleIcon />
                </span>
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-cyan-300/90">
                    {block.title ?? "Example"}
                  </p>
                  <p className="text-sm leading-relaxed text-neutral-300">{block.text}</p>
                </div>
              </div>
            );

          case "analogy":
            return (
              <div key={i} className="glass-panel flex gap-3 rounded-xl border-l-2 border-l-violet-300/50 p-4">
                <span className="mt-0.5 text-violet-300">
                  <AnalogyIcon />
                </span>
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-violet-300/90">Analogy</p>
                  <p className="text-sm leading-relaxed text-neutral-300">{block.text}</p>
                </div>
              </div>
            );

          case "terms":
            return (
              <dl key={i} className="flex flex-col gap-3 rounded-xl border border-white/10 bg-black/20 p-4">
                {block.items.map((item) => (
                  <div key={item.term} className="flex flex-col gap-0.5 sm:flex-row sm:gap-4">
                    <dt className="shrink-0 text-sm font-semibold text-cyan-100 sm:w-44">{item.term}</dt>
                    <dd className="text-sm leading-relaxed text-neutral-400">{item.def}</dd>
                  </div>
                ))}
              </dl>
            );

          case "list":
            return block.ordered ? (
              <ol key={i} className="list-decimal space-y-2 pl-5 text-sm leading-relaxed text-neutral-300 marker:text-cyan-300/70">
                {block.items.map((item, j) => (
                  <li key={j}>{item}</li>
                ))}
              </ol>
            ) : (
              <ul key={i} className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-neutral-300 marker:text-cyan-300/70">
                {block.items.map((item, j) => (
                  <li key={j}>{item}</li>
                ))}
              </ul>
            );

          case "app":
            return (
              <Link
                key={i}
                href={block.href}
                className="glass-panel glass-panel-hover group flex items-start gap-3 rounded-xl p-4"
              >
                <span className="mt-0.5 text-cyan-200">
                  <AppIcon />
                </span>
                <div className="flex-1">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-cyan-200/90">In SideBySide</p>
                  <p className="text-sm leading-relaxed text-neutral-300">{block.text}</p>
                  <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-cyan-200 transition-colors duration-200 group-hover:text-cyan-100">
                    {block.linkLabel}
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-3 w-3 transition-transform duration-200 group-hover:translate-x-0.5">
                      <path d="M3 8h9.5M9 4l4.5 4L9 12" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </div>
              </Link>
            );

          case "compare":
            return (
              <div key={i} className="overflow-x-auto rounded-xl border border-white/10">
                <table className="w-full min-w-[32rem] border-collapse text-left text-sm">
                  <thead>
                    <tr className="bg-white/[0.04]">
                      {block.headers.map((h, j) => (
                        <th key={j} className="border-b border-white/10 px-3.5 py-2.5 font-semibold text-neutral-200">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {block.rows.map((row, r) => (
                      <tr key={r} className={r % 2 === 1 ? "bg-white/[0.015]" : undefined}>
                        {row.map((cell, c) => (
                          <td
                            key={c}
                            className={`border-b border-white/5 px-3.5 py-2.5 align-top leading-relaxed ${
                              c === 0 ? "font-medium text-neutral-200" : "text-neutral-400"
                            }`}
                          >
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );

          case "callout": {
            const isWarning = block.variant === "warning";
            return (
              <div
                key={i}
                className={`flex gap-3 rounded-xl border p-4 ${
                  isWarning
                    ? "border-amber-400/20 bg-amber-400/[0.06] text-amber-100"
                    : "border-emerald-400/20 bg-emerald-400/[0.06] text-emerald-100"
                }`}
              >
                <span className={`mt-0.5 ${isWarning ? "text-amber-300" : "text-emerald-300"}`}>
                  {isWarning ? <WarningIcon /> : <TipIcon />}
                </span>
                <p className="text-sm leading-relaxed">{block.text}</p>
              </div>
            );
          }

          case "video":
            return (
              <div key={i} className={`grid gap-4 ${block.items.length > 1 ? "sm:grid-cols-2" : ""}`}>
                {block.items.map((v) => {
                  const embedUrl = getYouTubeEmbedUrl(v.url);
                  return (
                    <div key={v.url} className="overflow-hidden rounded-xl border border-white/10 bg-black/40">
                      {embedUrl ? (
                        <div className="aspect-video w-full">
                          <iframe
                            src={embedUrl}
                            title={v.title}
                            loading="lazy"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                            className="h-full w-full"
                          />
                        </div>
                      ) : (
                        <a
                          href={v.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex aspect-video w-full items-center justify-center gap-2 text-sm text-neutral-400 hover:text-cyan-200"
                        >
                          <VideoIcon />
                          Watch video
                        </a>
                      )}
                      <div className="flex items-center gap-2 px-3.5 py-2.5">
                        <span className="text-neutral-500">
                          <VideoIcon />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-neutral-200">{v.title}</p>
                          <p className="truncate text-xs text-neutral-500">{v.source}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );

          case "resources":
            return (
              <div key={i} className="flex flex-col gap-2 border-l-2 border-l-white/10 pl-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Go deeper</p>
                <div className="flex flex-col gap-1">
                  {block.items.map((r) => (
                    <a
                      key={r.url}
                      href={r.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center gap-2 text-sm text-neutral-400 transition-colors duration-150 hover:text-cyan-200"
                    >
                      <span className="text-neutral-600 group-hover:text-cyan-300">
                        {r.kind === "video" ? <VideoIcon /> : <ArticleIcon />}
                      </span>
                      <span className="truncate underline decoration-white/15 underline-offset-2 group-hover:decoration-cyan-300/50">
                        {r.title}
                      </span>
                      <span className="shrink-0 text-xs text-neutral-600">-- {r.source}</span>
                    </a>
                  ))}
                </div>
              </div>
            );

          default:
            return null;
        }
      })}
    </div>
  );
}
