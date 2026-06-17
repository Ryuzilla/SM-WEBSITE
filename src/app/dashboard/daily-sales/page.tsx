"use client";

import {
  AlertTriangle,
  CalendarDays,
  Receipt,
  Target,
  TrendingDown,
  TrendingUp,
  Trophy,
} from "lucide-react";

import { DailyOrdersChart, DailyRevenueChart } from "@/components/charts/daily-sales-chart";
import { ChartCard } from "@/components/dashboard/chart-card";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { PageHeader } from "@/components/dashboard/page-header";
import { FilterBar } from "@/components/filters/filter-bar";
import { useDashboard } from "@/components/providers/dashboard-provider";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DailyPoint } from "@/lib/types";
import { formatCurrency, formatDate, formatNumber } from "@/lib/utils";

interface DayDetailProps {
  title: string;
  point: DailyPoint | null;
  tone: "best" | "worst";
}

function DayDetail({ title, point, tone }: DayDetailProps) {
  const Icon = tone === "best" ? Trophy : AlertTriangle;
  const chipAccent =
    tone === "best"
      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
      : "bg-amber-500/10 text-amber-600 dark:text-amber-400";

  if (!point) {
    return (
      <div className="rounded-lg border border-dashed border-border p-5">
        <div className="flex items-center gap-2">
          <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${chipAccent}`}>
            <Icon className="h-4 w-4" />
          </span>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">No data available.</p>
      </div>
    );
  }

  const metTarget = point.revenue >= point.target;

  const rows: { label: string; value: string }[] = [
    { label: "Date", value: formatDate(point.date) },
    { label: "Revenue", value: formatCurrency(point.revenue) },
    { label: "Orders", value: formatNumber(point.orders) },
    { label: "Target", value: formatCurrency(point.target) },
  ];

  return (
    <div className="rounded-lg border border-border p-5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${chipAccent}`}>
            <Icon className="h-4 w-4" />
          </span>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
        </div>
        <Badge variant={metTarget ? "success" : "destructive"} className="gap-1">
          {metTarget ? (
            <TrendingUp className="h-3 w-3" />
          ) : (
            <TrendingDown className="h-3 w-3" />
          )}
          {metTarget ? "Met target" : "Below target"}
        </Badge>
      </div>

      <dl className="mt-4 space-y-2.5">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between text-sm">
            <dt className="text-muted-foreground">{row.label}</dt>
            <dd className="font-medium tabular-nums">{row.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export default function DailySalesPage() {
  const { analytics } = useDashboard();
  const { points, bestDay, worstDay, averageDailyRevenue } = analytics.daily;

  const hasData = points.length > 0;

  return (
    <div className="space-y-6">
      <FilterBar />

      <PageHeader
        title="Daily Sales Monitoring"
        description="Track daily revenue, order volume, and performance against target."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Average Daily Revenue"
          value={formatCurrency(averageDailyRevenue, { compact: true })}
          icon={CalendarDays}
        />
        <KpiCard
          title="Best Sales Day"
          value={bestDay ? formatCurrency(bestDay.revenue, { compact: true }) : "—"}
          hint={bestDay ? formatDate(bestDay.date) : "No data"}
          icon={Trophy}
          accent="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
        />
        <KpiCard
          title="Worst Sales Day"
          value={worstDay ? formatCurrency(worstDay.revenue, { compact: true }) : "—"}
          hint={worstDay ? formatDate(worstDay.date) : "No data"}
          icon={AlertTriangle}
          accent="bg-amber-500/10 text-amber-600 dark:text-amber-400"
        />
        <KpiCard
          title="Total Active Days"
          value={formatNumber(points.length)}
          icon={Receipt}
        />
      </div>

      <ChartCard
        title="Daily Revenue vs Target"
        description="Revenue performance against daily target"
        exportFileName="daily-revenue.png"
      >
        <DailyRevenueChart data={points} />
      </ChartCard>

      <ChartCard
        title="Daily Order Volume"
        description="Number of orders per day"
        exportFileName="daily-orders.png"
      >
        <DailyOrdersChart data={points} />
      </ChartCard>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-4 w-4 text-muted-foreground" />
            Best vs Worst Day
          </CardTitle>
        </CardHeader>
        <CardContent>
          {hasData ? (
            <div className="grid gap-4 md:grid-cols-2">
              <DayDetail title="Best Sales Day" point={bestDay} tone="best" />
              <DayDetail title="Worst Sales Day" point={worstDay} tone="worst" />
            </div>
          ) : (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No data available for the selected filters.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
