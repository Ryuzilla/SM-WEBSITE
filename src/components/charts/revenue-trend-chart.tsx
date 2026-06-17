"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { MonthlyPoint } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { ChartTooltip } from "./chart-tooltip";

export function RevenueTrendChart({
  data,
  showForecast = true,
  showPreviousYear = true,
  height = 340,
}: {
  data: MonthlyPoint[];
  showForecast?: boolean;
  showPreviousYear?: boolean;
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
        <CartesianGrid
          strokeDasharray="3 3"
          className="stroke-border"
          vertical={false}
        />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 12 }}
          className="fill-muted-foreground"
          tickLine={false}
          axisLine={false}
          minTickGap={16}
        />
        <YAxis
          tick={{ fontSize: 12 }}
          className="fill-muted-foreground"
          tickLine={false}
          axisLine={false}
          width={64}
          tickFormatter={(v) => formatCurrency(Number(v), { compact: true })}
        />
        <Tooltip content={<ChartTooltip />} />
        <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
        <Line
          type="monotone"
          dataKey="revenue"
          name="Revenue"
          stroke="hsl(var(--chart-1))"
          strokeWidth={2.5}
          dot={false}
          activeDot={{ r: 5 }}
        />
        {showPreviousYear && (
          <Line
            type="monotone"
            dataKey="previousYearRevenue"
            name="Previous Year"
            stroke="hsl(var(--chart-3))"
            strokeWidth={2}
            strokeDasharray="5 4"
            dot={false}
            connectNulls
          />
        )}
        {showForecast && (
          <Line
            type="monotone"
            dataKey="forecast"
            name="Forecast"
            stroke="hsl(var(--chart-4))"
            strokeWidth={2}
            strokeDasharray="2 3"
            dot={{ r: 3 }}
            connectNulls
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  );
}
