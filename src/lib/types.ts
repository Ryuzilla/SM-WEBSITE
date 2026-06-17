// ────────────────────────────────────────────────────────────────
// Domain types shared across the application (client + server).
// These mirror the PostgreSQL schema in /supabase/schema.sql.
// ────────────────────────────────────────────────────────────────

export type UserRole = "admin" | "manager" | "salesperson";

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  /** When role = salesperson, links to the salesperson record they own. */
  salesperson_id: string | null;
  created_at: string;
}

/** A single normalized sales line item — one row per invoice line. */
export interface SalesRecord {
  id: string;
  date: string; // ISO date (YYYY-MM-DD)
  invoice_no: string;
  customer_name: string;
  company_name: string;
  salesperson: string;
  product_code: string;
  product_name: string;
  category: string;
  quantity: number;
  unit_price: number;
  sales_amount: number;
  province: string;
}

/** The exact columns expected in an uploaded Excel sheet. */
export const REQUIRED_COLUMNS = [
  "Date",
  "Invoice_No",
  "Customer_Name",
  "Company_Name",
  "Salesperson",
  "Product_Code",
  "Product_Name",
  "Category",
  "Quantity",
  "Unit_Price",
  "Sales_Amount",
  "Province",
] as const;

export type RequiredColumn = (typeof REQUIRED_COLUMNS)[number];

// ──────────────────────────── Filters ────────────────────────────

export interface DashboardFilters {
  year: number | null;
  month: number | null; // 1-12
  quarter: number | null; // 1-4
  province: string | null;
  customer: string | null;
  company: string | null;
  category: string | null;
  product: string | null;
  salesperson: string | null;
  /** Optional explicit date range (overrides year/month/quarter when set). */
  dateFrom: string | null;
  dateTo: string | null;
}

export const EMPTY_FILTERS: DashboardFilters = {
  year: null,
  month: null,
  quarter: null,
  province: null,
  customer: null,
  company: null,
  category: null,
  product: null,
  salesperson: null,
  dateFrom: null,
  dateTo: null,
};

/** Distinct values used to populate the filter dropdowns. */
export interface FilterOptions {
  years: number[];
  provinces: string[];
  customers: string[];
  companies: string[];
  categories: string[];
  products: string[];
  salespersons: string[];
}

// ──────────────────────────── Analytics ──────────────────────────

export interface KpiSummary {
  totalRevenue: number;
  totalOrders: number;
  uniqueCustomers: number;
  uniqueCompanies: number;
  averageOrderValue: number;
  monthlyGrowthRate: number; // percentage
  dailyRevenue: number; // average revenue per active day
  targetAchievement: number; // percentage of target reached
  revenueTarget: number;
}

export interface MonthlyPoint {
  month: string; // "2024-01"
  label: string; // "Jan 2024"
  revenue: number;
  orders: number;
  /** Same month previous year, for YoY comparison. */
  previousYearRevenue: number | null;
  /** Month-over-month growth %. */
  momGrowth: number | null;
  /** Linear forecast — only populated on projected future points. */
  forecast: number | null;
}

export interface DailyPoint {
  date: string; // ISO date
  label: string; // "01 Jan"
  revenue: number;
  orders: number;
  target: number;
}

export interface DailySummary {
  points: DailyPoint[];
  bestDay: DailyPoint | null;
  worstDay: DailyPoint | null;
  averageDailyRevenue: number;
}

export interface ProductRank {
  productCode: string;
  productName: string;
  category: string;
  revenue: number;
  quantity: number;
  revenueShare: number; // percentage
}

export interface CustomerRank {
  customerName: string;
  revenue: number;
  orders: number;
  lastPurchase: string; // ISO date
}

export interface CompanyRank {
  companyName: string;
  revenue: number;
  orders: number;
  contribution: number; // percentage
}

export interface SalespersonPerformance {
  name: string;
  dailyRevenue: number; // average per active day
  monthlyRevenue: number; // average per active month
  totalRevenue: number;
  target: number;
  targetAchievement: number; // percentage
  customersManaged: number;
  performanceScore: number; // 0-100 composite score
  isTopPerformer: boolean;
}

/** Everything a dashboard page needs, computed from the filtered dataset. */
export interface AnalyticsBundle {
  kpis: KpiSummary;
  monthly: MonthlyPoint[];
  daily: DailySummary;
  products: ProductRank[];
  customers: CustomerRank[];
  companies: CompanyRank[];
  salespersons: SalespersonPerformance[];
  filterOptions: FilterOptions;
  recordCount: number;
}
