import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentProfile, canManageData } from "@/lib/auth";
import { useSampleData } from "@/lib/env";

export const runtime = "nodejs";

/**
 * DELETE /api/sales/delete
 * Body (optional): { dateFrom?: string; dateTo?: string }
 * - No body / both empty → delete ALL rows
 * - dateFrom + dateTo    → delete rows in that inclusive date range
 * Admin only.
 */
export async function DELETE(request: Request) {
  const profile = await getCurrentProfile();
  if (!profile)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canManageData(profile.role))
    return NextResponse.json({ error: "Forbidden — admin only" }, { status: 403 });

  if (useSampleData)
    return NextResponse.json({ deleted: 0, demo: true });

  let dateFrom: string | null = null;
  let dateTo: string | null = null;
  try {
    const body = await request.json().catch(() => ({}));
    dateFrom = body.dateFrom ?? null;
    dateTo = body.dateTo ?? null;
  } catch { /* no body — delete all */ }

  const supabase = createAdminClient();
  let q = supabase.from("sales").delete();

  if (dateFrom && dateTo) {
    q = q.gte("date", dateFrom).lte("date", dateTo);
  } else if (dateFrom) {
    q = q.gte("date", dateFrom);
  } else if (dateTo) {
    q = q.lte("date", dateTo);
  } else {
    // Supabase requires at least one filter for DELETE; use a tautology.
    q = q.neq("id", "00000000-0000-0000-0000-000000000000");
  }

  const { error } = await q;
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ deleted: true });
}
