"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  FileSpreadsheet,
  Layers,
  Link2,
  Loader2,
  ShieldAlert,
  Upload,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useDashboard } from "@/components/providers/dashboard-provider";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { validateMappedRows } from "@/lib/excel-import";
import {
  applyMapping,
  autoDetectMapping,
  validateMapping,
  TARGET_FIELDS,
  type ColumnMapping,
} from "@/lib/column-mapping";
import {
  buildBrandMap,
  buildCustomerMap,
  buildProductMap,
  classifySheet,
  enrichRows,
  joinStats,
  parseAllSheets,
  type SheetData,
  type SheetRole,
} from "@/lib/sales-lookups";

const NONE = "__none__";

const ROLE_LABELS: Record<SheetRole, string> = {
  sales: "Sales transactions",
  products: "Product list (master)",
  customers: "Customer list (master)",
  brands: "Brand/Supplier list (STKCODE)",
  ignore: "Ignore",
};

export default function UploadPage() {
  const router = useRouter();
  const { profile } = useDashboard();
  const inputRef = React.useRef<HTMLInputElement>(null);

  const [sheets, setSheets] = React.useState<SheetData[]>([]);
  const [roles, setRoles] = React.useState<SheetRole[]>([]);
  const [mapping, setMapping] = React.useState<ColumnMapping>({});
  const [parsing, setParsing] = React.useState(false);
  const [importing, setImporting] = React.useState(false);
  const [importProgress, setImportProgress] = React.useState<{ done: number; total: number } | null>(null);
  const [dragOver, setDragOver] = React.useState(false);

  const salesIndex = roles.findIndex((r) => r === "sales");
  const salesSheet = salesIndex >= 0 ? sheets[salesIndex] : null;

  // Build lookup maps by merging all sheets assigned the products/customers/brands role.
  const { productMap, customerMap, brandMap } = React.useMemo(() => {
    const products = new Map();
    const customers = new Map();
    const brands = new Map();
    sheets.forEach((s, i) => {
      if (roles[i] === "products")
        buildProductMap(s).forEach((v, k) => products.set(k, v));
      if (roles[i] === "customers")
        buildCustomerMap(s).forEach((v, k) => customers.set(k, v));
      if (roles[i] === "brands")
        buildBrandMap(s).forEach((v, k) => brands.set(k, v));
    });
    return { productMap: products, customerMap: customers, brandMap: brands };
  }, [sheets, roles]);

  // Map + enrich + validate the sales sheet whenever inputs change.
  const { canonicalRows, validation, stats } = React.useMemo(() => {
    if (!salesSheet)
      return { canonicalRows: [], validation: null, stats: null };
    const mapped = applyMapping(salesSheet.rows, mapping);
    const s = joinStats(mapped, { products: productMap, customers: customerMap, brands: brandMap });
    const enriched = enrichRows(mapped, {
      products: productMap,
      customers: customerMap,
      brands: brandMap,
    });
    const mappingErrors = validateMapping(mapping);
    return {
      canonicalRows: enriched,
      validation: validateMappedRows(enriched, mappingErrors),
      stats: s,
    };
  }, [salesSheet, mapping, productMap, customerMap]);

  if (profile.role !== "admin") {
    return (
      <div className="space-y-6">
        <PageHeader title="Upload Data" />
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <ShieldAlert className="h-10 w-10 text-amber-500" />
            <p className="text-lg font-semibold">Admin access required</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Only administrators can import sales data.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  async function handleFiles(files: FileList | File[]) {
    const list = Array.from(files).filter((f) => /\.xlsx$/i.test(f.name));
    if (list.length === 0) {
      toast.error("Please upload .xlsx file(s)");
      return;
    }
    setParsing(true);
    try {
      const parsed: SheetData[] = [];
      for (const file of list) parsed.push(...(await parseAllSheets(file)));
      const nextSheets = [...sheets, ...parsed];
      const nextRoles = [...roles, ...parsed.map((s) => classifySheet(s))];
      setSheets(nextSheets);
      setRoles(nextRoles);

      // Auto-map the sales sheet's columns if one was detected.
      const si = nextRoles.findIndex((r) => r === "sales");
      if (si >= 0) setMapping(autoDetectMapping(nextSheets[si].headers));

      toast.success(
        `Loaded ${parsed.length} sheet(s) from ${list.length} file(s)`,
      );
    } catch (err) {
      toast.error("Failed to read file");
      console.error(err);
    } finally {
      setParsing(false);
    }
  }

  function setRole(index: number, role: SheetRole) {
    setRoles((prev) => {
      const next = [...prev];
      next[index] = role;
      return next;
    });
    if (role === "sales") setMapping(autoDetectMapping(sheets[index].headers));
  }

  function setFieldMapping(field: string, source: string) {
    setMapping((prev) => {
      const next = { ...prev };
      if (source === NONE) delete next[field as keyof ColumnMapping];
      else next[field as keyof ColumnMapping] = source;
      return next;
    });
  }

  async function handleImport() {
    if (!validation?.ok) return;
    setImporting(true);
    // Send in 500-row chunks to stay under Vercel's 4.5 MB request body limit.
    const CHUNK = 500;
    let totalImported = 0;
    let demo = false;
    try {
      setImportProgress({ done: 0, total: canonicalRows.length });
      for (let i = 0; i < canonicalRows.length; i += CHUNK) {
        const chunk = canonicalRows.slice(i, i + CHUNK);
        const res = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rows: chunk }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Import failed");
        totalImported += data.imported ?? 0;
        demo = demo || !!data.demo;
        setImportProgress({ done: Math.min(i + CHUNK, canonicalRows.length), total: canonicalRows.length });
      }
      toast.success(
        demo
          ? `Validated ${totalImported} rows (demo mode — not persisted)`
          : `Imported ${totalImported} rows successfully`,
      );
      reset();
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Import failed");
    } finally {
      setImporting(false);
      setImportProgress(null);
    }
  }

  function reset() {
    setSheets([]);
    setRoles([]);
    setMapping({});
    if (inputRef.current) inputRef.current.value = "";
  }

  const headers = salesSheet?.headers ?? [];
  const previewRows = canonicalRows.slice(0, 8);
  const mappedCount = TARGET_FIELDS.filter((f) => mapping[f.key]).length;
  const matchPct = (n: number) =>
    stats && stats.total ? Math.round((n / stats.total) * 100) : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Upload Sales Data"
        description="Import Excel file(s). Multiple sheets and master/lookup lists are supported — product & customer codes are resolved to names automatically."
      />

      {/* Dropzone */}
      <Card>
        <CardContent className="p-6">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files);
            }}
            className={`flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-10 text-center transition-colors ${
              dragOver ? "border-primary bg-primary/5" : "border-border"
            }`}
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              {parsing ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <Upload className="h-6 w-6" />
              )}
            </div>
            <div>
              <p className="font-medium">
                Drag & drop your .xlsx file(s) here, or
              </p>
              <Button
                variant="link"
                onClick={() => inputRef.current?.click()}
                className="px-1"
              >
                browse to upload
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              You can drop the sales file and the product/customer master files
              together.
            </p>
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.length) handleFiles(e.target.files);
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Detected sheets + roles */}
      {sheets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary" /> Detected Sheets
              <Badge variant="secondary">{sheets.length}</Badge>
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              We auto-detect each sheet&apos;s role. Adjust if needed.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {sheets.map((s, i) => (
              <div
                key={i}
                className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-2 text-sm">
                  <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{s.name}</span>
                  <Badge variant="outline">{s.rows.length} rows</Badge>
                </div>
                <Select
                  value={roles[i]}
                  onValueChange={(v) => setRole(i, v as SheetRole)}
                >
                  <SelectTrigger className="w-full sm:w-56">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(ROLE_LABELS) as SheetRole[]).map((r) => (
                      <SelectItem key={r} value={r}>
                        {ROLE_LABELS[r]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Lookup / join status */}
      {salesSheet && (productMap.size > 0 || customerMap.size > 0 || brandMap.size > 0) && stats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5 text-primary" /> Lookup Join
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {productMap.size > 0 && (
              <JoinStat
                label="Products resolved"
                detail={`${productMap.size} in master`}
                matched={stats.productsMatched}
                total={stats.total}
                pct={matchPct(stats.productsMatched)}
              />
            )}
            {customerMap.size > 0 && (
              <JoinStat
                label="Customers resolved"
                detail={`${customerMap.size} in master`}
                matched={stats.customersMatched}
                total={stats.total}
                pct={matchPct(stats.customersMatched)}
              />
            )}
            {brandMap.size > 0 && (
              <JoinStat
                label="Brands resolved"
                detail={`${brandMap.size} in STKCODE`}
                matched={stats.brandsMatched}
                total={stats.total}
                pct={matchPct(stats.brandsMatched)}
              />
            )}
          </CardContent>
        </Card>
      )}

      {/* Column mapping (sales sheet) */}
      {salesSheet && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowRight className="h-5 w-5 text-primary" /> Map Sales Columns
              <Badge variant="secondary">
                {mappedCount}/{TARGET_FIELDS.length} mapped
              </Badge>
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Customer &amp; product fields can hold codes — they are resolved to
              names via the master sheets above.
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {TARGET_FIELDS.map((field) => (
                <div key={field.key} className="space-y-1.5">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    {field.label}
                    {field.required && (
                      <Badge variant="outline" className="text-[10px]">
                        required
                      </Badge>
                    )}
                  </div>
                  <Select
                    value={mapping[field.key] ?? NONE}
                    onValueChange={(v) => setFieldMapping(field.key, v)}
                  >
                    <SelectTrigger
                      className={
                        field.required && !mapping[field.key]
                          ? "border-destructive"
                          : undefined
                      }
                    >
                      <SelectValue placeholder="— Not mapped —" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>— Not mapped —</SelectItem>
                      {headers.map((h) => (
                        <SelectItem key={h} value={h}>
                          {h}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Validation */}
      {validation && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {validation.ok ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              ) : (
                <XCircle className="h-5 w-5 text-destructive" />
              )}
              Validation {validation.ok ? "Passed" : "Issues Found"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <Stat label="Valid rows" value={validation.validRows} good />
              <Stat
                label="Mapping issues"
                value={validation.mappingErrors.length}
                bad={validation.mappingErrors.length > 0}
              />
              <Stat
                label="Row errors"
                value={validation.rowErrors.length}
                bad={validation.rowErrors.length > 0}
              />
            </div>

            {validation.mappingErrors.length > 0 && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm">
                <p className="font-medium text-destructive">Fix the mapping:</p>
                <ul className="list-inside list-disc text-muted-foreground">
                  {validation.mappingErrors.map((e) => (
                    <li key={e}>{e}</li>
                  ))}
                </ul>
              </div>
            )}

            {validation.rowErrors.length > 0 && (
              <div className="max-h-40 overflow-auto rounded-lg border bg-muted/30 p-3 text-sm scrollbar-thin">
                {validation.rowErrors.map((e) => (
                  <p key={e.row} className="text-muted-foreground">
                    <span className="font-medium text-foreground">
                      Row {e.row}:
                    </span>{" "}
                    {e.message}
                  </p>
                ))}
              </div>
            )}

            <div className="flex items-center gap-3">
              <Button onClick={handleImport} disabled={!validation.ok || importing}>
                {importing && <Loader2 className="h-4 w-4 animate-spin" />}
                {importProgress
                  ? `Importing… ${importProgress.done} / ${importProgress.total}`
                  : `Import ${validation.validRows} rows`}
              </Button>
              <Button variant="outline" onClick={reset} disabled={importing}>
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mapped + enriched preview */}
      {salesSheet && previewRows.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              Mapped Preview{" "}
              <span className="text-sm font-normal text-muted-foreground">
                (first {previewRows.length} of {canonicalRows.length} rows, as
                imported)
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  {TARGET_FIELDS.map((f) => (
                    <TableHead key={f.key}>{f.label}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {previewRows.map((row, i) => (
                  <TableRow key={i}>
                    {TARGET_FIELDS.map((f) => (
                      <TableCell key={f.key} className="whitespace-nowrap">
                        {String(row[f.key] ?? "") || (
                          <span className="text-muted-foreground/50">—</span>
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function JoinStat({
  label,
  detail,
  matched,
  total,
  pct,
}: {
  label: string;
  detail: string;
  matched: number;
  total: number;
  pct: number;
}) {
  const tone =
    pct >= 80 ? "text-emerald-600 dark:text-emerald-400" : pct > 0 ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground";
  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">{label}</p>
        <Badge variant={pct >= 80 ? "success" : pct > 0 ? "warning" : "secondary"}>
          {pct}% matched
        </Badge>
      </div>
      <p className={`mt-1 text-2xl font-bold ${tone}`}>
        {matched}
        <span className="text-base font-normal text-muted-foreground">
          {" "}
          / {total}
        </span>
      </p>
      <p className="text-xs text-muted-foreground">{detail}</p>
    </div>
  );
}

function Stat({
  label,
  value,
  good,
  bad,
}: {
  label: string;
  value: number;
  good?: boolean;
  bad?: boolean;
}) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p
        className={`text-2xl font-bold ${
          bad ? "text-destructive" : good ? "text-emerald-600 dark:text-emerald-400" : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}
