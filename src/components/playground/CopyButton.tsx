"use client";

import { useState } from "react";

interface Props {
  text: string;
  className?: string;
}

export function CopyButton({ text, className = "" }: Props) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard access denied; silently ignore
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`inline-flex items-center gap-1 rounded-md border border-white/10 px-2 py-1 text-[11px] font-medium text-neutral-400 transition-colors duration-150 hover:border-white/20 hover:text-neutral-200 ${className}`}
    >
      {copied ? (
        <>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-3 w-3 text-emerald-300">
            <path d="M3 8.5l3 3 7-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Copied
        </>
      ) : (
        <>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-3 w-3">
            <rect x="5.5" y="5.5" width="8" height="8" rx="1.5" />
            <path d="M3.5 10.5V3.5a1 1 0 0 1 1-1H10" strokeLinecap="round" />
          </svg>
          Copy
        </>
      )}
    </button>
  );
}
