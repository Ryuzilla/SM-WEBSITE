"use client";

import * as React from "react";
import {
  Crown,
  FileSpreadsheet,
  Search,
  Target,
  TrendingUp,
  Trophy,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { ChartCard } from "@/components/dashboard/chart-card";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { PageHeader } from "@/components/dashboard/page-header";
import { VerticalBarChart } from "@/components/charts/vertical-bar-chart";
import { FilterBar } from "@/components/filters/filter-bar";
import { useDashboard } from "@/components/providers/dashboard-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { exportToExcel } from "@/lib/export";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/utils";

export default function SalespersonsPage() {
  const { analytics } = useDashboard();

  const [search, setSearch] = React.useState<string>("");

  const salespersons = analytics.salespersons;

  const filtered = React.useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return salespersons;
    return salespersons.filter((s) => s.name.toLowerCase().includes(query));
  }, [salespersons, search]);

  const topPerformer = React.useMemo(
    () => salespersons.find((s) => s.isTopPerformer) ?? salespersons[0] ?? null,
    [salespersons],
  );

  const handleExport = React.useCallback(() => {
    exportToExcel(
      [
        {
          name: "Salespersons",
          rows: salespersons.map((s, i) => ({
            Rank: i + 1,
            Name: s.name,
            Daily_Revenue: s.dailyRevenue,
            Monthly_Revenue: s.monthlyRevenue,
            Total_Revenue: s.totalRevenue,
            "Target_Achievement_%": s.targetAchievement,
            Customers: s.customersManaged,
            Performance_Score: s.performanceScore,
          })),
        },
      ],
      "salesperson-performance.xlsx",
    );
    toast.success("Exported salesperson performance to Excel");
  }, [salespersons]);

  return (
    <div className="space-y-6">
      <FilterBar />

      <PageHeader
        title="Salesperson Performance"
        description="Revenue, target achievement and performance scores by salesperson."
        actions={
          <Button variant="outline" size="sm" onClick={handleExport}>
            <FileSpreadsheet className="h-4 w-4" /> Export Excel
          </Button>
        }
      />

      {topPerformer && (
        <Card className="animate-fade-in overflow-hidden border-amber-400/40 bg-gradient-to-br from-amber-400/10 via-transparent to-primary/5">
          <CardContent className="p-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-amber-400/20 text-amber-600 dark:text-amber-400">
                  <Crown className="h-7 w-7" />
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Top Performer
                    </p>
                    <Badge variant="success">Top Performer</Badge>
                  </div>
                  <h2 className="text-xl font-bold tracking-tight">
                    {topPerformer.name}
                  </h2>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-6 sm:gap-8">
                <div className="space-y-0.5">
                  <p className="text-xs font-medium text-muted-foreground">
                    Total Revenue
                  </p>
                  <p className="text-lg font-bold tracking-tight">
                    {formatCurrency(topPerformer.totalRevenue, {
                      compact: true,
                    })}
                  </p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs font-medium text-muted-foreground">
                    Target
                  </p>
                  <p className="text-lg font-bold tracking-tight">
                    {formatPercent(topPerformer.targetAchievement)}
                  </p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs font-medium text-muted-foreground">
                    Score
                  </p>
                  <p className="text-lg font-bold tracking-tight">
                    {formatNumber(topPerformer.performanceScore)}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KpiCard
          title="Salespersons"
          value={formatNumber(salespersons.length)}
          icon={Users}
          hint="Active in current view"
          accent="bg-primary/10 text-primary"
        />
        <KpiCard
          title="Customers Managed"
          value={formatNumber(
            salespersons.reduce((sum, s) => sum + s.customersManaged, 0),
          )}
          icon={Target}
          hint="Across all salespersons"
          accent="bg-chart-2/10 text-chart-2"
        />
        <KpiCard
          title="Total Revenue"
          value={formatCurrency(
            salespersons.reduce((sum, s) => sum + s.totalRevenue, 0),
            { compact: true },
          )}
          icon={TrendingUp}
          hint="Combined team revenue"
          accent="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
        />
      </div>

      <ChartCard
        title="Performance by Revenue"
        description="Total revenue per salesperson."
        exportFileName="salesperson-performance.png"
      >
        <VerticalBarChart
          data={filtered.map((s) => ({ name: s.name, revenue: s.totalRevenue }))}
        />
      </ChartCard>

      <Card>
        <CardHeader className="flex flex-col gap-3 space-y-0 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Ranking</CardTitle>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search salesperson..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Salesperson</TableHead>
                  <TableHead className="text-right">Daily Revenue</TableHead>
                  <TableHead className="text-right">Monthly Revenue</TableHead>
                  <TableHead className="text-right">Target %</TableHead>
                  <TableHead className="text-right">Customers</TableHead>
                  <TableHead className="text-right">Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="h-24 text-center text-sm text-muted-foreground"
                    >
                      No salespersons match your search.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((s) => {
                    const rank = salespersons.indexOf(s) + 1;
                    const score = Math.min(100, Math.max(0, s.performanceScore));
                    return (
                      <TableRow key={s.name}>
                        <TableCell className="font-medium text-muted-foreground">
                          {rank}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {s.isTopPerformer && (
                              <Trophy className="h-4 w-4 shrink-0 text-amber-500" />
                            )}
                            <span className="font-medium">{s.name}</span>
                            {s.isTopPerformer && (
                              <Badge variant="success">Top Performer</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatCurrency(s.dailyRevenue)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatCurrency(s.monthlyRevenue)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge
                            variant={
                              s.targetAchievement >= 100 ? "success" : "warning"
                            }
                          >
                            {formatPercent(s.targetAchievement)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatNumber(s.customersManaged)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex flex-col items-end gap-1">
                            <span className="font-medium tabular-nums">
                              {formatNumber(s.performanceScore)}
                            </span>
                            <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-primary to-chart-4 transition-all"
                                style={{ width: `${score}%` }}
                              />
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
