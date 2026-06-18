"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
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
import { parseWorkbook, validateMappedRows, type ParsedSheet } from "@/lib/excel-import";
import {
  applyMapping,
  autoDetectMapping,
  validateMapping,
  TARGET_FIELDS,
  type ColumnMapping,
} from "@/lib/column-mapping";

const NONE = "__none__";

export default function UploadPage() {
  const router = useRouter();
  const { profile } = useDashboard();
  const inputRef = React.useRef<HTMLInputElement>(null);

  const [fileName, setFileName] = React.useState("");
  const [sheet, setSheet] = React.useState<ParsedSheet | null>(null);
  const [mapping, setMapping] = React.useState<ColumnMapping>({});
  const [parsing, setParsing] = React.useState(false);
  const [importing, setImporting] = React.useState(false);
  const [dragOver, setDragOver] = React.useState(false);

  // Derived: mapped rows + validation, recomputed whenever mapping changes.
  const { mappedRows, validation } = React.useMemo(() => {
    if (!sheet) return { mappedRows: [], validation: null };
    const rows = applyMapping(sheet.rows, mapping);
    const mappingErrors = validateMapping(mapping);
    return { mappedRows: rows, validation: validateMappedRows(rows, mappingErrors) };
  }, [sheet, mapping]);

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
      setSheet(parsed);
      setMapping(autoDetectMapping(parsed.headers));
      toast.success(
        `Read ${parsed.rows.length} rows — review the column mapping below`,
      );
    } catch (err) {
      toast.error("Failed to read file");
      console.error(err);
    } finally {
      setParsing(false);
    }
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
    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: mappedRows }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Import failed");
      toast.success(
        data.demo
          ? `Validated ${data.imported} rows (demo mode — not persisted)`
          : `Imported ${data.imported} rows successfully`,
      );
      reset();
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Import failed");
    } finally {
      setImporting(false);
    }
  }

  function reset() {
    setSheet(null);
    setMapping({});
    setFileName("");
    if (inputRef.current) inputRef.current.value = "";
  }

  const headers = sheet?.headers ?? [];
  const previewRows = mappedRows.slice(0, 8);
  const mappedFieldKeys = TARGET_FIELDS.filter((f) => mapping[f.key]).map((f) => f.key);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Upload Sales Data"
        description="Import an Excel (.xlsx) file. Columns are auto-detected and you can adjust the mapping before importing."
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
              <p className="font-medium">Drag & drop your .xlsx file here, or</p>
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
          <p className="mt-4 text-xs text-muted-foreground">
            Any column names work — including Thai or ERP exports. We detect the
            mapping automatically and you confirm it below.{" "}
            <a href="/sample-sales-template.xlsx" download className="text-primary underline">
              Download a sample template
            </a>
            .
          </p>
        </CardContent>
      </Card>

      {/* Column mapping */}
      {sheet && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowRight className="h-5 w-5 text-primary" />
              Map Your Columns
              <Badge variant="secondary">
                {mappedFieldKeys.length}/{TARGET_FIELDS.length} mapped
              </Badge>
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Match each dashboard field to a column from your file. Required
              fields are marked. Unmapped optional fields use sensible defaults.
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {TARGET_FIELDS.map((field) => (
                <div key={field.key} className="space-y-1.5">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    {field.label}
                    {field.required ? (
                      <Badge variant="outline" className="text-[10px]">
                        required
                      </Badge>
                    ) : null}
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
                  {field.hint && (
                    <p className="text-xs text-muted-foreground">{field.hint}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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
                    <span className="font-medium text-foreground">Row {e.row}:</span>{" "}
                    {e.message}
                  </p>
                ))}
              </div>
            )}

            <div className="flex items-center gap-3">
              <Button onClick={handleImport} disabled={!validation.ok || importing}>
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

      {/* Mapped preview */}
      {sheet && previewRows.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              Mapped Preview{" "}
              <span className="text-sm font-normal text-muted-foreground">
                (first {previewRows.length} of {mappedRows.length} rows, as imported)
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
