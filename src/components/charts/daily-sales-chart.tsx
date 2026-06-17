"use client";

import {
  Area,
  AreaChart,
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { DailyPoint } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { ChartTooltip } from "./chart-tooltip";

const axisProps = {
  tick: { fontSize: 11 },
  tickLine: false,
  axisLine: false,
  className: "fill-muted-foreground",
} as const;

/** Daily revenue vs target — composed line + reference target line. */
export function DailyRevenueChart({
  data,
  height = 320,
}: {
  data: DailyPoint[];
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={data} margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
        <XAxis dataKey="label" {...axisProps} minTickGap={24} />
        <YAxis
          {...axisProps}
          width={60}
          tickFormatter={(v) => formatCurrency(Number(v), { compact: true })}
        />
        <Tooltip content={<ChartTooltip />} />
        <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
        <Line
          type="monotone"
          dataKey="revenue"
          name="Daily Revenue"
          stroke="hsl(var(--chart-1))"
          strokeWidth={2.5}
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="target"
          name="Target"
          stroke="hsl(var(--chart-3))"
          strokeWidth={2}
          strokeDasharray="5 4"
          dot={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

/** Daily order volume — area chart. */
export function DailyOrdersChart({
  data,
  height = 320,
}: {
  data: DailyPoint[];
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
        <defs>
          <linearGradient id="ordersFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.4} />
            <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
        <XAxis dataKey="label" {...axisProps} minTickGap={24} />
        <YAxis {...axisProps} width={40} />
        <Tooltip content={<ChartTooltip />} />
        <Area
          type="monotone"
          dataKey="orders"
          name="Orders"
          stroke="hsl(var(--chart-2))"
          strokeWidth={2}
          fill="url(#ordersFill)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
