"use client";

import {
  Banknote,
  Building2,
  CalendarRange,
  Receipt,
  Target,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { useDashboard } from "@/components/providers/dashboard-provider";
import { KpiCard } from "./kpi-card";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/utils";

export function KpiGrid() {
  const { analytics } = useDashboard();
  const k = analytics.kpis;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard
        title="Total Revenue"
        value={formatCurrency(k.totalRevenue, { compact: true })}
        icon={Banknote}
        change={k.monthlyGrowthRate}
        hint="vs last month"
        accent="bg-blue-500/10 text-blue-600 dark:text-blue-400"
      />
      <KpiCard
        title="Total Orders"
        value={formatNumber(k.totalOrders)}
        icon={Receipt}
        hint="unique invoices"
        accent="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
      />
      <KpiCard
        title="Unique Customers"
        value={formatNumber(k.uniqueCustomers)}
        icon={Users}
        hint="active buyers"
        accent="bg-violet-500/10 text-violet-600 dark:text-violet-400"
      />
      <KpiCard
        title="Unique Companies"
        value={formatNumber(k.uniqueCompanies)}
        icon={Building2}
        hint="accounts"
        accent="bg-amber-500/10 text-amber-600 dark:text-amber-400"
      />
      <KpiCard
        title="Avg Order Value"
        value={formatCurrency(k.averageOrderValue)}
        icon={Wallet}
        hint="per invoice"
        accent="bg-cyan-500/10 text-cyan-600 dark:text-cyan-400"
      />
      <KpiCard
        title="Monthly Growth"
        value={formatPercent(k.monthlyGrowthRate)}
        icon={TrendingUp}
        change={k.monthlyGrowthRate}
        hint="month over month"
        accent="bg-rose-500/10 text-rose-600 dark:text-rose-400"
      />
      <KpiCard
        title="Daily Revenue"
        value={formatCurrency(k.dailyRevenue, { compact: true })}
        icon={CalendarRange}
        hint="avg per active day"
        accent="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
      />
      <KpiCard
        title="Target Achievement"
        value={formatPercent(k.targetAchievement).replace("+", "")}
        icon={Target}
        hint={`of ${formatCurrency(k.revenueTarget, { compact: true })}`}
        progress={k.targetAchievement}
        accent="bg-teal-500/10 text-teal-600 dark:text-teal-400"
      />
    </div>
  );
}
