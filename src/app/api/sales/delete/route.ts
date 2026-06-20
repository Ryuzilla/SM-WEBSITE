import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentProfile, canManageData } from "@/lib/auth";
import { useSampleData } from "@/lib/env";

export const runtime = "nodejs";

// Columns that may be used as a delete filter (allowlist guards against
// arbitrary column injection from the request body).
const FILTERABLE_COLUMNS = new Set([
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
 * DELETE /api/sales/delete
 * Body (optional): { ids?, dateFrom?, dateTo?, column?, value? }
 * - ids[]              → delete exactly those rows (from the browse table)
 * - No filters         → delete ALL rows
 * - dateFrom / dateTo  → restrict to an inclusive date range
 * - column + value     → restrict to rows where <column> = <value>
 * Filters combine with AND. Admin only.
 */
export async function DELETE(request: Request) {
  const profile = await getCurrentProfile();
  if (!profile)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canManageData(profile.role))
    return NextResponse.json({ error: "Forbidden — admin only" }, { status: 403 });

  if (useSampleData)
    return NextResponse.json({ deleted: 0, demo: true });

  const body = await request.json().catch(() => ({}));
  const ids: string[] | null = Array.isArray(body.ids) ? body.ids : null;
  const dateFrom: string | null = body.dateFrom ?? null;
  const dateTo: string | null = body.dateTo ?? null;
  const column: string | null = body.column ?? null;
  const value: string | null = body.value ?? null;

  const supabase = createAdminClient();

  // Delete specific rows selected in the browse table.
  if (ids && ids.length > 0) {
    const { error } = await supabase.from("sales").delete().in("id", ids);
    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ deleted: true, count: ids.length });
  }

  if (column && !FILTERABLE_COLUMNS.has(column))
    return NextResponse.json({ error: `Invalid column: ${column}` }, { status: 400 });

  let q = supabase.from("sales").delete();
  let hasFilter = false;

  if (dateFrom) { q = q.gte("date", dateFrom); hasFilter = true; }
  if (dateTo) { q = q.lte("date", dateTo); hasFilter = true; }
  if (column && value) { q = q.eq(column, value); hasFilter = true; }

  if (!hasFilter) {
    // Supabase requires at least one filter for DELETE; use a tautology.
    q = q.neq("id", "00000000-0000-0000-0000-000000000000");
  }

  const { error } = await q;
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ deleted: true });
}
