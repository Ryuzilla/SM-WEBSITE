"use client";

import * as XLSX from "xlsx";
import { toPng } from "html-to-image";

/** Trigger a browser download for an arbitrary Blob. */
function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Export an array of flat objects to CSV. */
export function exportToCsv<T extends Record<string, unknown>>(
  rows: T[],
  filename: string,
) {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => escape(r[h])).join(",")),
  ].join("\n");
  download(new Blob([csv], { type: "text/csv;charset=utf-8;" }), filename);
}

/** Export one or more named sheets to a single .xlsx workbook. */
export function exportToExcel(
  sheets: { name: string; rows: Record<string, unknown>[] }[],
  filename: string,
) {
  const wb = XLSX.utils.book_new();
  for (const sheet of sheets) {
    const ws = XLSX.utils.json_to_sheet(sheet.rows);
    XLSX.utils.book_append_sheet(wb, ws, sheet.name.slice(0, 31));
  }
  XLSX.writeFile(wb, filename);
}

/** Capture a DOM node (e.g. a chart container) and download it as PNG. */
export async function exportNodeToPng(node: HTMLElement, filename: string) {
  const dataUrl = await toPng(node, {
    cacheBust: true,
    pixelRatio: 2,
    backgroundColor:
      getComputedStyle(document.documentElement).getPropertyValue("--png-bg") ||
      "#ffffff",
  });
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  a.click();
}
