import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentProfile, canManageData } from "@/lib/auth";
import { useSampleData } from "@/lib/env";

export const runtime = "nodejs";

const PAGE_SIZE = 50;

// Columns that may be searched (allowlist guards against injection).
const SEARCHABLE_COLUMNS = new Set([
  "salesperson",
  "customer_name",
  "company_name",
  "category",
  "product_code",
  "product_name",
  "province",
  "invoice_no",
]);

/**
 * GET /api/sales/list?page=0&column=salesperson&value=B3
 * Returns a paginated slice of sales rows for the browse-and-delete table.
 * Admin only.
 */
export async function GET(request: Request) {
  const profile = await getCurrentProfile();
  if (!profile)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canManageData(profile.role))
    return NextResponse.json({ error: "Forbidden — admin only" }, { status: 403 });

  if (useSampleData)
    return NextResponse.json({ rows: [], total: 0, demo: true });

  const url = new URL(request.url);
  const page = Math.max(0, parseInt(url.searchParams.get("page") ?? "0") || 0);
  const column = url.searchParams.get("column");
  const value = url.searchParams.get("value");

  const supabase = createAdminClient();
  let q = supabase
    .from("sales")
    .select(
      "id,date,invoice_no,customer_name,company_name,salesperson,product_code,product_name,category,quantity,unit_price,sales_amount,province",
      { count: "exact" },
    );

  if (column && value && SEARCHABLE_COLUMNS.has(column)) {
    q = q.ilike(column, `%${value}%`);
  }

  const from = page * PAGE_SIZE;
  const { data, error, count } = await q
    .order("date", { ascending: false })
    .range(from, from + PAGE_SIZE - 1);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    rows: data ?? [],
    total: count ?? 0,
    pageSize: PAGE_SIZE,
  });
}
