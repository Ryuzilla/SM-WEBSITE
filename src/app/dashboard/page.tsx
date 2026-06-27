"use client";

import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Banknote,
  CalendarDays,
  Crown,
  Receipt,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useDashboard } from "@/components/providers/dashboard-provider";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { FilterBar } from "@/components/filters/filter-bar";
import { DonutChart } from "@/components/charts/donut-chart";
import { RadialGauge } from "@/components/charts/radial-gauge";
import { AreaSparkChart } from "@/components/charts/area-spark-chart";
import { HighlightCard } from "@/components/dashboard/highlight-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/utils";

const DONUT_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export default function OverviewPage() {
  const { analytics, profile } = useDashboard();
  const k = analytics.kpis;

  // Revenue-by-category breakdown for the donut.
  const categoryTotals = new Map<string, number>();
  for (const p of analytics.products) {
    const key = p.category || "Uncategorized";
    categoryTotals.set(key, (categoryTotals.get(key) ?? 0) + p.revenue);
  }
  const categories = [...categoryTotals.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([label, value], i) => ({ label, value, color: DONUT_COLORS[i] }));

  const profitTrend = analytics.monthly.map((m) => ({
    label: m.label,
    revenue: m.revenue,
  }));

  const topCustomers = analytics.customers.slice(0, 6);
  const topProducts = analytics.products.slice(0, 6);
  const topSales = analytics.salespersons.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Page heading — editorial */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Sales Dashboard · Real-time
          </p>
          <h1 className="font-display text-4xl font-bold tracking-tight">
            Welcome,{" "}
            <span className="text-primary">
              {profile.full_name?.split(" ")[0] ?? "Executive"}
            </span>
          </h1>
        </div>
        <Badge variant="secondary" className="gap-1.5 px-3 py-1.5 text-xs">
          <CalendarDays className="h-3.5 w-3.5" />
          {analytics.recordCount.toLocaleString()} records
        </Badge>
      </div>

      <FilterBar />

      <div className="grid gap-6 xl:grid-cols-4">
        {/* ───────── Main column ───────── */}
        <div className="space-y-6 xl:col-span-3">
          {/* KPI row */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              title="Net Revenue"
              value={formatCurrency(k.totalRevenue, { compact: true })}
              icon={Banknote}
              change={k.monthlyGrowthRate}
              hint="vs last month"
              accent="bg-primary/15 text-primary"
            />
            <KpiCard
              title="Avg Order Value"
              value={formatCurrency(k.averageOrderValue)}
              icon={Wallet}
              hint="per invoice"
              accent="bg-chart-2/15 text-chart-2"
            />
            <GaugeKpi value={k.targetAchievement} target={k.revenueTarget} />
            <KpiCard
              title="Total Orders"
              value={formatNumber(k.totalOrders)}
              icon={Receipt}
              hint="unique invoices"
              accent="bg-chart-4/15 text-chart-4"
            />
          </div>

          {/* Sales overview + profit */}
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-base">Sales Overview</CardTitle>
                <div className="flex items-center gap-2 rounded-lg bg-secondary/50 px-3 py-1.5 text-sm">
                  <span className="text-muted-foreground">Number of Sales</span>
                  <span className="font-semibold">
                    {formatCurrency(k.totalRevenue, { compact: true })}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="grid items-center gap-6 sm:grid-cols-2">
                <DonutChart
                  segments={categories}
                  centerValue={formatNumber(k.totalOrders)}
                  centerLabel="Total Orders"
                />
                <div className="space-y-3">
                  {categories.map((c) => (
                    <div
                      key={c.label}
                      className="flex items-center justify-between gap-2"
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ background: c.color }}
                        />
                        <span className="truncate text-sm text-muted-foreground">
                          {c.label}
                        </span>
                      </div>
                      <span className="text-sm font-semibold tabular-nums">
                        {formatCurrency(c.value, { compact: true })}
                      </span>
                    </div>
                  ))}
                  {categories.length === 0 && (
                    <p className="text-sm text-muted-foreground">No data yet</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="flex flex-col">
              <CardHeader className="space-y-0 pb-2">
                <CardTitle className="text-base">Total Profit</CardTitle>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold tracking-tight">
                    {formatCurrency(k.totalRevenue, { compact: true })}
                  </span>
                  <span className="inline-flex items-center gap-0.5 text-xs font-medium text-emerald-500">
                    <ArrowUpRight className="h-3 w-3" />
                    {formatPercent(k.monthlyGrowthRate)}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="mt-auto pt-0">
                <AreaSparkChart data={profitTrend} />
              </CardContent>
            </Card>
          </div>

          {/* Customer list + premium CTA */}
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-base">Top Customers</CardTitle>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/dashboard/customers">
                    View all <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-[1fr_auto_auto] gap-x-4 gap-y-1 text-sm">
                  <div className="pb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Name
                  </div>
                  <div className="pb-2 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Orders
                  </div>
                  <div className="pb-2 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Revenue
                  </div>
                  {topCustomers.map((c) => (
                    <div
                      key={c.customerName}
                      className="contents [&>div]:border-t [&>div]:py-2.5"
                    >
                      <div className="flex min-w-0 items-center gap-2.5">
                        <Avatar className="h-7 w-7">
                          <AvatarFallback className="bg-primary/15 text-[10px] font-semibold text-primary">
                            {c.customerName.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="truncate font-medium">
                          {c.customerName}
                        </span>
                      </div>
                      <div className="text-right tabular-nums text-muted-foreground">
                        {formatNumber(c.orders)}
                      </div>
                      <div className="text-right font-semibold tabular-nums">
                        {formatCurrency(c.revenue, { compact: true })}
                      </div>
                    </div>
                  ))}
                  {topCustomers.length === 0 && (
                    <p className="col-span-3 py-4 text-center text-muted-foreground">
                      No customers yet
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <HighlightCard
              eyebrow="Premium Insight"
              value={formatCurrency(k.totalRevenue, { compact: true })}
              title="ยอดขายรวมทั้งหมด"
              description="ดูรายงานเชิงลึก แนวโน้ม และพยากรณ์รายเดือน พร้อมส่งออก PDF/Excel"
              ctaLabel="สร้างรายงาน"
              href="/dashboard/reports"
            />
          </div>
        </div>

        {/* ───────── Right rail ───────── */}
        <div className="space-y-6">
          {/* Quick insights */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Insights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <InsightRow
                icon={TrendingUp}
                tone="emerald"
                label="Monthly growth"
                value={formatPercent(k.monthlyGrowthRate)}
              />
              <InsightRow
                icon={CalendarDays}
                tone="blue"
                label="Avg daily revenue"
                value={formatCurrency(k.dailyRevenue, { compact: true })}
              />
              <InsightRow
                icon={Wallet}
                tone="violet"
                label="Avg order value"
                value={formatCurrency(k.averageOrderValue)}
              />
              <InsightRow
                icon={Receipt}
                tone="sky"
                label="Unique customers"
                value={formatNumber(k.uniqueCustomers)}
              />
            </CardContent>
          </Card>

          {/* Top products */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-base">Top Products</CardTitle>
              <Button asChild variant="ghost" size="sm">
                <Link href="/dashboard/products">
                  All <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {topProducts.map((p, i) => (
                <div key={p.productCode} className="flex items-center gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-semibold">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{p.productName}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {p.category}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-semibold tabular-nums">
                    {formatCurrency(p.revenue, { compact: true })}
                  </span>
                </div>
              ))}
              {topProducts.length === 0 && (
                <p className="text-sm text-muted-foreground">No products yet</p>
              )}
            </CardContent>
          </Card>

          {/* Top salespersons */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-base">Top Salespersons</CardTitle>
              <Button asChild variant="ghost" size="sm">
                <Link href="/dashboard/salespersons">
                  All <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {topSales.map((s) => (
                <div key={s.name} className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-primary/15 text-xs font-semibold text-primary">
                      {s.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1 truncate text-sm font-medium">
                      {s.name}
                      {s.isTopPerformer && (
                        <Crown className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                      )}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      score {s.performanceScore}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-semibold tabular-nums">
                    {formatCurrency(s.totalRevenue, { compact: true })}
                  </span>
                </div>
              ))}
              {topSales.length === 0 && (
                <p className="text-sm text-muted-foreground">No salespersons yet</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

/** KPI tile whose value is a semicircular goal gauge. */
function GaugeKpi({ value, target }: { value: number; target: number }) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="flex h-full flex-col p-5">
        <p className="text-sm font-medium text-muted-foreground">
          Target Achievement
        </p>
        <div className="mt-2 flex flex-1 items-center justify-center">
          <RadialGauge value={value} label="of goal" />
        </div>
        <p className="text-center text-xs text-muted-foreground">
          Goal {formatCurrency(target, { compact: true })}
        </p>
      </CardContent>
    </Card>
  );
}

const TONE_CLASSES: Record<string, string> = {
  emerald: "bg-emerald-500/15 text-emerald-500",
  blue: "bg-blue-500/15 text-blue-500",
  violet: "bg-violet-500/15 text-violet-500",
  sky: "bg-sky-500/15 text-sky-500",
};

function InsightRow({
  icon: Icon,
  tone,
  label,
  value,
}: {
  icon: typeof TrendingUp;
  tone: keyof typeof TONE_CLASSES | string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${TONE_CLASSES[tone] ?? TONE_CLASSES.blue}`}
      >
        <Icon className="h-4 w-4" />
      </span>
      <span className="flex-1 text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold tabular-nums">{value}</span>
    </div>
  );
}
