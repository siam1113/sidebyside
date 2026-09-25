"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/playground", label: "Chat" },
  { href: "/playground/embeddings", label: "Embeddings" },
  { href: "/playground/images", label: "Images" },
  { href: "/playground/evaluation", label: "Evaluation" },
];

export function PlaygroundTabs() {
  const pathname = usePathname();
  return (
    <div className="flex w-fit gap-1 rounded-lg border border-white/10 bg-white/[0.03] p-1">
      {TABS.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`rounded-md px-3 py-1.5 text-sm transition-colors duration-150 ${
              active
                ? "bg-cyan-300/10 text-cyan-100"
                : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
