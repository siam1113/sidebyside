"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { href: "/playground", label: "Playground" },
  { href: "/insights", label: "Insights" },
  { href: "/sandbox", label: "Sandbox" },
  { href: "/benchmarks", label: "Benchmarks" },
  { href: "/decisions", label: "Decisions" },
  { href: "/mcp", label: "MCP" },
  { href: "/learn", label: "Learn" },
  { href: "/settings", label: "Settings" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const lastY = useRef(0);

  useEffect(() => {
    // The page body itself no longer scrolls -- #app-scroll (see root layout)
    // is the actual scrolling element for pages that overflow.
    const el = document.getElementById("app-scroll");
    if (!el) return;
    lastY.current = el.scrollTop;
    function onScroll() {
      if (!el) return;
      const y = el.scrollTop;
      const delta = y - lastY.current;
      setScrolled(y > 8);
      if (y > 96 && delta > 4) {
        setHidden(true);
      } else if (delta < -4 || y < 96) {
        setHidden(false);
      }
      lastY.current = y;
    }
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-transform duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] ${
        hidden ? "-translate-y-full" : "translate-y-0"
      }`}
    >
      <div
        className={`border-b transition-colors duration-300 ${
          scrolled
            ? "border-white/10 bg-[#050507]/80 backdrop-blur-xl"
            : "border-transparent bg-transparent"
        }`}
      >
        <nav className="mx-auto flex max-w-[80rem] items-center justify-between px-4 py-3.5 sm:px-6">
          <Link href="/" className="group flex items-center gap-2.5">
            <span className="relative flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-cyan-300 to-violet-400 shadow-[0_0_16px_rgba(103,232,249,0.35)] transition-transform duration-300 group-hover:scale-105">
              <span className="h-1.5 w-1.5 rounded-full bg-[#050507]" />
            </span>
            <span className="font-semibold tracking-tight text-neutral-100">
              Side<span className="text-neutral-500">by</span>Side
            </span>
          </Link>
          <div className="flex items-center gap-1 text-sm">
            {NAV_LINKS.map((link) => {
              const active = pathname?.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative rounded-full px-3.5 py-1.5 transition-colors duration-200 ${
                    active
                      ? "text-neutral-50"
                      : "text-neutral-400 hover:text-neutral-100"
                  }`}
                >
                  {active && (
                    <span className="absolute inset-0 rounded-full border border-white/10 bg-white/[0.06]" />
                  )}
                  <span className="relative">{link.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </header>
  );
}
