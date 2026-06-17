"use client";

import * as React from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  FileSpreadsheet,
  Search,
} from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/dashboard/page-header";
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
import type { CustomerRank } from "@/lib/types";
import { formatCurrency, formatDate, formatNumber } from "@/lib/utils";

type SortKey = "revenue" | "orders" | "lastPurchase" | "customerName";
type SortDir = "asc" | "desc";

const RANK_STYLES: Record<number, string> = {
  1: "bg-amber-400/20 text-amber-600 dark:text-amber-400",
  2: "bg-slate-400/20 text-slate-600 dark:text-slate-300",
  3: "bg-orange-500/20 text-orange-600 dark:text-orange-400",
};

export default function CustomersPage() {
  const { analytics } = useDashboard();

  const [search, setSearch] = React.useState<string>("");
  const [sortKey, setSortKey] = React.useState<SortKey>("revenue");
  const [sortDir, setSortDir] = React.useState<SortDir>("desc");

  const rows = React.useMemo<CustomerRank[]>(() => {
    const query = search.trim().toLowerCase();
    const filtered = query
      ? analytics.customers.filter((c) =>
          c.customerName.toLowerCase().includes(query),
        )
      : analytics.customers.slice();

    const sorted = filtered.sort((a, b) => {
      let cmp: number;
      if (sortKey === "revenue" || sortKey === "orders") {
        cmp = a[sortKey] - b[sortKey];
      } else {
        cmp = a[sortKey].localeCompare(b[sortKey]);
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return sorted;
  }, [analytics.customers, search, sortKey, sortDir]);

  const toggleSort = React.useCallback((key: SortKey) => {
    setSortKey((prevKey) => {
      if (prevKey === key) {
        setSortDir((prevDir) => (prevDir === "asc" ? "desc" : "asc"));
        return prevKey;
      }
      setSortDir(key === "customerName" ? "asc" : "desc");
      return key;
    });
  }, []);

  const handleExport = React.useCallback(() => {
    const exportRows = rows.map((c, index) => ({
      Rank: index + 1,
      Customer_Name: c.customerName,
      Revenue: c.revenue,
      Orders: c.orders,
      Last_Purchase: formatDate(c.lastPurchase),
    }));

    exportToExcel(
      [{ name: "Top Customers", rows: exportRows }],
      "top-customers.xlsx",
    );
    toast.success("Exported top customers to Excel.");
  }, [rows]);

  const sortIcon = (key: SortKey) => {
    if (sortKey !== key) {
      return <ArrowUpDown className="h-3.5 w-3.5 opacity-50" />;
    }
    return sortDir === "asc" ? (
      <ArrowUp className="h-3.5 w-3.5" />
    ) : (
      <ArrowDown className="h-3.5 w-3.5" />
    );
  };

  return (
    <div className="space-y-6">
      <FilterBar />

      <PageHeader
        title="Top 10 Customers"
        description="Highest value customers by revenue, orders and recency."
        actions={
          <Button onClick={handleExport} className="gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            Export Excel
          </Button>
        }
      />

      <Card>
        <CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Customer Ranking</CardTitle>
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search customers..."
              className="pl-9"
              aria-label="Search customers"
            />
          </div>
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">#</TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleSort("customerName")}
                    className="-ml-2 h-8 gap-1.5 px-2 text-xs font-semibold uppercase tracking-wide"
                  >
                    Customer
                    {sortIcon("customerName")}
                  </Button>
                </TableHead>
                <TableHead className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleSort("revenue")}
                    className="-mr-2 ml-auto h-8 gap-1.5 px-2 text-xs font-semibold uppercase tracking-wide"
                  >
                    Revenue
                    {sortIcon("revenue")}
                  </Button>
                </TableHead>
                <TableHead className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleSort("orders")}
                    className="-mr-2 ml-auto h-8 gap-1.5 px-2 text-xs font-semibold uppercase tracking-wide"
                  >
                    Orders
                    {sortIcon("orders")}
                  </Button>
                </TableHead>
                <TableHead className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleSort("lastPurchase")}
                    className="-mr-2 ml-auto h-8 gap-1.5 px-2 text-xs font-semibold uppercase tracking-wide"
                  >
                    Last Purchase
                    {sortIcon("lastPurchase")}
                  </Button>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="py-10 text-center text-sm text-muted-foreground"
                  >
                    No customers match your search.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((customer, index) => {
                  const rank = index + 1;
                  const medal = RANK_STYLES[rank];
                  return (
                    <TableRow key={`${customer.customerName}-${rank}`}>
                      <TableCell>
                        {medal ? (
                          <Badge
                            className={`h-6 w-6 justify-center p-0 tabular-nums ${medal}`}
                          >
                            {rank}
                          </Badge>
                        ) : (
                          <span className="pl-2 text-sm tabular-nums text-muted-foreground">
                            {rank}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        {customer.customerName}
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {formatCurrency(customer.revenue)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatNumber(customer.orders)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        {formatDate(customer.lastPurchase)}
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
