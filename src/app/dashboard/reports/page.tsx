"use client";

import * as React from "react";
import {
  FileDown,
  FileSpreadsheet,
  FileText,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { useDashboard } from "@/components/providers/dashboard-provider";
import { PageHeader } from "@/components/dashboard/page-header";
import { FilterBar } from "@/components/filters/filter-bar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { generateExecutivePdf } from "@/lib/report";
import { exportToCsv, exportToExcel } from "@/lib/export";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/utils";

export default function ReportsPage() {
  const { analytics } = useDashboard();
  const k = analytics.kpis;
  const stamp = new Date().toISOString().slice(0, 10);

  function handlePdf() {
    generateExecutivePdf(analytics, `executive-summary-${stamp}.pdf`);
    toast.success("Executive PDF report generated");
  }

  function handleExcel() {
    exportToExcel(
      [
        {
          name: "KPIs",
          rows: [
            { Metric: "Total Revenue", Value: k.totalRevenue },
            { Metric: "Total Orders", Value: k.totalOrders },
            { Metric: "Unique Customers", Value: k.uniqueCustomers },
            { Metric: "Unique Companies", Value: k.uniqueCompanies },
            { Metric: "Average Order Value", Value: Math.round(k.averageOrderValue) },
            { Metric: "Monthly Growth Rate %", Value: k.monthlyGrowthRate },
            { Metric: "Daily Revenue", Value: Math.round(k.dailyRevenue) },
            { Metric: "Target Achievement %", Value: Math.round(k.targetAchievement) },
          ],
        },
        {
          name: "Monthly",
          rows: analytics.monthly.map((m) => ({
            Month: m.label,
            Revenue: m.revenue,
            Orders: m.orders,
            "PrevYear Revenue": m.previousYearRevenue ?? "",
            "MoM Growth %": m.momGrowth ?? "",
            Forecast: m.forecast ?? "",
          })),
        },
        {
          name: "Top Products",
          rows: analytics.products.map((p, i) => ({
            Rank: i + 1,
            Product: p.productName,
            Category: p.category,
            Revenue: p.revenue,
            Quantity: p.quantity,
            "Share %": p.revenueShare,
          })),
        },
        {
          name: "Top Customers",
          rows: analytics.customers.map((c, i) => ({
            Rank: i + 1,
            Customer: c.customerName,
            Revenue: c.revenue,
            Orders: c.orders,
            "Last Purchase": c.lastPurchase,
          })),
        },
        {
          name: "Top Companies",
          rows: analytics.companies.map((c, i) => ({
            Rank: i + 1,
            Company: c.companyName,
            Revenue: c.revenue,
            Orders: c.orders,
            "Contribution %": c.contribution,
          })),
        },
        {
          name: "Salespersons",
          rows: analytics.salespersons.map((s, i) => ({
            Rank: i + 1,
            Name: s.name,
            "Total Revenue": s.totalRevenue,
            "Target %": s.targetAchievement,
            Customers: s.customersManaged,
            Score: s.performanceScore,
          })),
        },
      ],
      `sales-report-${stamp}.xlsx`,
    );
    toast.success("Excel workbook exported");
  }

  function handleCsv() {
    exportToCsv(
      analytics.monthly.map((m) => ({
        Month: m.label,
        Revenue: m.revenue,
        Orders: m.orders,
        "MoM Growth %": m.momGrowth ?? "",
        Forecast: m.forecast ?? "",
      })),
      `monthly-revenue-${stamp}.csv`,
    );
    toast.success("CSV exported");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Generate executive summary reports in PDF, Excel or CSV. Reports reflect the current filters."
      />

      <FilterBar />

      {/* Executive summary preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Executive Summary
            <Badge variant="secondary">{formatNumber(analytics.recordCount)} records</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Metric label="Total Revenue" value={formatCurrency(k.totalRevenue, { compact: true })} />
            <Metric label="Total Orders" value={formatNumber(k.totalOrders)} />
            <Metric label="Avg Order Value" value={formatCurrency(k.averageOrderValue)} />
            <Metric label="Monthly Growth" value={formatPercent(k.monthlyGrowthRate)} />
            <Metric label="Unique Customers" value={formatNumber(k.uniqueCustomers)} />
            <Metric label="Unique Companies" value={formatNumber(k.uniqueCompanies)} />
            <Metric label="Daily Revenue" value={formatCurrency(k.dailyRevenue, { compact: true })} />
            <Metric label="Target Achievement" value={formatPercent(k.targetAchievement).replace("+", "")} />
          </div>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Over the selected period, the business generated{" "}
            <strong className="text-foreground">{formatCurrency(k.totalRevenue)}</strong>{" "}
            across <strong className="text-foreground">{formatNumber(k.totalOrders)}</strong>{" "}
            orders from <strong className="text-foreground">{formatNumber(k.uniqueCustomers)}</strong>{" "}
            customers. The top product was{" "}
            <strong className="text-foreground">{analytics.products[0]?.productName ?? "—"}</strong>{" "}
            and the leading salesperson was{" "}
            <strong className="text-foreground">{analytics.salespersons[0]?.name ?? "—"}</strong>.
            Month-over-month growth stands at{" "}
            <strong className="text-foreground">{formatPercent(k.monthlyGrowthRate)}</strong>.
          </p>
        </CardContent>
      </Card>

      {/* Export options */}
      <div className="grid gap-4 md:grid-cols-3">
        <ReportCard
          icon={<FileText className="h-6 w-6" />}
          title="PDF Report"
          description="Formatted executive summary with KPIs and ranked tables. Ideal for board decks."
          accent="bg-red-500/10 text-red-600 dark:text-red-400"
          onClick={handlePdf}
          cta="Generate PDF"
        />
        <ReportCard
          icon={<FileSpreadsheet className="h-6 w-6" />}
          title="Excel Workbook"
          description="Multi-sheet workbook: KPIs, monthly trend, products, customers, companies, salespersons."
          accent="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          onClick={handleExcel}
          cta="Export Excel"
        />
        <ReportCard
          icon={<FileDown className="h-6 w-6" />}
          title="CSV Export"
          description="Raw monthly revenue series for downstream analysis in any tool."
          accent="bg-blue-500/10 text-blue-600 dark:text-blue-400"
          onClick={handleCsv}
          cta="Export CSV"
        />
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-muted/30 p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
}

function ReportCard({
  icon,
  title,
  description,
  accent,
  onClick,
  cta,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  accent: string;
  onClick: () => void;
  cta: string;
}) {
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${accent}`}>
          {icon}
        </div>
        <CardTitle className="pt-2">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col justify-between gap-4">
        <p className="text-sm text-muted-foreground">{description}</p>
        <Button onClick={onClick} className="w-full">
          {cta}
        </Button>
      </CardContent>
    </Card>
  );
}
