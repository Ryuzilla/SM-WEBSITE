"use client";

import * as React from "react";
import { Search, FileSpreadsheet, Building2 } from "lucide-react";
import { useDashboard } from "@/components/providers/dashboard-provider";
import { PageHeader } from "@/components/dashboard/page-header";
import { FilterBar } from "@/components/filters/filter-bar";
import { ChartCard } from "@/components/dashboard/chart-card";
import { VerticalBarChart } from "@/components/charts/vertical-bar-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { exportToExcel } from "@/lib/export";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { toast } from "sonner";

const RANK_BADGE: Record<number, string> = {
  1: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  2: "border-slate-400/30 bg-slate-400/10 text-slate-600 dark:text-slate-300",
  3: "border-orange-500/30 bg-orange-500/10 text-orange-600 dark:text-orange-400",
};

export default function CompaniesPage() {
  const { analytics } = useDashboard();
  const [search, setSearch] = React.useState("");

  const filtered = React.useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return analytics.companies;
    return analytics.companies.filter((c) =>
      c.companyName.toLowerCase().includes(query),
    );
  }, [analytics.companies, search]);

  const handleExport = React.useCallback(() => {
    const rows = filtered.map((c, i) => ({
      Rank: i + 1,
      Company_Name: c.companyName,
      Revenue: c.revenue,
      Orders: c.orders,
      "Contribution_%": c.contribution,
    }));
    exportToExcel([{ name: "Top Companies", rows }], "top-companies.xlsx");
    toast.success("Exported top companies to Excel.");
  }, [filtered]);

  return (
    <div className="space-y-6">
      <FilterBar />

      <PageHeader
        title="Top 10 Companies"
        description="Revenue contribution by company account."
        actions={
          <Button onClick={handleExport} variant="outline">
            <FileSpreadsheet className="h-4 w-4" />
            Export Excel
          </Button>
        }
      />

      <ChartCard
        title="Revenue by Company"
        exportFileName="companies-chart.png"
      >
        <VerticalBarChart
          data={filtered.map((c) => ({
            name: c.companyName,
            revenue: c.revenue,
          }))}
        />
      </ChartCard>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            Company Breakdown
          </CardTitle>
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search companies..."
              aria-label="Search companies..."
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">#</TableHead>
                <TableHead>Company</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-right">Orders</TableHead>
                <TableHead className="text-right">Contribution %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-24 text-center text-sm text-muted-foreground"
                  >
                    No companies match your search.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((c, i) => {
                  const rank = i + 1;
                  const contribution = Math.min(
                    Math.max(c.contribution, 0),
                    100,
                  );
                  const badgeClass = RANK_BADGE[rank];
                  return (
                    <TableRow key={c.companyName}>
                      <TableCell className="font-medium text-muted-foreground">
                        {badgeClass ? (
                          <Badge
                            variant="outline"
                            className={badgeClass}
                          >
                            {rank}
                          </Badge>
                        ) : (
                          rank
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        {c.companyName}
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {formatCurrency(c.revenue)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatNumber(c.orders)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-col items-end gap-1.5">
                          <span className="text-sm font-medium tabular-nums">
                            {c.contribution}%
                          </span>
                          <div className="h-1 w-full max-w-[80px] overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-primary"
                              style={{ width: `${contribution}%` }}
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
        </CardContent>
      </Card>
    </div>
  );
}
