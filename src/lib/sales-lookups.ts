import * as XLSX from "xlsx";
import { toNumber } from "./utils";

// ────────────────────────────────────────────────────────────────
// Multi-sheet / multi-file support with lookup joins.
//
// Real ERP exports (Prosoft / Express / WinSpeed) store transactions
// with *codes* and keep human-readable names in separate master sheets:
//   - Product master  (ITEMCODE):  รหัสสินค้า → ชื่อสินค้า, ชื่อเจ้าหนี้
//   - Customer master (CUSTOMER):  รหัสลูกค้า → ชื่อบริษัท, ที่อยู่ (→ จังหวัด)
//
// We read every sheet across the uploaded file(s), build lookup maps,
// and enrich the canonical sales rows (output of applyMapping) so the
// dashboard shows real names instead of codes.
// ────────────────────────────────────────────────────────────────

export interface SheetData {
  /** "<file> › <sheet>" for display. */
  name: string;
  headers: string[];
  rows: Record<string, unknown>[];
}

export type SheetRole = "sales" | "products" | "customers" | "ignore";

/** Read every worksheet of a workbook file into SheetData[]. */
export async function parseAllSheets(file: File): Promise<SheetData[]> {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: "array", cellDates: true });
  return wb.SheetNames.map((sheetName) => {
    const ws = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, {
      defval: "",
      raw: false,
    });
    const headers = rows.length ? Object.keys(rows[0]) : [];
    return { name: `${file.name} › ${sheetName}`, headers, rows };
  });
}

const includesAny = (headers: string[], subs: string[]) =>
  headers.some((h) => subs.some((s) => h.toLowerCase().includes(s.toLowerCase())));

/** Heuristically classify a sheet by its headers. */
export function classifySheet(sheet: SheetData): SheetRole {
  const h = sheet.headers;
  if (includesAny(h, ["รหัสสินค้า"]) && includesAny(h, ["ชื่อสินค้า"]))
    return "products";
  if (includesAny(h, ["รหัสลูกค้า"]) && includesAny(h, ["ชื่อบริษัท", "ชื่อลูกค้า"]))
    return "customers";
  // Sales: a date-like + an amount-like column (+ usually a qty).
  if (
    includesAny(h, ["mildate", "date", "วันที่"]) &&
    includesAny(h, ["netamt", "amount", "ยอด", "จำนวนเงิน"])
  )
    return "sales";
  return "ignore";
}

// Find the first header containing any of the substrings.
const findCol = (headers: string[], subs: string[]) =>
  headers.find((h) => subs.some((s) => h.toLowerCase().includes(s.toLowerCase())));

export interface ProductInfo {
  name: string;
  supplier: string;
}

/** code → { name, supplier } from a product master sheet. */
export function buildProductMap(sheet: SheetData): Map<string, ProductInfo> {
  const codeCol = findCol(sheet.headers, ["รหัสสินค้า", "productcode", "stkcode"]);
  const nameCol = findCol(sheet.headers, ["ชื่อสินค้า", "productname"]);
  const supCol = findCol(sheet.headers, ["ชื่อเจ้าหนี้", "supplier", "brand"]);
  const map = new Map<string, ProductInfo>();
  if (!codeCol || !nameCol) return map;
  for (const r of sheet.rows) {
    const code = String(r[codeCol] ?? "").trim();
    if (!code) continue;
    map.set(code, {
      name: String(r[nameCol] ?? "").trim(),
      supplier: supCol ? String(r[supCol] ?? "").trim() : "",
    });
  }
  return map;
}

export interface CustomerInfo {
  name: string;
  province: string;
  group: string;
}

/** code → { name, province, group } from a customer master sheet. */
export function buildCustomerMap(sheet: SheetData): Map<string, CustomerInfo> {
  const codeCol = findCol(sheet.headers, ["รหัสลูกค้า", "customercode"]);
  const nameCol = findCol(sheet.headers, ["ชื่อบริษัท", "ชื่อลูกค้า", "customername"]);
  const addrCol = findCol(sheet.headers, ["ที่อยู่", "address"]);
  const zoneCol = findCol(sheet.headers, ["เขต", "zone"]);
  const groupCol = findCol(sheet.headers, ["กลุ่ม", "group"]);
  const map = new Map<string, CustomerInfo>();
  if (!codeCol || !nameCol) return map;
  for (const r of sheet.rows) {
    const code = String(r[codeCol] ?? "").trim();
    if (!code) continue;
    const province = addrCol
      ? extractProvince(String(r[addrCol] ?? ""))
      : zoneCol
        ? String(r[zoneCol] ?? "").trim()
        : "";
    map.set(code, {
      name: String(r[nameCol] ?? "").trim(),
      province,
      group: groupCol ? String(r[groupCol] ?? "").trim() : "",
    });
  }
  return map;
}

// 77 Thai provinces (without the "จังหวัด"/"จ." prefix).
export const THAI_PROVINCES = [
  "กรุงเทพมหานคร", "กระบี่", "กาญจนบุรี", "กาฬสินธุ์", "กำแพงเพชร", "ขอนแก่น",
  "จันทบุรี", "ฉะเชิงเทรา", "ชลบุรี", "ชัยนาท", "ชัยภูมิ", "ชุมพร", "เชียงราย",
  "เชียงใหม่", "ตรัง", "ตราด", "ตาก", "นครนายก", "นครปฐม", "นครพนม", "นครราชสีมา",
  "นครศรีธรรมราช", "นครสวรรค์", "นนทบุรี", "นราธิวาส", "น่าน", "บึงกาฬ", "บุรีรัมย์",
  "ปทุมธานี", "ประจวบคีรีขันธ์", "ปราจีนบุรี", "ปัตตานี", "พระนครศรีอยุธยา", "พะเยา",
  "พังงา", "พัทลุง", "พิจิตร", "พิษณุโลก", "เพชรบุรี", "เพชรบูรณ์", "แพร่", "ภูเก็ต",
  "มหาสารคาม", "มุกดาหาร", "แม่ฮ่องสอน", "ยโสธร", "ยะลา", "ร้อยเอ็ด", "ระนอง",
  "ระยอง", "ราชบุรี", "ลพบุรี", "ลำปาง", "ลำพูน", "เลย", "ศรีสะเกษ", "สกลนคร",
  "สงขลา", "สตูล", "สมุทรปราการ", "สมุทรสงคราม", "สมุทรสาคร", "สระแก้ว", "สระบุรี",
  "สิงห์บุรี", "สุโขทัย", "สุพรรณบุรี", "สุราษฎร์ธานี", "สุรินทร์", "หนองคาย",
  "หนองบัวลำภู", "อ่างทอง", "อำนาจเจริญ", "อุดรธานี", "อุตรดิตถ์", "อุทัยธานี",
  "อุบลราชธานี",
];

/** Pull a province out of a Thai address string. */
export function extractProvince(address: string): string {
  if (!address) return "";
  // "จ.ชลบุรี" / "จังหวัดชลบุรี"
  const m = address.match(/จ(?:ังหวัด|\.)\s*([ก-๙]+)/);
  if (m) {
    const candidate = m[1];
    const hit = THAI_PROVINCES.find(
      (p) => candidate.startsWith(p) || p.startsWith(candidate),
    );
    if (hit) return hit;
    return candidate;
  }
  // Bangkok variants
  if (/กรุงเทพ|กทม/.test(address)) return "กรุงเทพมหานคร";
  // Fallback: any province name present in the string.
  for (const p of THAI_PROVINCES) if (address.includes(p)) return p;
  return "";
}

export interface Lookups {
  products?: Map<string, ProductInfo>;
  customers?: Map<string, CustomerInfo>;
}

/**
 * Enrich canonical sales rows (output of applyMapping) with master data.
 * At this stage Customer_Name holds the customer *code* and Product_Code
 * holds the product code; we resolve them to real names + province.
 */
export function enrichRows(
  rows: Record<string, unknown>[],
  lookups: Lookups,
): Record<string, unknown>[] {
  return rows.map((row) => {
    const out = { ...row };

    const custCode = String(row["Customer_Name"] ?? "").trim();
    const cust = lookups.customers?.get(custCode);
    if (cust) {
      if (cust.name) out["Customer_Name"] = cust.name;
      if (!String(out["Province"] ?? "").trim() && cust.province)
        out["Province"] = cust.province;
    }

    const prodCode = String(row["Product_Code"] ?? "").trim();
    const prod = lookups.products?.get(prodCode);
    if (prod) {
      if (prod.name) out["Product_Name"] = prod.name;
      if (!String(out["Category"] ?? "").trim() && prod.supplier)
        out["Category"] = prod.supplier;
    }

    return out;
  });
}

/** Count how many sales rows successfully resolved against the masters. */
export function joinStats(
  rows: Record<string, unknown>[],
  lookups: Lookups,
  customerCodeField = "Customer_Name",
  productCodeField = "Product_Code",
) {
  let customersMatched = 0;
  let productsMatched = 0;
  for (const r of rows) {
    if (lookups.customers?.has(String(r[customerCodeField] ?? "").trim()))
      customersMatched++;
    if (lookups.products?.has(String(r[productCodeField] ?? "").trim()))
      productsMatched++;
  }
  return {
    total: rows.length,
    customersMatched,
    productsMatched,
  };
}
