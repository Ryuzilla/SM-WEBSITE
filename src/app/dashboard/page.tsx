"use client";

import { CalendarDays, Package, Receipt, TrendingUp } from "lucide-react";
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useDashboard } from "@/components/providers/dashboard-provider";
import { FilterBar } from "@/components/filters/filter-bar";
import { DonutChart } from "@/components/charts/donut-chart";
import { RadialGauge } from "@/components/charts/radial-gauge";
import { MonthlyLineChart } from "@/components/charts/monthly-line-chart";
import { ChartTooltip } from "@/components/charts/chart-tooltip";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatNumber } from "@/lib/utils";

const PALETTE = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(220 70% 70%)",
  "hsl(160 60% 55%)",
  "hsl(38 80% 60%)",
  "hsl(280 70% 65%)",
  "hsl(10 80% 60%)",
];

export default function OverviewPage() {
  const { analytics } = useDashboard();
  const k = analytics.kpis;

  const monthlyTrend = analytics.monthly.map((m) => ({
    label: m.label,
    revenue: m.revenue,
  }));

  const topCompanies = analytics.companies
    .slice(0, 10)
    .map((c, i) => ({ ...c, color: PALETTE[i] }));

  const salespersons = analytics.salespersons;
  const topSales = salespersons.slice(0, 9);
  const totalSKU = analytics.products.length;

  return (
    <div className="space-y-4">
      {/* Heading */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Sales Dashboard &middot; Real-time
          </p>
          <h1 className="font-display text-3xl font-bold tracking-tight">Overview</h1>
        </div>
        <Badge variant="secondary" className="gap-1.5 px-3 py-1.5 text-xs">
          <CalendarDays className="h-3.5 w-3.5" />
          {analytics.recordCount.toLocaleString()} records
        </Badge>
      </div>

      <FilterBar />

      {/* ── Row 1 ── */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {/* Brand */}
        <Card className="xl:col-span-1 flex flex-col items-center justify-center gap-3 py-6">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15">
            <TrendingUp className="h-7 w-7 text-primary" />
          </div>
          <div className="text-center">
            <p className="font-display text-xs font-bold uppercase tracking-tight leading-snug">
              SUPAMIT STORE
            </p>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
              SALES DASHBOARD
            </p>
          </div>
        </Card>

        {/* Revenue + Target + Gauge */}
        <Card className="xl:col-span-1">
          <CardContent className="p-4 space-y-3">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Total
            </p>
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-2xl font-bold tracking-tight tabular-nums">
                  {formatCurrency(k.totalRevenue, { compact: true })}
                </p>
                <p className="text-[10px] uppercase text-muted-foreground">BAHT</p>
              </div>
              <RadialGauge value={k.targetAchievement} size={76} />
            </div>
            <div className="border-t pt-2">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Total Target
              </p>
              <p className="mt-0.5 text-lg font-bold tracking-tight tabular-nums">
                {formatCurrency(k.revenueTarget)}
              </p>
              <p className="text-[10px] uppercase text-muted-foreground">BAHT</p>
            </div>
          </CardContent>
        </Card>

        {/* SKU + Orders */}
        <div className="xl:col-span-1 space-y-3">
          <Card>
            <CardContent className="p-4">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Total SKU
              </p>
              <div className="flex items-end justify-between mt-1">
                <p className="text-2xl font-bold tracking-tight tabular-nums">
                  {formatNumber(totalSKU)}
                </p>
                <Package className="h-5 w-5 text-primary/60" />
              </div>
              <p className="text-[10px] uppercase text-muted-foreground">SKU</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Total Orders
              </p>
              <div className="flex items-end justify-between mt-1">
                <p className="text-2xl font-bold tracking-tight tabular-nums">
                  {formatNumber(k.totalOrders)}
                </p>
                <Receipt className="h-5 w-5 text-primary/60" />
              </div>
              <p className="text-[10px] uppercase text-muted-foreground">INVOICE</p>
            </CardContent>
          </Card>
        </div>

        {/* Monthly Earnings */}
        <Card className="xl:col-span-2">
          <CardHeader className="pt-4 pb-2 px-4">
            <CardTitle className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Total Earning by Months
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <MonthlyLineChart data={monthlyTrend} />
          </CardContent>
        </Card>

        {/* Top Sales Revenue table */}
        <Card className="xl:col-span-1">
          <CardHeader className="pt-4 pb-1 px-4">
            <CardTitle className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Top Sales Revenue
            </CardTitle>
            <div className="flex justify-between pt-1 text-[10px] uppercase tracking-wide text-muted-foreground/60">
              <span>Sales</span>
              <span>Revenue</span>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <div>
              {topSales.map((s) => (
                <div
                  key={s.name}
                  className="flex items-center justify-between gap-2 border-t border-border/40 py-1"
                >
                  <span className="truncate text-xs font-medium">{s.name}</span>
                  <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                    {formatCurrency(s.totalRevenue, { compact: true })}
                  </span>
                </div>
              ))}
              {topSales.length === 0 && (
                <p className="py-4 text-center text-xs text-muted-foreground">No data</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Row 2 ── */}
      <div className="grid gap-3 grid-cols-1 lg:grid-cols-2 xl:grid-cols-6">
        {/* Top 10 Companies */}
        <Card className="xl:col-span-2">
          <CardHeader className="pt-4 pb-2 px-4">
            <CardTitle className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Top 10 Company &middot; Sales
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 px-4 pb-4 sm:flex-row sm:items-center">
            <div className="shrink-0">
              <DonutChart
                segments={topCompanies.map((c) => ({
                  label: c.companyName,
                  value: c.revenue,
                  color: c.color,
                }))}
                centerValue={formatCurrency(
                  topCompanies.reduce((s, c) => s + c.revenue, 0),
                  { compact: true },
                )}
                centerLabel="Total"
                size={160}
                thickness={18}
              />
            </div>
            <div className="flex-1 grid grid-cols-2 gap-x-4 gap-y-1">
              {topCompanies.map((c) => (
                <div key={c.companyName} className="flex items-center justify-between gap-1.5">
                  <div className="flex min-w-0 items-center gap-1.5">
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ background: c.color }}
                    />
                    <span className="truncate text-[11px] font-semibold">{c.companyName}</span>
                  </div>
                  <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground">
                    {formatCurrency(c.revenue, { compact: true })}
                  </span>
                </div>
              ))}
              {topCompanies.length === 0 && (
                <p className="col-span-2 text-xs text-muted-foreground">No data</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Customers by salesperson */}
        <Card className="xl:col-span-1">
          <CardHeader className="pt-4 pb-1 px-4">
            <CardTitle className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Customers by Sales
            </CardTitle>
            <div className="flex justify-between pt-1 text-[10px] uppercase tracking-wide text-muted-foreground/60">
              <span>Sales</span>
              <span>Customers</span>
            </div>
          </CardHeader>
          <CardContent className="max-h-[260px] overflow-y-auto px-4 pb-3 scrollbar-thin">
            <div>
              {salespersons.slice(0, 16).map((s, i) => (
                <div
                  key={s.name}
                  className={`flex items-center justify-between gap-2 py-1 text-xs${
                    i > 0 ? " border-t border-border/40" : ""
                  }`}
                >
                  <span className="truncate font-medium">{s.name}</span>
                  <span className="shrink-0 tabular-nums">{formatNumber(s.customersManaged)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Horizontal bar — sales by person */}
        <Card className="xl:col-span-1">
          <CardHeader className="pt-4 pb-2 px-4">
            <CardTitle className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Total Sales by Person
            </CardTitle>
          </CardHeader>
          <CardContent className="px-1 pb-3">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={topSales.map((s) => ({
                  name: s.name.split(" ")[0],
                  revenue: s.totalRevenue,
                }))}
                layout="vertical"
                margin={{ left: 0, right: 12, top: 0, bottom: 0 }}
              >
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={52} tick={{ fontSize: 10 }} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="revenue" name="Revenue" radius={[0, 4, 4, 0]}>
                  {topSales.map((_, i) => (
                    <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Vertical bar — sales by person */}
        <Card className="xl:col-span-1">
          <CardHeader className="pt-4 pb-2 px-4">
            <CardTitle className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Sales by Person
            </CardTitle>
          </CardHeader>
          <CardContent className="px-1 pb-3">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={topSales.map((s) => ({
                  name: s.name.split(" ")[0],
                  revenue: s.totalRevenue,
                }))}
                margin={{ left: 0, right: 0, top: 8, bottom: 36 }}
              >
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 9 }}
                  angle={-40}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis hide />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="revenue" name="Revenue" radius={[4, 4, 0, 0]}>
                  {topSales.map((_, i) => (
                    <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Full sales by person table */}
        <Card className="xl:col-span-1">
          <CardHeader className="pt-4 pb-1 px-4">
            <CardTitle className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Total Sales by Sale
            </CardTitle>
          </CardHeader>
          <CardContent className="max-h-[260px] overflow-y-auto px-4 pb-3 scrollbar-thin">
            <div>
              {salespersons.map((s, i) => (
                <div
                  key={s.name}
                  className={`grid grid-cols-[1fr_auto] gap-2 py-1 text-xs${
                    i > 0 ? " border-t border-border/40" : ""
                  }`}
                >
                  <span className="truncate font-medium">{s.name}</span>
                  <span className="tabular-nums text-muted-foreground">
                    {formatCurrency(s.totalRevenue, { compact: true })}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
