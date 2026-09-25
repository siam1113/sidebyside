import type { ReactNode } from "react";

/** Splits inline text on `code`, **bold**, *italic*, and [text](url), recursing
 *  into bold/italic so `**a *b* c**` nests correctly. Good enough for typical
 *  LLM chat output -- not a full CommonMark implementation. */
function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const pattern = /(`[^`]+`)|(\*\*[^*]+\*\*)|(__[^_]+__)|(\*[^*]+\*)|(_[^_]+_)|(\[[^\]]+\]\([^)]+\))/;
  const nodes: ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    const match = pattern.exec(remaining);
    if (!match) {
      nodes.push(remaining);
      break;
    }
    const idx = match.index;
    if (idx > 0) nodes.push(remaining.slice(0, idx));
    const token = match[0];
    const nodeKey = `${keyPrefix}-${key++}`;

    if (token.startsWith("`")) {
      nodes.push(
        <code key={nodeKey} className="rounded bg-white/10 px-1 py-0.5 font-mono text-[0.85em] text-cyan-200">
          {token.slice(1, -1)}
        </code>,
      );
    } else if (token.startsWith("**") || token.startsWith("__")) {
      nodes.push(
        <strong key={nodeKey} className="font-semibold text-neutral-50">
          {renderInline(token.slice(2, -2), nodeKey)}
        </strong>,
      );
    } else if (token.startsWith("*") || token.startsWith("_")) {
      nodes.push(<em key={nodeKey}>{renderInline(token.slice(1, -1), nodeKey)}</em>);
    } else {
      const linkMatch = /\[([^\]]+)\]\(([^)]+)\)/.exec(token);
      if (linkMatch) {
        nodes.push(
          <a
            key={nodeKey}
            href={linkMatch[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-cyan-300 underline decoration-cyan-300/30 underline-offset-2 hover:text-cyan-100"
          >
            {linkMatch[1]}
          </a>,
        );
      }
    }
    remaining = remaining.slice(idx + token.length);
  }
  return nodes;
}

/** Renders a paragraph/list-item/blockquote's text, turning bare newlines into <br/>. */
function renderLines(text: string, keyPrefix: string): ReactNode[] {
  return text.split("\n").flatMap((line, i) => {
    const rendered = renderInline(line, `${keyPrefix}-l${i}`);
    return i === 0 ? rendered : [<br key={`${keyPrefix}-br${i}`} />, ...rendered];
  });
}

function renderTextSegment(text: string, keyPrefix: string): ReactNode[] {
  const lines = text.split("\n");
  const blocks: ReactNode[] = [];
  let i = 0;
  let blockKey = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.trim() === "") {
      i++;
      continue;
    }

    const heading = /^(#{1,6})\s+(.*)/.exec(line);
    if (heading) {
      const level = heading[1].length;
      const key = `${keyPrefix}-h${blockKey++}`;
      const sizes: Record<number, string> = {
        1: "text-lg font-semibold",
        2: "text-base font-semibold",
        3: "text-sm font-semibold",
      };
      const cls = sizes[level] ?? "text-sm font-semibold";
      blocks.push(
        <p key={key} className={`${cls} text-neutral-50`}>
          {renderInline(heading[2], key)}
        </p>,
      );
      i++;
      continue;
    }

    if (/^(-{3,}|\*{3,})$/.test(line.trim())) {
      blocks.push(<hr key={`${keyPrefix}-hr${blockKey++}`} className="my-2 border-white/10" />);
      i++;
      continue;
    }

    const unordered = /^\s*[-*]\s+(.*)/.exec(line);
    if (unordered) {
      const items: string[] = [];
      while (i < lines.length) {
        const m = /^\s*[-*]\s+(.*)/.exec(lines[i]);
        if (!m) break;
        items.push(m[1]);
        i++;
      }
      const key = `${keyPrefix}-ul${blockKey++}`;
      blocks.push(
        <ul key={key} className="list-disc space-y-1 pl-5">
          {items.map((item, idx) => (
            <li key={`${key}-${idx}`}>{renderLines(item, `${key}-${idx}`)}</li>
          ))}
        </ul>,
      );
      continue;
    }

    const ordered = /^\s*\d+\.\s+(.*)/.exec(line);
    if (ordered) {
      const items: string[] = [];
      while (i < lines.length) {
        const m = /^\s*\d+\.\s+(.*)/.exec(lines[i]);
        if (!m) break;
        items.push(m[1]);
        i++;
      }
      const key = `${keyPrefix}-ol${blockKey++}`;
      blocks.push(
        <ol key={key} className="list-decimal space-y-1 pl-5">
          {items.map((item, idx) => (
            <li key={`${key}-${idx}`}>{renderLines(item, `${key}-${idx}`)}</li>
          ))}
        </ol>,
      );
      continue;
    }

    const quote = /^>\s?(.*)/.exec(line);
    if (quote) {
      const quoted: string[] = [];
      while (i < lines.length) {
        const m = /^>\s?(.*)/.exec(lines[i]);
        if (!m) break;
        quoted.push(m[1]);
        i++;
      }
      const key = `${keyPrefix}-bq${blockKey++}`;
      blocks.push(
        <blockquote key={key} className="border-l-2 border-white/15 pl-3 text-neutral-400 italic">
          {renderLines(quoted.join("\n"), key)}
        </blockquote>,
      );
      continue;
    }

    // Plain paragraph -- absorb consecutive non-special lines.
    const paraLines: string[] = [];
    while (i < lines.length && lines[i].trim() !== "") {
      const l = lines[i];
      if (/^(#{1,6})\s+/.test(l) || /^\s*[-*]\s+/.test(l) || /^\s*\d+\.\s+/.test(l) || /^>\s?/.test(l) || /^(-{3,}|\*{3,})$/.test(l.trim())) {
        break;
      }
      paraLines.push(l);
      i++;
    }
    if (paraLines.length > 0) {
      const key = `${keyPrefix}-p${blockKey++}`;
      blocks.push(<p key={key}>{renderLines(paraLines.join("\n"), key)}</p>);
    } else {
      i++; // safety: avoid an infinite loop if nothing matched and nothing consumed
    }
  }

  return blocks;
}

/** Lightweight markdown renderer for chat responses: headings, bold/italic,
 *  inline code, fenced code blocks, lists, blockquotes, links, and rules.
 *  Deliberately not a full CommonMark parser -- just enough for typical LLM output. */
export function Markdown({ text }: { text: string }) {
  const fencePattern = /```(\w*)\n?([\s\S]*?)```/g;
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = fencePattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(...renderTextSegment(text.slice(lastIndex, match.index), `seg-${key++}`));
    }
    const lang = match[1];
    const code = match[2].replace(/\n$/, "");
    nodes.push(
      <div key={`code-${key++}`} className="relative my-1">
        {lang && (
          <span className="absolute right-2 top-1.5 font-mono text-[10px] uppercase tracking-wide text-neutral-500">
            {lang}
          </span>
        )}
        <pre className="overflow-x-auto rounded-lg border border-white/10 bg-black/40 p-3 font-mono text-xs leading-relaxed text-neutral-300">
          <code>{code}</code>
        </pre>
      </div>,
    );
    lastIndex = fencePattern.lastIndex;
  }
  if (lastIndex < text.length) {
    nodes.push(...renderTextSegment(text.slice(lastIndex), `seg-${key++}`));
  }

  return <div className="flex flex-col gap-2">{nodes}</div>;
}
