import { createClient } from "@/lib/supabase/server";
import { useSampleData } from "@/lib/env";
import { generateSampleData } from "@/lib/sample-data";
import { SalesRecord, UserProfile } from "@/lib/types";

const SALES_COLUMNS =
  "id, date, invoice_no, customer_name, company_name, salesperson, product_code, product_name, category, quantity, unit_price, sales_amount, province";

// In-memory cache (per warm server instance). Avoids re-fetching the whole
// table on every dashboard navigation. Keyed by the access scope so a
// salesperson's narrowed view never leaks into the shared admin/manager set.
const CACHE_TTL_MS = 60_000;
type CacheEntry = { data: SalesRecord[]; expires: number };
const salesCache = new Map<string, CacheEntry>();

/**
 * Load the sales dataset visible to the given user.
 *
 * - Demo mode → bundled sample data.
 * - Supabase → reads the `sales` table. Row Level Security enforces that
 *   salespersons only see their own rows; admins/managers see everything.
 */
export async function getSalesRecords(
  profile: UserProfile,
): Promise<SalesRecord[]> {
  if (useSampleData) {
    const all = generateSampleData();
    if (profile.role === "salesperson" && profile.full_name) {
      return all.filter((r) => r.salesperson === profile.full_name);
    }
    return all;
  }

  const scopeKey =
    profile.role === "salesperson" && profile.full_name
      ? `sp:${profile.full_name}`
      : "all";

  const cached = salesCache.get(scopeKey);
  if (cached && cached.expires > Date.now()) return cached.data;

  const supabase = await createClient();

  // Count first so we can fetch every 1000-row page in parallel (PostgREST
  // caps a single response at 1000 rows). Parallel fetch turns ~54 sequential
  // round-trips into one batch — the main source of the slow first paint.
  let countQuery = supabase
    .from("sales")
    .select("id", { count: "exact", head: true });
  if (profile.role === "salesperson" && profile.full_name) {
    countQuery = countQuery.eq("salesperson", profile.full_name);
  }
  const { count, error: countError } = await countQuery;
  if (countError) {
    console.error("Failed to count sales records:", countError.message);
    return [];
  }

  const total = count ?? 0;
  const PAGE = 1000;
  const pages = Math.ceil(total / PAGE);

  const requests = Array.from({ length: pages }, (_, i) => {
    let q = supabase
      .from("sales")
      .select(SALES_COLUMNS)
      .order("date", { ascending: true })
      .range(i * PAGE, i * PAGE + PAGE - 1);
    if (profile.role === "salesperson" && profile.full_name) {
      q = q.eq("salesperson", profile.full_name);
    }
    return q;
  });

  const results = await Promise.all(requests);
  const all: SalesRecord[] = [];
  for (const { data, error } of results) {
    if (error) {
      console.error("Failed to load sales records:", error.message);
      continue;
    }
    all.push(...((data ?? []) as SalesRecord[]));
  }

  salesCache.set(scopeKey, { data: all, expires: Date.now() + CACHE_TTL_MS });
  return all;
}

/** Clear the in-memory sales cache (call after an import or delete). */
export function invalidateSalesCache() {
  salesCache.clear();
}
