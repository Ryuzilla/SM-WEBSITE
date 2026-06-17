"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  FileSpreadsheet,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  parseWorkbook,
  validateSheet,
  type ParsedSheet,
  type ValidationResult,
} from "@/lib/excel-import";
import { REQUIRED_COLUMNS } from "@/lib/types";

export default function UploadPage() {
  const router = useRouter();
  const { profile } = useDashboard();
  const inputRef = React.useRef<HTMLInputElement>(null);

  const [fileName, setFileName] = React.useState<string>("");
  const [sheet, setSheet] = React.useState<ParsedSheet | null>(null);
  const [validation, setValidation] = React.useState<ValidationResult | null>(
    null,
  );
  const [parsing, setParsing] = React.useState(false);
  const [importing, setImporting] = React.useState(false);
  const [dragOver, setDragOver] = React.useState(false);

  if (profile.role !== "admin") {
    return (
      <div className="space-y-6">
        <PageHeader title="Upload Data" />
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <ShieldAlert className="h-10 w-10 text-amber-500" />
            <p className="text-lg font-semibold">Admin access required</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Only administrators can import sales data. Contact your system
              administrator if you need access.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  async function handleFile(file: File) {
    if (!file.name.match(/\.xlsx$/i)) {
      toast.error("Please upload a .xlsx file");
      return;
    }
    setParsing(true);
    setFileName(file.name);
    try {
      const parsed = await parseWorkbook(file);
      const result = validateSheet(parsed);
      setSheet(parsed);
      setValidation(result);
      if (result.ok) toast.success(`Validated ${result.validRows} rows`);
      else toast.warning("Validation found issues — see details below");
    } catch (err) {
      toast.error("Failed to read file");
      console.error(err);
    } finally {
      setParsing(false);
    }
  }

  async function handleImport() {
    if (!sheet || !validation?.ok) return;
    setImporting(true);
    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: sheet.rows }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Import failed");
      toast.success(
        data.demo
          ? `Validated ${data.imported} rows (demo mode — not persisted)`
          : `Imported ${data.imported} rows successfully`,
      );
      reset();
      router.refresh(); // re-fetch dashboard data
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Import failed");
    } finally {
      setImporting(false);
    }
  }

  function reset() {
    setSheet(null);
    setValidation(null);
    setFileName("");
    if (inputRef.current) inputRef.current.value = "";
  }

  const previewRows = sheet?.rows.slice(0, 8) ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Upload Sales Data"
        description="Import an Excel (.xlsx) file. Columns are validated automatically before import."
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
              const file = e.dataTransfer.files?.[0];
              if (file) handleFile(file);
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
                Drag & drop your .xlsx file here, or
              </p>
              <Button
                variant="link"
                onClick={() => inputRef.current?.click()}
                className="px-1"
              >
                browse to upload
              </Button>
            </div>
            {fileName && (
              <Badge variant="secondary" className="gap-1">
                <FileSpreadsheet className="h-3.5 w-3.5" /> {fileName}
              </Badge>
            )}
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
            />
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="font-medium">Required columns:</span>
            {REQUIRED_COLUMNS.map((c) => (
              <Badge key={c} variant="outline">
                {c}
              </Badge>
            ))}
            <Button asChild variant="link" size="sm" className="h-auto px-1">
              <a href="/sample-sales-template.xlsx" download>
                Download template
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Validation summary */}
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
                label="Missing columns"
                value={validation.missingColumns.length}
                bad={validation.missingColumns.length > 0}
              />
              <Stat
                label="Row errors"
                value={validation.rowErrors.length}
                bad={validation.rowErrors.length > 0}
              />
            </div>

            {validation.missingColumns.length > 0 && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm">
                <p className="font-medium text-destructive">Missing columns:</p>
                <p className="text-muted-foreground">
                  {validation.missingColumns.join(", ")}
                </p>
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
              <Button
                onClick={handleImport}
                disabled={!validation.ok || importing}
              >
                {importing && <Loader2 className="h-4 w-4 animate-spin" />}
                Import {validation.validRows} rows
              </Button>
              <Button variant="outline" onClick={reset} disabled={importing}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preview */}
      {sheet && previewRows.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              Data Preview{" "}
              <span className="text-sm font-normal text-muted-foreground">
                (first {previewRows.length} of {sheet.rows.length} rows)
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  {sheet.headers.map((h) => (
                    <TableHead key={h}>{h}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {previewRows.map((row, i) => (
                  <TableRow key={i}>
                    {sheet.headers.map((h) => (
                      <TableCell key={h} className="whitespace-nowrap">
                        {String(row[h] ?? "")}
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
          bad
            ? "text-destructive"
            : good
              ? "text-emerald-600 dark:text-emerald-400"
              : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}
