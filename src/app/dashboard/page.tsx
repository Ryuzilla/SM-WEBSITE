"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useDashboard } from "@/components/providers/dashboard-provider";
import { PageHeader } from "@/components/dashboard/page-header";
import { KpiGrid } from "@/components/dashboard/kpi-grid";
import { FilterBar } from "@/components/filters/filter-bar";
import { ChartCard } from "@/components/dashboard/chart-card";
import { RevenueTrendChart } from "@/components/charts/revenue-trend-chart";
import { HorizontalBarChart } from "@/components/charts/horizontal-bar-chart";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatNumber } from "@/lib/utils";

export default function OverviewPage() {
  const { analytics, profile } = useDashboard();

  const topProducts = analytics.products
    .slice(0, 7)
    .map((p) => ({ name: p.productName, revenue: p.revenue }));

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome back, ${profile.full_name?.split(" ")[0] ?? "Executive"}`}
        description="Your real-time sales performance at a glance."
        actions={
          <Button asChild>
            <Link href="/dashboard/reports">
              Generate Report <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        }
      />

      <FilterBar />
      <KpiGrid />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ChartCard
            title="Revenue Trend & Forecast"
            description="Monthly revenue with year-over-year comparison and 3-month projection"
            exportFileName="revenue-trend.png"
          >
            <RevenueTrendChart data={analytics.monthly} />
          </ChartCard>
        </div>

        <ChartCard
          title="Top Products"
          description="By revenue"
          exportFileName="top-products.png"
        >
          <HorizontalBarChart data={topProducts} height={340} />
        </ChartCard>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <SummaryList
          title="Top Customers"
          href="/dashboard/customers"
          rows={analytics.customers.slice(0, 5).map((c) => ({
            label: c.customerName,
            value: formatCurrency(c.revenue, { compact: true }),
            sub: `${formatNumber(c.orders)} orders`,
          }))}
        />
        <SummaryList
          title="Top Companies"
          href="/dashboard/companies"
          rows={analytics.companies.slice(0, 5).map((c) => ({
            label: c.companyName,
            value: formatCurrency(c.revenue, { compact: true }),
            sub: `${c.contribution}% share`,
          }))}
        />
        <SummaryList
          title="Top Salespersons"
          href="/dashboard/salespersons"
          rows={analytics.salespersons.slice(0, 5).map((s) => ({
            label: s.name,
            value: formatCurrency(s.totalRevenue, { compact: true }),
            sub: `score ${s.performanceScore}`,
            badge: s.isTopPerformer ? "Top" : undefined,
          }))}
        />
      </div>
    </div>
  );
}

function SummaryList({
  title,
  href,
  rows,
}: {
  title: string;
  href: string;
  rows: { label: string; value: string; sub: string; badge?: string }[];
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">{title}</CardTitle>
        <Button asChild variant="ghost" size="sm">
          <Link href={href}>
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {rows.map((r, i) => (
          <div key={i} className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                {i + 1}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{r.label}</p>
                <p className="text-xs text-muted-foreground">{r.sub}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {r.badge && <Badge variant="success">{r.badge}</Badge>}
              <span className="text-sm font-semibold">{r.value}</span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
