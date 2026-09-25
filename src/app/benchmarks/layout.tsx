"use client";

import type { ReactNode } from "react";
import { BenchmarksProvider } from "@/components/benchmarks/BenchmarksContext";
import { BenchmarksTabs } from "@/components/benchmarks/BenchmarksTabs";

export default function BenchmarksLayout({ children }: { children: ReactNode }) {
  return (
    <BenchmarksProvider>
      <div className="flex flex-col gap-8">
        <div className="animate-fade-up shrink-0">
          <BenchmarksTabs />
        </div>

        {children}
      </div>
    </BenchmarksProvider>
  );
}
