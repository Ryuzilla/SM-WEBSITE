import * as XLSX from "xlsx";
import { REQUIRED_COLUMNS, RequiredColumn, SalesRecord } from "./types";
import { toNumber } from "./utils";

export interface ParsedSheet {
  headers: string[];
  rows: Record<string, unknown>[];
}

export interface ValidationResult {
  ok: boolean;
  missingColumns: RequiredColumn[];
  extraColumns: string[];
  rowErrors: { row: number; message: string }[];
  validRows: number;
}

/** Read the first worksheet of an .xlsx file into headers + row objects. */
export async function parseWorkbook(file: File): Promise<ParsedSheet> {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: "array", cellDates: true });
  const sheetName = wb.SheetNames[0];
  const sheet = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
    raw: false,
  });
  const headers = rows.length ? Object.keys(rows[0]) : [];
  return { headers, rows };
}

/** Validate that all required columns exist and rows are well-formed. */
export function validateSheet(sheet: ParsedSheet): ValidationResult {
  const headerSet = new Set(sheet.headers.map((h) => h.trim()));
  const missingColumns = REQUIRED_COLUMNS.filter((c) => !headerSet.has(c));
  const extraColumns = sheet.headers.filter(
    (h) => !REQUIRED_COLUMNS.includes(h.trim() as RequiredColumn),
  );

  const rowErrors: { row: number; message: string }[] = [];
  let validRows = 0;

  if (missingColumns.length === 0) {
    sheet.rows.forEach((row, i) => {
      const rowNo = i + 2; // account for header row + 1-based
      const errs: string[] = [];
      if (!row["Date"]) errs.push("missing Date");
      if (!row["Invoice_No"]) errs.push("missing Invoice_No");
      if (!row["Product_Name"]) errs.push("missing Product_Name");
      const qty = toNumber(row["Quantity"]);
      const amount = toNumber(row["Sales_Amount"]);
      if (qty <= 0) errs.push("Quantity must be > 0");
      if (amount < 0) errs.push("Sales_Amount must be >= 0");

      if (errs.length) {
        if (rowErrors.length < 50)
          rowErrors.push({ row: rowNo, message: errs.join(", ") });
      } else {
        validRows++;
      }
    });
  }

  return {
    ok: missingColumns.length === 0 && rowErrors.length === 0,
    missingColumns,
    extraColumns,
    rowErrors,
    validRows,
  };
}

function normalizeDate(value: unknown): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  const s = String(value).trim();
  // Handle common formats: YYYY-MM-DD, DD/MM/YYYY, MM/DD/YYYY.
  const d = new Date(s);
  if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) {
    const [, a, b, y] = m;
    return `${y}-${b.padStart(2, "0")}-${a.padStart(2, "0")}`;
  }
  return s;
}

/** Map validated rows to the normalized SalesRecord shape for DB insert. */
export function mapRowsToRecords(
  rows: Record<string, unknown>[],
): Omit<SalesRecord, "id">[] {
  return rows.map((row) => {
    const quantity = toNumber(row["Quantity"]);
    const unitPrice = toNumber(row["Unit_Price"]);
    const salesAmount =
      toNumber(row["Sales_Amount"]) || quantity * unitPrice;
    return {
      date: normalizeDate(row["Date"]),
      invoice_no: String(row["Invoice_No"]).trim(),
      customer_name: String(row["Customer_Name"]).trim(),
      company_name: String(row["Company_Name"]).trim(),
      salesperson: String(row["Salesperson"]).trim(),
      product_code: String(row["Product_Code"]).trim(),
      product_name: String(row["Product_Name"]).trim(),
      category: String(row["Category"]).trim(),
      quantity,
      unit_price: unitPrice,
      sales_amount: salesAmount,
      province: String(row["Province"]).trim(),
    };
  });
}
