import {
  AnalyticsBundle,
  CompanyRank,
  CustomerRank,
  DailyPoint,
  DailySummary,
  DashboardFilters,
  FilterOptions,
  KpiSummary,
  MonthlyPoint,
  ProductRank,
  SalesRecord,
  SalespersonPerformance,
} from "./types";
import { MONTH_NAMES, quarterOfMonth } from "./utils";

// A simple per-salesperson monthly target used when no explicit target rows
// exist. In production these come from the `targets` table.
const DEFAULT_MONTHLY_TARGET_PER_SALESPERSON = 500_000;

// ──────────────────────────── Filtering ──────────────────────────

export function applyFilters(
  records: SalesRecord[],
  f: DashboardFilters,
): SalesRecord[] {
  return records.filter((r) => {
    const d = new Date(r.date);
    const year = d.getFullYear();
    const month = d.getMonth() + 1;

    if (f.year != null && year !== f.year) return false;
    if (f.month != null && month !== f.month) return false;
    if (f.quarter != null && quarterOfMonth(month) !== f.quarter) return false;
    if (f.dateFrom && r.date < f.dateFrom) return false;
    if (f.dateTo && r.date > f.dateTo) return false;
    if (f.province && r.province !== f.province) return false;
    if (f.customer && r.customer_name !== f.customer) return false;
    if (f.company && r.company_name !== f.company) return false;
    if (f.category && r.category !== f.category) return false;
    if (f.product && r.product_name !== f.product) return false;
    if (f.salesperson && r.salesperson !== f.salesperson) return false;
    return true;
  });
}

function uniqueSorted(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean))).sort((a, b) =>
    a.localeCompare(b),
  );
}

export function buildFilterOptions(records: SalesRecord[]): FilterOptions {
  return {
    years: Array.from(
      new Set(records.map((r) => new Date(r.date).getFullYear())),
    ).sort((a, b) => b - a),
    provinces: uniqueSorted(records.map((r) => r.province)),
    customers: uniqueSorted(records.map((r) => r.customer_name)),
    companies: uniqueSorted(records.map((r) => r.company_name)),
    categories: uniqueSorted(records.map((r) => r.category)),
    products: uniqueSorted(records.map((r) => r.product_name)),
    salespersons: uniqueSorted(records.map((r) => r.salesperson)),
  };
}

// ──────────────────────────── Helpers ────────────────────────────

const monthKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

const monthLabel = (key: string) => {
  const [y, m] = key.split("-").map(Number);
  return `${MONTH_NAMES[m - 1]} ${y}`;
};

function distinct<T>(arr: T[]): number {
  return new Set(arr).size;
}

// ──────────────────────────── KPIs ───────────────────────────────

export function computeKpis(
  records: SalesRecord[],
  monthly: MonthlyPoint[],
): KpiSummary {
  const totalRevenue = records.reduce((s, r) => s + r.sales_amount, 0);
  const totalOrders = distinct(records.map((r) => r.invoice_no));
  const uniqueCustomers = distinct(records.map((r) => r.customer_name));
  const uniqueCompanies = distinct(records.map((r) => r.company_name));
  const averageOrderValue = totalOrders ? totalRevenue / totalOrders : 0;

  const activeDays = distinct(records.map((r) => r.date));
  const dailyRevenue = activeDays ? totalRevenue / activeDays : 0;

  // Monthly growth = MoM growth of the most recent month with data.
  const withData = monthly.filter((m) => m.revenue > 0);
  const last = withData.at(-1);
  const monthlyGrowthRate = last?.momGrowth ?? 0;

  // Target = number of active salespersons × monthly target × active months.
  const activeSalespersons = distinct(records.map((r) => r.salesperson)) || 1;
  const activeMonths = distinct(records.map((r) => monthKey(new Date(r.date)))) || 1;
  const revenueTarget =
    activeSalespersons * DEFAULT_MONTHLY_TARGET_PER_SALESPERSON * activeMonths;
  const targetAchievement = revenueTarget
    ? (totalRevenue / revenueTarget) * 100
    : 0;

  return {
    totalRevenue,
    totalOrders,
    uniqueCustomers,
    uniqueCompanies,
    averageOrderValue,
    monthlyGrowthRate,
    dailyRevenue,
    targetAchievement,
    revenueTarget,
  };
}

// ──────────────────────────── Monthly trend ──────────────────────

export function computeMonthly(records: SalesRecord[]): MonthlyPoint[] {
  const buckets = new Map<string, { revenue: number; orders: Set<string> }>();

  for (const r of records) {
    const key = monthKey(new Date(r.date));
    if (!buckets.has(key)) buckets.set(key, { revenue: 0, orders: new Set() });
    const b = buckets.get(key)!;
    b.revenue += r.sales_amount;
    b.orders.add(r.invoice_no);
  }

  const keys = Array.from(buckets.keys()).sort();
  const revenueByKey = new Map(
    keys.map((k) => [k, buckets.get(k)!.revenue]),
  );

  const points: MonthlyPoint[] = keys.map((key, i) => {
    const b = buckets.get(key)!;
    const prevKey = keys[i - 1];
    const prevRevenue = prevKey ? buckets.get(prevKey)!.revenue : null;
    const momGrowth =
      prevRevenue && prevRevenue > 0
        ? ((b.revenue - prevRevenue) / prevRevenue) * 100
        : null;

    const [y, m] = key.split("-").map(Number);
    const prevYearKey = `${y - 1}-${String(m).padStart(2, "0")}`;

    return {
      month: key,
      label: monthLabel(key),
      revenue: Math.round(b.revenue),
      orders: b.orders.size,
      previousYearRevenue: revenueByKey.has(prevYearKey)
        ? Math.round(revenueByKey.get(prevYearKey)!)
        : null,
      momGrowth: momGrowth == null ? null : Number(momGrowth.toFixed(1)),
      forecast: null,
    };
  });

  return appendForecast(points);
}

/**
 * Append up to 3 forecast points using a least-squares linear regression over
 * the trailing 6 months of actual revenue.
 */
function appendForecast(points: MonthlyPoint[], horizon = 3): MonthlyPoint[] {
  const actuals = points.filter((p) => p.revenue > 0);
  if (actuals.length < 3) return points;

  const window = actuals.slice(-6);
  const n = window.length;
  const xs = window.map((_, i) => i);
  const ys = window.map((p) => p.revenue);
  const sumX = xs.reduce((a, b) => a + b, 0);
  const sumY = ys.reduce((a, b) => a + b, 0);
  const sumXY = xs.reduce((a, x, i) => a + x * ys[i], 0);
  const sumXX = xs.reduce((a, x) => a + x * x, 0);
  const denom = n * sumXX - sumX * sumX || 1;
  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;

  // Bridge the last actual into the forecast line for a continuous chart.
  const lastActual = points.at(-1)!;
  lastActual.forecast = lastActual.revenue;

  const [ly, lm] = lastActual.month.split("-").map(Number);
  const out = [...points];
  for (let h = 1; h <= horizon; h++) {
    const date = new Date(ly, lm - 1 + h, 1);
    const key = monthKey(date);
    const projected = Math.max(0, Math.round(intercept + slope * (n - 1 + h)));
    out.push({
      month: key,
      label: monthLabel(key),
      revenue: 0,
      orders: 0,
      previousYearRevenue: null,
      momGrowth: null,
      forecast: projected,
    });
  }
  return out;
}

// ──────────────────────────── Daily ──────────────────────────────

export function computeDaily(records: SalesRecord[]): DailySummary {
  const buckets = new Map<string, { revenue: number; orders: Set<string> }>();
  for (const r of records) {
    if (!buckets.has(r.date))
      buckets.set(r.date, { revenue: 0, orders: new Set() });
    const b = buckets.get(r.date)!;
    b.revenue += r.sales_amount;
    b.orders.add(r.invoice_no);
  }

  const activeSalespersons = distinct(records.map((r) => r.salesperson)) || 1;
  // Daily target derived from the monthly target spread across ~22 working days.
  const dailyTarget =
    (activeSalespersons * DEFAULT_MONTHLY_TARGET_PER_SALESPERSON) / 22;

  const points: DailyPoint[] = Array.from(buckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, b]) => {
      const d = new Date(date);
      return {
        date,
        label: d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }),
        revenue: Math.round(b.revenue),
        orders: b.orders.size,
        target: Math.round(dailyTarget),
      };
    });

  let bestDay: DailyPoint | null = null;
  let worstDay: DailyPoint | null = null;
  for (const p of points) {
    if (!bestDay || p.revenue > bestDay.revenue) bestDay = p;
    if (!worstDay || p.revenue < worstDay.revenue) worstDay = p;
  }

  const averageDailyRevenue = points.length
    ? points.reduce((s, p) => s + p.revenue, 0) / points.length
    : 0;

  return { points, bestDay, worstDay, averageDailyRevenue };
}

// ──────────────────────────── Rankings ───────────────────────────

export function computeProducts(records: SalesRecord[], limit = 10): ProductRank[] {
  const total = records.reduce((s, r) => s + r.sales_amount, 0) || 1;
  const map = new Map<string, ProductRank>();
  for (const r of records) {
    const key = r.product_code || r.product_name;
    if (!map.has(key)) {
      map.set(key, {
        productCode: r.product_code,
        productName: r.product_name,
        category: r.category,
        revenue: 0,
        quantity: 0,
        revenueShare: 0,
      });
    }
    const p = map.get(key)!;
    p.revenue += r.sales_amount;
    p.quantity += r.quantity;
  }
  return Array.from(map.values())
    .map((p) => ({
      ...p,
      revenue: Math.round(p.revenue),
      revenueShare: Number(((p.revenue / total) * 100).toFixed(2)),
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit);
}

export function computeCustomers(records: SalesRecord[], limit = 10): CustomerRank[] {
  const map = new Map<
    string,
    { revenue: number; orders: Set<string>; last: string }
  >();
  for (const r of records) {
    if (!map.has(r.customer_name))
      map.set(r.customer_name, { revenue: 0, orders: new Set(), last: r.date });
    const c = map.get(r.customer_name)!;
    c.revenue += r.sales_amount;
    c.orders.add(r.invoice_no);
    if (r.date > c.last) c.last = r.date;
  }
  return Array.from(map.entries())
    .map(([customerName, c]) => ({
      customerName,
      revenue: Math.round(c.revenue),
      orders: c.orders.size,
      lastPurchase: c.last,
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit);
}

export function computeCompanies(records: SalesRecord[], limit = 10): CompanyRank[] {
  const total = records.reduce((s, r) => s + r.sales_amount, 0) || 1;
  const map = new Map<string, { revenue: number; orders: Set<string> }>();
  for (const r of records) {
    if (!map.has(r.company_name))
      map.set(r.company_name, { revenue: 0, orders: new Set() });
    const c = map.get(r.company_name)!;
    c.revenue += r.sales_amount;
    c.orders.add(r.invoice_no);
  }
  return Array.from(map.entries())
    .map(([companyName, c]) => ({
      companyName,
      revenue: Math.round(c.revenue),
      orders: c.orders.size,
      contribution: Number(((c.revenue / total) * 100).toFixed(2)),
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit);
}

export function computeSalespersons(
  records: SalesRecord[],
): SalespersonPerformance[] {
  const map = new Map<
    string,
    {
      revenue: number;
      customers: Set<string>;
      days: Set<string>;
      months: Set<string>;
    }
  >();
  for (const r of records) {
    if (!map.has(r.salesperson))
      map.set(r.salesperson, {
        revenue: 0,
        customers: new Set(),
        days: new Set(),
        months: new Set(),
      });
    const s = map.get(r.salesperson)!;
    s.revenue += r.sales_amount;
    s.customers.add(r.customer_name);
    s.days.add(r.date);
    s.months.add(monthKey(new Date(r.date)));
  }

  const rows = Array.from(map.entries()).map(([name, s]) => {
    const months = s.months.size || 1;
    const days = s.days.size || 1;
    const target = DEFAULT_MONTHLY_TARGET_PER_SALESPERSON * months;
    const targetAchievement = target ? (s.revenue / target) * 100 : 0;
    return {
      name,
      totalRevenue: Math.round(s.revenue),
      dailyRevenue: Math.round(s.revenue / days),
      monthlyRevenue: Math.round(s.revenue / months),
      target,
      targetAchievement: Number(targetAchievement.toFixed(1)),
      customersManaged: s.customers.size,
      performanceScore: 0,
      isTopPerformer: false,
    };
  });

  // Composite performance score: weighted blend of target achievement (capped),
  // revenue rank, and customer breadth — normalised to 0-100.
  const maxRevenue = Math.max(1, ...rows.map((r) => r.totalRevenue));
  const maxCustomers = Math.max(1, ...rows.map((r) => r.customersManaged));
  for (const r of rows) {
    const achievementScore = Math.min(100, r.targetAchievement);
    const revenueScore = (r.totalRevenue / maxRevenue) * 100;
    const customerScore = (r.customersManaged / maxCustomers) * 100;
    r.performanceScore = Number(
      (achievementScore * 0.5 + revenueScore * 0.35 + customerScore * 0.15).toFixed(1),
    );
  }

  rows.sort((a, b) => b.performanceScore - a.performanceScore);
  if (rows[0]) rows[0].isTopPerformer = true;
  return rows;
}

// ──────────────────────────── Orchestrator ───────────────────────

/**
 * Compute the full analytics bundle. `allRecords` is used to build the
 * complete filter option lists (so dropdowns don't collapse as you filter),
 * while metrics are computed from the filtered subset.
 */
export function buildAnalytics(
  allRecords: SalesRecord[],
  filters: DashboardFilters,
): AnalyticsBundle {
  const filtered = applyFilters(allRecords, filters);
  const monthly = computeMonthly(filtered);

  return {
    kpis: computeKpis(filtered, monthly),
    monthly,
    daily: computeDaily(filtered),
    products: computeProducts(filtered),
    customers: computeCustomers(filtered),
    companies: computeCompanies(filtered),
    salespersons: computeSalespersons(filtered),
    filterOptions: buildFilterOptions(allRecords),
    recordCount: filtered.length,
  };
}
