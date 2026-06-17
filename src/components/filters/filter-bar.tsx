"use client";

import * as React from "react";
import { Filter, X } from "lucide-react";
import { useDashboard } from "@/components/providers/dashboard-provider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DashboardFilters } from "@/lib/types";
import { MONTH_NAMES } from "@/lib/utils";

const ALL = "__all__";

/** A single labelled select that maps to one filter key. */
function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string | null;
  options: { value: string; label: string }[];
  onChange: (value: string | null) => void;
}) {
  return (
    <div className="flex min-w-[9rem] flex-1 flex-col gap-1">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <Select
        value={value ?? ALL}
        onValueChange={(v) => onChange(v === ALL ? null : v)}
      >
        <SelectTrigger>
          <SelectValue placeholder={`All ${label}`} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All {label}</SelectItem>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function FilterBar() {
  const { filters, setFilter, resetFilters, analytics, activeFilterCount } =
    useDashboard();
  const opts = analytics.filterOptions;

  const toStr = (v: number | null) => (v == null ? null : String(v));
  const num =
    (key: keyof DashboardFilters) => (v: string | null) =>
      setFilter(key, v == null ? null : (Number(v) as never));

  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Filter className="h-4 w-4 text-primary" />
          Filters
          {activeFilterCount > 0 && (
            <Badge variant="secondary">{activeFilterCount} active</Badge>
          )}
        </div>
        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" onClick={resetFilters}>
            <X className="h-4 w-4" /> Clear all
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <FilterSelect
          label="Year"
          value={toStr(filters.year)}
          options={opts.years.map((y) => ({ value: String(y), label: String(y) }))}
          onChange={num("year")}
        />
        <FilterSelect
          label="Quarter"
          value={toStr(filters.quarter)}
          options={[1, 2, 3, 4].map((q) => ({
            value: String(q),
            label: `Q${q}`,
          }))}
          onChange={num("quarter")}
        />
        <FilterSelect
          label="Month"
          value={toStr(filters.month)}
          options={MONTH_NAMES.map((m, i) => ({
            value: String(i + 1),
            label: m,
          }))}
          onChange={num("month")}
        />
        <FilterSelect
          label="Province"
          value={filters.province}
          options={opts.provinces.map((p) => ({ value: p, label: p }))}
          onChange={(v) => setFilter("province", v)}
        />
        <FilterSelect
          label="Category"
          value={filters.category}
          options={opts.categories.map((c) => ({ value: c, label: c }))}
          onChange={(v) => setFilter("category", v)}
        />
        <FilterSelect
          label="Product"
          value={filters.product}
          options={opts.products.map((p) => ({ value: p, label: p }))}
          onChange={(v) => setFilter("product", v)}
        />
        <FilterSelect
          label="Customer"
          value={filters.customer}
          options={opts.customers.map((c) => ({ value: c, label: c }))}
          onChange={(v) => setFilter("customer", v)}
        />
        <FilterSelect
          label="Company"
          value={filters.company}
          options={opts.companies.map((c) => ({ value: c, label: c }))}
          onChange={(v) => setFilter("company", v)}
        />
        <FilterSelect
          label="Salesperson"
          value={filters.salesperson}
          options={opts.salespersons.map((s) => ({ value: s, label: s }))}
          onChange={(v) => setFilter("salesperson", v)}
        />
      </div>
    </div>
  );
}
