"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { ChartTooltip } from "./chart-tooltip";
import { formatCurrency } from "@/lib/utils";

export function MonthlyLineChart({
  data,
  height = 110,
}: {
  data: { label: string; revenue: number }[];
  height?: number;
}) {
  if (!data.length)
    return (
      <div
        style={{ height }}
        className="flex items-center justify-center text-xs text-muted-foreground"
      >
        No data
      </div>
    );

  const revenues = data.map((d) => d.revenue);
  const highest = Math.max(...revenues);
  const lowest = Math.min(...revenues);
  const average = revenues.reduce((a, b) => a + b, 0) / revenues.length;

  return (
    <div className="space-y-3">
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
          <XAxis dataKey="label" hide />
          <Tooltip content={<ChartTooltip />} />
          <Line
            type="monotone"
            dataKey="revenue"
            name="Revenue"
            stroke="hsl(var(--primary))"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div>
          <p className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <span className="text-emerald-400">&#8593;</span> Highest
          </p>
          <p className="font-semibold tabular-nums">
            {formatCurrency(highest, { compact: true })}
          </p>
        </div>
        <div className="text-center">
          <p className="text-[10px] text-muted-foreground">Average</p>
          <p className="font-semibold tabular-nums">
            {formatCurrency(average, { compact: true })}
          </p>
        </div>
        <div className="text-right">
          <p className="flex items-center justify-end gap-1 text-[10px] text-muted-foreground">
            Lowest <span className="text-red-400">&#8595;</span>
          </p>
          <p className="font-semibold tabular-nums">
            {formatCurrency(lowest, { compact: true })}
          </p>
        </div>
      </div>
    </div>
  );
}
