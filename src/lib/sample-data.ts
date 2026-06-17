import { SalesRecord } from "./types";

// ────────────────────────────────────────────────────────────────
// Deterministic synthetic dataset used for previews / local dev when
// Supabase is not configured (NEXT_PUBLIC_USE_SAMPLE_DATA=true).
// Generates ~18 months of realistic sales lines with seasonality.
// ────────────────────────────────────────────────────────────────

const CUSTOMERS = [
  "Apex Retail", "Bright Living", "Crystal Mart", "Delta Foods", "Evergreen Co",
  "Future Tech", "Golden Spoon", "Harbor Goods", "Iris Beauty", "Jade Trading",
  "Kingdom Supply", "Lotus Pharma", "Metro Wholesale", "Nova Electronics", "Orchid Hotels",
];

const COMPANIES = [
  "Siam Group", "Bangkok Holdings", "Chao Phraya Corp", "Andaman Industries",
  "Mekong Partners", "Lanna Enterprises",
];

const SALESPERSONS = [
  "Somchai P.", "Wanida K.", "Anan T.", "Ploy S.", "Krit M.", "Nicha R.",
];

const PRODUCTS = [
  { code: "P-1001", name: "Premium Coffee Beans 1kg", category: "Beverages", price: 850 },
  { code: "P-1002", name: "Organic Green Tea 500g", category: "Beverages", price: 420 },
  { code: "P-2001", name: "Stainless Water Bottle", category: "Homeware", price: 390 },
  { code: "P-2002", name: "Ceramic Dinner Set", category: "Homeware", price: 1290 },
  { code: "P-3001", name: "Wireless Earbuds Pro", category: "Electronics", price: 2490 },
  { code: "P-3002", name: "Smart LED Bulb", category: "Electronics", price: 290 },
  { code: "P-3003", name: "Portable Charger 20000mAh", category: "Electronics", price: 990 },
  { code: "P-4001", name: "Cotton T-Shirt", category: "Apparel", price: 350 },
  { code: "P-4002", name: "Denim Jacket", category: "Apparel", price: 1490 },
  { code: "P-5001", name: "Vitamin C Serum", category: "Beauty", price: 690 },
  { code: "P-5002", name: "Sunscreen SPF50", category: "Beauty", price: 450 },
  { code: "P-6001", name: "Notebook A5 Pack", category: "Stationery", price: 180 },
];

const PROVINCES = [
  "Bangkok", "Chiang Mai", "Phuket", "Khon Kaen", "Chonburi", "Nonthaburi", "Songkhla",
];

// Mulberry32 — small, fast, seeded PRNG for reproducible data.
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

let cached: SalesRecord[] | null = null;

export function generateSampleData(): SalesRecord[] {
  if (cached) return cached;
  const rand = mulberry32(20240117);
  const pick = <T>(arr: T[]) => arr[Math.floor(rand() * arr.length)];

  const records: SalesRecord[] = [];
  const end = new Date(2026, 5, 1); // up to Jun 2026
  const start = new Date(2024, 11, 1); // from Dec 2024 (~18 months)

  let invoiceSeq = 1000;
  const cursor = new Date(start);

  while (cursor <= end) {
    const month = cursor.getMonth();
    const daysInMonth = new Date(cursor.getFullYear(), month + 1, 0).getDate();
    // Seasonality: stronger Q4 + mid-year, mild upward trend over time.
    const monthsFromStart =
      (cursor.getFullYear() - start.getFullYear()) * 12 +
      (month - start.getMonth());
    const trend = 1 + monthsFromStart * 0.015;
    const seasonal = 1 + 0.35 * Math.sin((month / 12) * Math.PI * 2) + (month >= 9 ? 0.25 : 0);
    const ordersThisMonth = Math.round((90 + rand() * 50) * trend * seasonal);

    for (let i = 0; i < ordersThisMonth; i++) {
      const day = 1 + Math.floor(rand() * daysInMonth);
      const dateObj = new Date(cursor.getFullYear(), month, day);
      const date = dateObj.toISOString().slice(0, 10);
      const invoiceNo = `INV-${++invoiceSeq}`;
      const customer = pick(CUSTOMERS);
      const company = pick(COMPANIES);
      const salesperson = pick(SALESPERSONS);
      const province = pick(PROVINCES);

      // 1-3 line items per invoice.
      const lines = 1 + Math.floor(rand() * 3);
      for (let l = 0; l < lines; l++) {
        const product = pick(PRODUCTS);
        const quantity = 1 + Math.floor(rand() * 12);
        const unitPrice = product.price;
        const salesAmount = Math.round(quantity * unitPrice * (0.95 + rand() * 0.1));
        records.push({
          id: `${invoiceNo}-${l}`,
          date,
          invoice_no: invoiceNo,
          customer_name: customer,
          company_name: company,
          salesperson,
          product_code: product.code,
          product_name: product.name,
          category: product.category,
          quantity,
          unit_price: unitPrice,
          sales_amount: salesAmount,
          province,
        });
      }
    }
    cursor.setMonth(cursor.getMonth() + 1);
  }

  cached = records;
  return records;
}
