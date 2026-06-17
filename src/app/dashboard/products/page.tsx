"use client";

import * as React from "react";
import { Search, FileSpreadsheet, Package } from "lucide-react";
import { useDashboard } from "@/components/providers/dashboard-provider";
import { PageHeader } from "@/components/dashboard/page-header";
import { FilterBar } from "@/components/filters/filter-bar";
import { ChartCard } from "@/components/dashboard/chart-card";
import { HorizontalBarChart } from "@/components/charts/horizontal-bar-chart";
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

export default function ProductsPage() {
  const { analytics } = useDashboard();
  const [search, setSearch] = React.useState("");

  const filtered = React.useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return analytics.products;
    return analytics.products.filter((p) => {
      return (
        p.productName.toLowerCase().includes(query) ||
        p.productCode.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query)
      );
    });
  }, [analytics.products, search]);

  const handleExport = React.useCallback(() => {
    const rows = filtered.map((p, i) => ({
      Rank: i + 1,
      Product_Code: p.productCode,
      Product_Name: p.productName,
      Category: p.category,
      Revenue: p.revenue,
      Quantity: p.quantity,
      "Revenue_Share_%": p.revenueShare,
    }));
    exportToExcel([{ name: "Top Products", rows }], "top-products.xlsx");
    toast.success("Exported top products to Excel.");
  }, [filtered]);

  return (
    <div className="space-y-6">
      <FilterBar />

      <PageHeader
        title="Top 10 Products"
        description="Best selling products by revenue, quantity and revenue share."
        actions={
          <Button onClick={handleExport} variant="outline">
            <FileSpreadsheet className="h-4 w-4" />
            Export to Excel
          </Button>
        }
      />

      <ChartCard
        title="Revenue by Product"
        exportFileName="products-chart.png"
      >
        <HorizontalBarChart
          data={filtered.map((p) => ({
            name: p.productName,
            revenue: p.revenue,
          }))}
        />
      </ChartCard>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <CardTitle className="flex items-center gap-2 text-base">
            <Package className="h-4 w-4 text-muted-foreground" />
            Product Breakdown
          </CardTitle>
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products..."
              aria-label="Search products..."
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">#</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Share %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="h-24 text-center text-sm text-muted-foreground"
                  >
                    No products match your search.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((p, i) => (
                  <TableRow key={p.productCode}>
                    <TableCell className="font-medium text-muted-foreground">
                      {i + 1}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{p.productName}</span>
                        <span className="text-xs text-muted-foreground">
                          {p.productCode}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{p.category}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {formatCurrency(p.revenue)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatNumber(p.quantity)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-col items-end gap-1.5">
                        <span className="text-sm font-medium tabular-nums">
                          {p.revenueShare}%
                        </span>
                        <div className="h-1 w-full max-w-[80px] overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{
                              width: `${Math.min(Math.max(p.revenueShare, 0), 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
