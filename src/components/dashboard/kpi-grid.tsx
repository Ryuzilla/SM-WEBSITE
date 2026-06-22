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
        accent="bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-[0_8px_20px_-8px_rgb(59_130_246/0.8)]"
      />
      <KpiCard
        title="Total Orders"
        value={formatNumber(k.totalOrders)}
        icon={Receipt}
        hint="unique invoices"
        accent="bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-[0_8px_20px_-8px_rgb(16_185_129/0.8)]"
      />
      <KpiCard
        title="Unique Customers"
        value={formatNumber(k.uniqueCustomers)}
        icon={Users}
        hint="active buyers"
        accent="bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-[0_8px_20px_-8px_rgb(139_92_246/0.8)]"
      />
      <KpiCard
        title="Unique Companies"
        value={formatNumber(k.uniqueCompanies)}
        icon={Building2}
        hint="accounts"
        accent="bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-[0_8px_20px_-8px_rgb(245_158_11/0.8)]"
      />
      <KpiCard
        title="Avg Order Value"
        value={formatCurrency(k.averageOrderValue)}
        icon={Wallet}
        hint="per invoice"
        accent="bg-gradient-to-br from-cyan-500 to-sky-600 text-white shadow-[0_8px_20px_-8px_rgb(6_182_212/0.8)]"
      />
      <KpiCard
        title="Monthly Growth"
        value={formatPercent(k.monthlyGrowthRate)}
        icon={TrendingUp}
        change={k.monthlyGrowthRate}
        hint="month over month"
        accent="bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-[0_8px_20px_-8px_rgb(244_63_94/0.8)]"
      />
      <KpiCard
        title="Daily Revenue"
        value={formatCurrency(k.dailyRevenue, { compact: true })}
        icon={CalendarRange}
        hint="avg per active day"
        accent="bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-[0_8px_20px_-8px_rgb(99_102_241/0.8)]"
      />
      <KpiCard
        title="Target Achievement"
        value={formatPercent(k.targetAchievement).replace("+", "")}
        icon={Target}
        hint={`of ${formatCurrency(k.revenueTarget, { compact: true })}`}
        progress={k.targetAchievement}
        accent="bg-gradient-to-br from-teal-500 to-emerald-600 text-white shadow-[0_8px_20px_-8px_rgb(20_184_166/0.8)]"
      />
    </div>
  );
}
