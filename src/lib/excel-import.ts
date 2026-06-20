import * as XLSX from "xlsx";
import { SalesRecord } from "./types";
import { toNumber } from "./utils";

export interface ParsedSheet {
  headers: string[];
  rows: Record<string, unknown>[];
}

export interface ValidationResult {
  ok: boolean;
  /** Mapping-level problems (e.g. a required field is unmapped). */
  mappingErrors: string[];
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
  const headers = rows.length
    ? Object.keys(rows[0])
    : (XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1 })[0] ?? []);
  return { headers, rows };
}

/**
 * Validate rows that have already been projected into canonical fields
 * (via applyMapping). `mappingErrors` is supplied by validateMapping().
 */
export function validateMappedRows(
  rows: Record<string, unknown>[],
  mappingErrors: string[],
): ValidationResult {
  const rowErrors: { row: number; message: string }[] = [];
  let validRows = 0;

  if (mappingErrors.length === 0) {
    rows.forEach((row, i) => {
      const rowNo = i + 2; // header row + 1-based
      const errs: string[] = [];
      if (!row["Date"] || Number.isNaN(new Date(String(row["Date"])).getTime()))
        errs.push("invalid or missing Date");
      if (!row["Customer_Name"] && !row["Company_Name"])
        errs.push("missing Customer/Company");
      // NB: Quantity / Sales_Amount may be zero or negative — these are
      // legitimate returns / credit notes and are kept (they reduce revenue).

      if (errs.length) {
        if (rowErrors.length < 50)
          rowErrors.push({ row: rowNo, message: errs.join(", ") });
      } else {
        validRows++;
      }
    });
  }

  return {
    ok: mappingErrors.length === 0 && rowErrors.length === 0,
    mappingErrors,
    rowErrors,
    validRows,
  };
}

function normalizeDate(value: unknown): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  const s = String(value).trim();
  // DD/MM/YYYY or MM/DD/YYYY — 4-digit year (try before generic new Date() which
  // might misparse short years or locale-formatted strings).
  const m4 = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m4) {
    const [, a, b, y] = m4;
    // Assume D/M/YYYY (Thai/EU convention). If day > 12 it's unambiguous anyway.
    return `${y}-${b.padStart(2, "0")}-${a.padStart(2, "0")}`;
  }
  // D/M/YY or M/D/YY — 2-digit year (common in Thai ERP short-date format)
  const m2 = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2})$/);
  if (m2) {
    const [, a, b, y] = m2;
    const year = parseInt(y) < 70 ? `20${y}` : `19${y}`;
    return `${year}-${b.padStart(2, "0")}-${a.padStart(2, "0")}`;
  }
  const d = new Date(s);
  if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  return s;
}

/**
 * Map canonical rows (output of applyMapping) to normalized SalesRecord
 * shape for DB insert. Applies fallbacks for optional/unmapped fields:
 *  - Invoice_No   → generated per row when absent
 *  - Company_Name → falls back to Customer_Name (and vice-versa)
 *  - Product_Name → falls back to Product_Code
 *  - Category     → "Uncategorized"
 *  - Unit_Price   → Sales_Amount ÷ Quantity
 */
export function mapRowsToRecords(
  rows: Record<string, unknown>[],
): Omit<SalesRecord, "id">[] {
  return rows.map((row, i) => {
    const quantity = toNumber(row["Quantity"]);
    const salesAmount = toNumber(row["Sales_Amount"]);
    const unitPrice =
      toNumber(row["Unit_Price"]) ||
      (quantity > 0 ? Math.round((salesAmount / quantity) * 100) / 100 : 0);

    const customer = String(row["Customer_Name"] ?? "").trim();
    const company = String(row["Company_Name"] ?? "").trim();
    const productCode = String(row["Product_Code"] ?? "").trim();
    const productName = String(row["Product_Name"] ?? "").trim();
    const date = normalizeDate(row["Date"]);
    const invoice = String(row["Invoice_No"] ?? "").trim();

    return {
      date,
      invoice_no: invoice || `GEN-${date}-${i + 1}`,
      customer_name: customer || company,
      company_name: company || customer,
      salesperson: String(row["Salesperson"] ?? "").trim() || "Unassigned",
      product_code: productCode || productName,
      product_name: productName || productCode || "Unknown",
      category: String(row["Category"] ?? "").trim() || "Uncategorized",
      quantity,
      unit_price: unitPrice,
      sales_amount: salesAmount || quantity * unitPrice,
      province: String(row["Province"] ?? "").trim(),
    };
  });
}
