"use client";

import * as React from "react";

export interface BubbleSegment {
  label: string;
  value: number; // share, any scale — normalised internally
  color: string; // tailwind bg-* or hex via style
}

/**
 * Overlapping-bubble share chart (à la the "Customer Rating" card in the
 * reference). Circle areas are proportional to value; the largest anchors the
 * cluster and the rest float around it.
 */
export function BubbleChart({
  segments,
  height = 300,
}: {
  segments: BubbleSegment[];
  height?: number;
}) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const sorted = [...segments].sort((a, b) => b.value - a.value);

  // Diameter scales with sqrt(share) so area ≈ share. Largest bubble ~ 62% of
  // the box height; others scale relative to it.
  const maxShare = sorted[0] ? sorted[0].value / total : 1;
  const box = height;
  const sizeFor = (v: number) => {
    const share = v / total;
    return Math.max(64, (Math.sqrt(share) / Math.sqrt(maxShare)) * box * 0.62);
  };

  // Hand-placed anchors (relative %, center of each bubble) for up to 4 bubbles.
  const anchors = [
    { x: 38, y: 52 },
    { x: 72, y: 34 },
    { x: 70, y: 72 },
    { x: 30, y: 84 },
  ];

  return (
    <div className="space-y-4">
      <div className="relative w-full" style={{ height }}>
        {sorted.slice(0, 4).map((seg, i) => {
          const d = sizeFor(seg.value);
          const a = anchors[i] ?? anchors[0];
          const pct = Math.round((seg.value / total) * 100);
          return (
            <div
              key={seg.label}
              className={`absolute flex items-center justify-center rounded-full ${seg.color} shadow-lg ring-1 ring-white/10`}
              style={{
                width: d,
                height: d,
                left: `calc(${a.x}% - ${d / 2}px)`,
                top: `calc(${a.y}% - ${d / 2}px)`,
              }}
            >
              <span
                className="font-bold text-white drop-shadow"
                style={{ fontSize: Math.max(14, d * 0.18) }}
              >
                {pct}%
              </span>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
        {sorted.map((seg) => (
          <div key={seg.label} className="flex items-center gap-2 text-sm">
            <span className={`h-2.5 w-2.5 rounded-full ${seg.color}`} />
            <span className="text-muted-foreground">{seg.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
