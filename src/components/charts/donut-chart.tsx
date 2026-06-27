"use client";

import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";

export interface DonutSegment {
  label: string;
  value: number;
  color: string; // hsl/hex
}

/**
 * Donut with a centered headline stat (à la the "Sales Overview" card in
 * reference-2). Segment angles are proportional to value.
 */
export function DonutChart({
  segments,
  centerValue,
  centerLabel,
  size = 200,
  thickness = 22,
}: {
  segments: DonutSegment[];
  centerValue: string;
  centerLabel: string;
  size?: number;
  thickness?: number;
}) {
  const data = segments.filter((s) => s.value > 0);
  const outer = size / 2;
  const inner = outer - thickness;

  return (
    <div className="relative mx-auto" style={{ width: size, height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="label"
            cx="50%"
            cy="50%"
            innerRadius={inner}
            outerRadius={outer}
            paddingAngle={2}
            stroke="none"
            startAngle={90}
            endAngle={-270}
          >
            {data.map((s) => (
              <Cell key={s.label} fill={s.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-2xl font-bold tracking-tight">{centerValue}</span>
        <span className="text-xs text-muted-foreground">{centerLabel}</span>
      </div>
    </div>
  );
}
