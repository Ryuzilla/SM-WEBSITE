"use client";

import { useMemo } from "react";
import {
  TrendingUp,
  TrendingDown,
  CalendarRange,
  Trophy,
  Sparkles,
  LineChart,
} from "lucide-react";
import { useDashboard } from "@/components/providers/dashboard-provider";
import { PageHeader } from "@/components/dashboard/page-header";
import { FilterBar } from "@/components/filters/filter-bar";
import { ChartCard } from "@/components/dashboard/chart-card";
import { RevenueTrendChart } from "@/components/charts/revenue-trend-chart";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/utils";

const ALL_YEARS = "__all__";

type MonthlyPoint = {
  month: string;
  label: string;
  revenue: number;
  orders: number;
  previousYearRevenue: number | null;
  momGrowth: number | null;
  forecast: number | null;
};

export default function SalesTrendPage() {
  const { filters, setFilter, analytics } = useDashboard();
  const monthly = analytics.monthly as MonthlyPoint[];
  const years = analytics.filterOptions.years;

  const kpis = useMemo(() => {
    const realized = monthly.filter((p) => p.revenue > 0);

    const latest = realized.length ? realized[realized.length - 1] : null;

    const avgRevenue = realized.length
      ? realized.reduce((sum, p) => sum + p.revenue, 0) / realized.length
      : 0;

    const best = realized.reduce<MonthlyPoint | null>(
      (max, p) => (!max || p.revenue > max.revenue ? p : max),
      null,
    );

    const forecastNext =
      monthly.find((p) => p.forecast !== null && p.revenue === 0) ?? null;

    return { latest, avgRevenue, best, forecastNext };
  }, [monthly]);

  const growthRows = useMemo(
    () => monthly.filter((p) => p.revenue > 0 || p.momGrowth !== null),
    [monthly],
  );

  return (
    <div className="space-y-6">
      <FilterBar />

      <PageHeader
        title="Sales Trend Analytics"
        description="Monthly revenue trend, year-over-year comparison, growth and forecast."
      />

      {/* Toolbar: year + date range */}
      <Card>
        <CardContent className="flex flex-col gap-4 py-4 sm:flex-row sm:items-end sm:gap-6">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Year
            </label>
            <Select
              value={filters.year !== null ? String(filters.year) : ALL_YEARS}
              onValueChange={(value) =>
                setFilter("year", value === ALL_YEARS ? null : Number(value))
              }
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="All years" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_YEARS}>All years</SelectItem>
                {years.map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              From
            </label>
            <Input
              type="date"
              className="w-[170px]"
              value={filters.dateFrom ?? ""}
              onChange={(e) =>
                setFilter("dateFrom", e.target.value || null)
              }
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              To
            </label>
            <Input
              type="date"
              className="w-[170px]"
              value={filters.dateTo ?? ""}
              onChange={(e) => setFilter("dateTo", e.target.value || null)}
            />
          </div>
        </CardContent>
      </Card>

      {/* KPI strip */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          icon={<LineChart className="h-4 w-4" />}
          title="Latest Month Revenue"
          value={
            kpis.latest
              ? formatCurrency(kpis.latest.revenue, { compact: true })
              : "—"
          }
          sub={kpis.latest?.label ?? "No data"}
          badge={
            kpis.latest && kpis.latest.momGrowth !== null ? (
              <Badge
                variant={kpis.latest.momGrowth >= 0 ? "success" : "destructive"}
              >
                {kpis.latest.momGrowth >= 0 ? (
                  <TrendingUp className="mr-1 h-3 w-3" />
                ) : (
                  <TrendingDown className="mr-1 h-3 w-3" />
                )}
                {formatPercent(kpis.latest.momGrowth)}
              </Badge>
            ) : null
          }
        />

        <KpiCard
          icon={<CalendarRange className="h-4 w-4" />}
          title="Avg Monthly Revenue"
          value={formatCurrency(kpis.avgRevenue, { compact: true })}
          sub="Across active months"
        />

        <KpiCard
          icon={<Trophy className="h-4 w-4" />}
          title="Best Month"
          value={
            kpis.best
              ? formatCurrency(kpis.best.revenue, { compact: true })
              : "—"
          }
          sub={kpis.best?.label ?? "No data"}
        />

        <KpiCard
          icon={<Sparkles className="h-4 w-4" />}
          title="Forecast Next Month"
          value={
            kpis.forecastNext && kpis.forecastNext.forecast !== null
              ? formatCurrency(kpis.forecastNext.forecast, { compact: true })
              : "—"
          }
          sub={kpis.forecastNext?.label ?? "No projection"}
        />
      </div>

      {/* Main chart */}
      <ChartCard
        title="Monthly Revenue Trend"
        description="Revenue with year-over-year comparison and forward projection."
        exportFileName="sales-trend.png"
      >
        <RevenueTrendChart data={monthly} />
      </ChartCard>

      {/* Month-over-month growth */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Month-over-Month Growth</CardTitle>
        </CardHeader>
        <CardContent>
          {growthRows.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No data available for the selected filters.
            </p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {growthRows.map((point) => (
                <div
                  key={point.month}
                  className="flex items-center justify-between gap-3 rounded-lg border bg-card px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {point.label}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatNumber(point.orders)} orders
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-sm font-semibold">
                      {formatCurrency(point.revenue, { compact: true })}
                    </span>
                    {point.momGrowth !== null ? (
                      <span
                        className={
                          point.momGrowth >= 0
                            ? "flex items-center text-xs font-medium text-emerald-600 dark:text-emerald-400"
                            : "flex items-center text-xs font-medium text-destructive"
                        }
                      >
                        {point.momGrowth >= 0 ? (
                          <TrendingUp className="mr-1 h-3 w-3" />
                        ) : (
                          <TrendingDown className="mr-1 h-3 w-3" />
                        )}
                        {formatPercent(point.momGrowth)}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function KpiCard({
  icon,
  title,
  value,
  sub,
  badge,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  sub: string;
  badge?: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <span className="text-muted-foreground">{icon}</span>
      </CardHeader>
      <CardContent className="space-y-1">
        <div className="flex items-center justify-between gap-2">
          <span className="text-2xl font-bold tracking-tight">{value}</span>
          {badge}
        </div>
        <p className="truncate text-xs text-muted-foreground">{sub}</p>
      </CardContent>
    </Card>
  );
}
