import { RequiredColumn } from "./types";

// ────────────────────────────────────────────────────────────────
// Flexible column mapping. Real-world spreadsheets (especially ERP
// exports like Prosoft / Express / WinSpeed) rarely match our canonical
// field names, so we auto-detect a mapping from the uploaded headers and
// let the user adjust it before import.
// ────────────────────────────────────────────────────────────────

export interface TargetField {
  key: RequiredColumn;
  label: string;
  /** Required fields must be mapped before import is allowed. */
  required: boolean;
  /** Known source-header aliases (canonical name is always tried first). */
  aliases: string[];
  hint?: string;
}

// Order matters: specific aliases before generic ones. The auto-detector
// runs an exact pass across all fields first, then a fuzzy "contains" pass.
export const TARGET_FIELDS: TargetField[] = [
  {
    key: "Date",
    label: "Date",
    required: true,
    aliases: ["mildatevc", "mildate", "docdate", "billdate", "invoicedate", "วันที่", "วันที่เอกสาร"],
  },
  {
    key: "Invoice_No",
    label: "Invoice No.",
    required: false,
    hint: "If your file has no invoice/document number, leave unmapped — one will be generated per row.",
    aliases: ["milsto", "invoiceno", "docno", "billno", "voucher", "milvc", "milno", "เลขที่", "เลขที่เอกสาร", "เลขที่ใบกำกับ"],
  },
  {
    key: "Customer_Name",
    label: "Customer Name",
    required: true,
    aliases: ["customername", "custname", "debname", "milcus", "ลูกค้า", "ชื่อลูกค้า"],
  },
  {
    key: "Company_Name",
    label: "Company Name",
    required: false,
    hint: "Falls back to Customer Name if unmapped.",
    aliases: ["companyname", "บริษัท", "ชื่อบริษัท"],
  },
  {
    key: "Salesperson",
    label: "Salesperson",
    required: true,
    aliases: ["debsalesp", "salesperson", "salesp", "salesman", "saleman", "พนักงานขาย"],
  },
  {
    key: "Product_Code",
    label: "Product Code",
    required: false,
    hint: "Used to look up the product name from a product master sheet.",
    // NB: "MILstk" is the product code in these ERP exports; "STKcode2" is the
    // supplier/creditor code, so it is intentionally excluded here.
    aliases: ["milstk", "productcode", "stkcode", "itemcode", "รหัสสินค้า"],
  },
  {
    key: "Product_Name",
    label: "Product Name",
    required: false,
    hint: "Falls back to Product Code if unmapped.",
    aliases: ["productname", "stkname", "itemname", "stkdesc", "สินค้า", "ชื่อสินค้า"],
  },
  {
    key: "Category",
    label: "Category",
    required: false,
    hint: "Falls back to “Uncategorized”.",
    aliases: ["stkgroup", "stktype", "productgroup", "category", "หมวดหมู่", "กลุ่มสินค้า"],
  },
  {
    key: "Quantity",
    label: "Quantity",
    required: true,
    aliases: ["qty", "quantity", "จำนวน"],
  },
  {
    key: "Unit_Price",
    label: "Unit Price",
    required: false,
    hint: "Derived from Sales Amount ÷ Quantity if unmapped.",
    aliases: ["unitprice", "price", "ราคาต่อหน่วย", "ราคา"],
  },
  {
    key: "Sales_Amount",
    label: "Sales Amount",
    required: true,
    aliases: ["netamt", "salesamount", "nettotal", "amount", "total", "ยอดขาย", "จำนวนเงิน", "มูลค่า"],
  },
  {
    key: "Province",
    label: "Province",
    required: false,
    aliases: ["debzone", "province", "zone", "region", "จังหวัด", "เขต"],
  },
];

export type ColumnMapping = Partial<Record<RequiredColumn, string>>;

/** Normalise a header for comparison: lowercase, strip separators, keep Thai. */
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9ก-๙]/gi, "");

/**
 * Best-effort mapping of source headers → canonical fields.
 * Two global passes (exact, then fuzzy contains) so exact matches win.
 */
export function autoDetectMapping(headers: string[]): ColumnMapping {
  const used = new Set<string>();
  const mapping: ColumnMapping = {};
  const H = headers.map((h) => ({ raw: h, n: norm(h) }));

  // Pass 1 — exact match against canonical key + aliases.
  for (const field of TARGET_FIELDS) {
    for (const alias of [field.key, ...field.aliases]) {
      const na = norm(alias);
      const hit = H.find((h) => !used.has(h.raw) && h.n === na);
      if (hit) {
        mapping[field.key] = hit.raw;
        used.add(hit.raw);
        break;
      }
    }
  }

  // Pass 2 — fuzzy contains for anything still unmapped.
  for (const field of TARGET_FIELDS) {
    if (mapping[field.key]) continue;
    for (const alias of [field.key, ...field.aliases]) {
      const na = norm(alias);
      if (na.length < 3) continue;
      const hit = H.find(
        (h) => !used.has(h.raw) && (h.n.includes(na) || na.includes(h.n)),
      );
      if (hit) {
        mapping[field.key] = hit.raw;
        used.add(hit.raw);
        break;
      }
    }
  }

  return mapping;
}

/**
 * Project raw spreadsheet rows into rows keyed by canonical field names,
 * according to the (possibly user-edited) mapping. Unmapped fields become "".
 *
 * Also carries the supplier/brand code column (STKcode2) as "__brandCode"
 * so enrichRows() can resolve it against the brand master sheet without
 * requiring the user to explicitly map it.
 */
export function applyMapping(
  rows: Record<string, unknown>[],
  mapping: ColumnMapping,
): Record<string, unknown>[] {
  return rows.map((row) => {
    const out: Record<string, unknown> = {};
    for (const field of TARGET_FIELDS) {
      const src = mapping[field.key];
      out[field.key] = src ? row[src] : "";
    }
    const brandCol = Object.keys(row).find(
      (k) => k.toLowerCase().replace(/[^a-z0-9]/g, "") === "stkcode2",
    );
    if (brandCol) out["__brandCode"] = row[brandCol];
    return out;
  });
}

/** Validate that all hard requirements are satisfied by the mapping. */
export function validateMapping(mapping: ColumnMapping): string[] {
  const problems: string[] = [];
  for (const field of TARGET_FIELDS) {
    if (field.required && !mapping[field.key]) {
      problems.push(`“${field.label}” must be mapped`);
    }
  }
  if (!mapping.Product_Code && !mapping.Product_Name) {
    problems.push("Map at least one of Product Code or Product Name");
  }
  return problems;
}
