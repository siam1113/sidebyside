"use client";

import { useMemo, useState } from "react";
import type { LatencyPoint } from "@/lib/db/latency";

const WIDTH = 600;
const HEIGHT = 72;
const PAD_X = 4;
const PAD_Y = 8;

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Single-series latency-over-time sparkline with a hover crosshair + tooltip; failed samples get a red marker. */
export function LatencySparkline({ points }: { points: LatencyPoint[] }) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const maxLatency = Math.max(1, ...points.map((p) => p.latencyMs ?? 0));

  const coords = useMemo(() => {
    if (points.length === 0) return [];
    const innerW = WIDTH - PAD_X * 2;
    const innerH = HEIGHT - PAD_Y * 2;
    return points.map((p, i) => {
      const x = points.length === 1 ? WIDTH / 2 : PAD_X + (i / (points.length - 1)) * innerW;
      const y = p.latencyMs != null ? PAD_Y + innerH - (p.latencyMs / maxLatency) * innerH : HEIGHT - PAD_Y;
      return { x, y, point: p };
    });
  }, [points, maxLatency]);

  const linePath = coords
    .filter((c) => c.point.latencyMs != null)
    .map((c, i) => `${i === 0 ? "M" : "L"} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`)
    .join(" ");

  function handleMove(e: React.MouseEvent<SVGRectElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * WIDTH;
    let nearest = 0;
    let nearestDist = Infinity;
    coords.forEach((c, i) => {
      const d = Math.abs(c.x - relX);
      if (d < nearestDist) {
        nearestDist = d;
        nearest = i;
      }
    });
    setHoverIdx(nearest);
  }

  if (points.length === 0) {
    return <p className="text-xs text-neutral-600">No samples in this window.</p>;
  }

  const hovered = hoverIdx != null ? coords[hoverIdx] : null;

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="h-16 w-full" preserveAspectRatio="none">
        <line
          x1={PAD_X}
          y1={HEIGHT - PAD_Y}
          x2={WIDTH - PAD_X}
          y2={HEIGHT - PAD_Y}
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={1}
        />
        {linePath && (
          <path d={linePath} fill="none" stroke="#67e8f9" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        )}
        {coords.map(
          (c, i) =>
            !c.point.success && <circle key={i} cx={c.x} cy={c.y} r={3} fill="#f87171" />,
        )}
        {hovered && (
          <>
            <line x1={hovered.x} y1={0} x2={hovered.x} y2={HEIGHT} stroke="rgba(255,255,255,0.2)" strokeWidth={1} />
            <circle cx={hovered.x} cy={hovered.y} r={3} fill={hovered.point.success ? "#67e8f9" : "#f87171"} />
          </>
        )}
        <rect
          x={0}
          y={0}
          width={WIDTH}
          height={HEIGHT}
          fill="transparent"
          onMouseMove={handleMove}
          onMouseLeave={() => setHoverIdx(null)}
        />
      </svg>
      {hovered && (
        <div
          className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 whitespace-nowrap rounded-md border border-white/10 bg-[#0a0a0c] px-2 py-1 text-[10px] text-neutral-300 shadow-lg"
          style={{ left: `${(hovered.x / WIDTH) * 100}%` }}
        >
          <div>{formatTime(hovered.point.createdAt)}</div>
          <div className={hovered.point.success ? "text-cyan-200" : "text-red-300"}>
            {hovered.point.latencyMs != null ? `${hovered.point.latencyMs}ms` : "—"} &middot;{" "}
            {hovered.point.success ? "ok" : "failed"}
            {hovered.point.source === "heartbeat" && <span className="ml-1 text-neutral-500">(heartbeat)</span>}
          </div>
        </div>
      )}
    </div>
  );
}
