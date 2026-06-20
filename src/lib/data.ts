import { createClient } from "@/lib/supabase/server";
import { useSampleData } from "@/lib/env";
import { generateSampleData } from "@/lib/sample-data";
import { SalesRecord, UserProfile } from "@/lib/types";

/**
 * Load the sales dataset visible to the given user.
 *
 * - Demo mode → bundled sample data.
 * - Supabase → reads the `sales` table. Row Level Security enforces that
 *   salespersons only see their own rows; admins/managers see everything.
 *   We additionally scope by name for salespersons as a defensive measure.
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

  const supabase = await createClient();

  // Supabase/PostgREST caps a single response (default 1000 rows), so we page
  // through the table with .range() until every row is fetched — otherwise the
  // dashboard would only ever see the first slice of a large dataset.
  const PAGE = 1000;
  const all: SalesRecord[] = [];
  for (let from = 0; ; from += PAGE) {
    let query = supabase
      .from("sales")
      .select(
        "id, date, invoice_no, customer_name, company_name, salesperson, product_code, product_name, category, quantity, unit_price, sales_amount, province",
      )
      .order("date", { ascending: true })
      .range(from, from + PAGE - 1);

    if (profile.role === "salesperson" && profile.full_name) {
      query = query.eq("salesperson", profile.full_name);
    }

    const { data, error } = await query;
    if (error) {
      console.error("Failed to load sales records:", error.message);
      break;
    }
    const batch = (data ?? []) as SalesRecord[];
    all.push(...batch);
    if (batch.length < PAGE) break; // last page reached
  }

  return all;
}
