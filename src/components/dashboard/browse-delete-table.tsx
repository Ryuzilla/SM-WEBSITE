"use client";

import * as React from "react";
import { Loader2, RefreshCw, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface SalesRow {
  id: string;
  date: string;
  invoice_no: string;
  customer_name: string;
  company_name: string;
  salesperson: string;
  product_code: string;
  product_name: string;
  category: string;
  quantity: number;
  unit_price: number;
  sales_amount: number;
  province: string;
}

const SEARCH_COLUMNS: { key: string; label: string }[] = [
  { key: "salesperson", label: "Salesperson" },
  { key: "customer_name", label: "Customer" },
  { key: "company_name", label: "Company" },
  { key: "category", label: "Category" },
  { key: "product_code", label: "Product Code" },
  { key: "product_name", label: "Product Name" },
  { key: "province", label: "Province" },
  { key: "invoice_no", label: "Invoice No." },
];

export function BrowseDeleteTable() {
  const [rows, setRows] = React.useState<SalesRow[]>([]);
  const [total, setTotal] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(50);
  const [page, setPage] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [column, setColumn] = React.useState("salesperson");
  const [value, setValue] = React.useState("");
  const [appliedSearch, setAppliedSearch] = React.useState<{ column: string; value: string } | null>(null);

  const load = React.useCallback(async (pageNum: number, search: { column: string; value: string } | null) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(pageNum) });
      if (search?.value) {
        params.set("column", search.column);
        params.set("value", search.value);
      }
      const res = await fetch(`/api/sales/list?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load");
      if (data.demo) {
        toast.info("Demo mode — no live data to browse");
        setRows([]);
        setTotal(0);
        return;
      }
      setRows(data.rows);
      setTotal(data.total);
      setPageSize(data.pageSize ?? 50);
      setSelected(new Set());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load(0, null);
  }, [load]);

  function applySearch() {
    const s = value.trim() ? { column, value: value.trim() } : null;
    setAppliedSearch(s);
    setPage(0);
    load(0, s);
  }

  function goPage(p: number) {
    setPage(p);
    load(p, appliedSearch);
  }

  function toggleRow(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected((prev) =>
      prev.size === rows.length ? new Set() : new Set(rows.map((r) => r.id)),
    );
  }

  async function deleteSelected() {
    if (selected.size === 0) return;
    if (!confirm(`ลบ ${selected.size} แถวที่เลือก? ไม่สามารถกู้คืนได้`)) return;
    setDeleting(true);
    try {
      const res = await fetch("/api/sales/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selected) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Delete failed");
      toast.success(`ลบ ${selected.size} แถวเรียบร้อย`);
      load(page, appliedSearch);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeleting(false);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const allChecked = rows.length > 0 && selected.size === rows.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5 text-primary" /> Browse &amp; Delete Rows
          <Badge variant="secondary">{total.toLocaleString()} rows</Badge>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          ค้นหา เลือกแถวที่ต้องการ แล้วกดลบทีละหลายแถวได้
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search + actions */}
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-48">
            <Select value={column} onValueChange={setColumn}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SEARCH_COLUMNS.map((c) => (
                  <SelectItem key={c.key} value={c.key}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Input
            className="w-56"
            placeholder="พิมพ์คำค้นหา…"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && applySearch()}
          />
          <Button onClick={applySearch} disabled={loading} className="gap-2">
            <Search className="h-4 w-4" /> ค้นหา
          </Button>
          <Button variant="outline" onClick={() => load(page, appliedSearch)} disabled={loading} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
          <div className="ml-auto">
            <Button
              variant="destructive"
              onClick={deleteSelected}
              disabled={selected.size === 0 || deleting}
              className="gap-2"
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              ลบที่เลือก ({selected.size})
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="max-h-[480px] overflow-auto rounded-lg border scrollbar-thin">
          <Table>
            <TableHeader className="sticky top-0 bg-card">
              <TableRow>
                <TableHead className="w-10">
                  <input
                    type="checkbox"
                    checked={allChecked}
                    onChange={toggleAll}
                    className="h-4 w-4 accent-primary"
                  />
                </TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Invoice</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Salesperson</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="py-10 text-center text-muted-foreground">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="py-10 text-center text-muted-foreground">
                    ไม่พบข้อมูล
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((r) => (
                  <TableRow key={r.id} data-state={selected.has(r.id) ? "selected" : undefined}>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selected.has(r.id)}
                        onChange={() => toggleRow(r.id)}
                        className="h-4 w-4 accent-primary"
                      />
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{r.date}</TableCell>
                    <TableCell className="whitespace-nowrap">{r.invoice_no}</TableCell>
                    <TableCell className="max-w-[160px] truncate">{r.customer_name}</TableCell>
                    <TableCell className="whitespace-nowrap">{r.salesperson}</TableCell>
                    <TableCell className="max-w-[220px] truncate">{r.product_name}</TableCell>
                    <TableCell className="max-w-[120px] truncate">{r.category}</TableCell>
                    <TableCell className="text-right">{r.quantity}</TableCell>
                    <TableCell className="text-right">{r.sales_amount.toLocaleString()}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            หน้า {page + 1} / {totalPages}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => goPage(page - 1)} disabled={page <= 0 || loading}>
              ก่อนหน้า
            </Button>
            <Button variant="outline" size="sm" onClick={() => goPage(page + 1)} disabled={page + 1 >= totalPages || loading}>
              ถัดไป
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
