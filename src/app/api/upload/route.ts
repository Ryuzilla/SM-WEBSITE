import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentProfile, canManageData } from "@/lib/auth";
import { useSampleData } from "@/lib/env";
import { mapRowsToRecords } from "@/lib/excel-import";

export const runtime = "nodejs";

/**
 * Bulk-import validated sales rows. Admin only. The client sends already
 * parsed/validated rows (the raw spreadsheet objects); we normalise and
 * insert them server-side using the service-role client.
 */
export async function POST(request: Request) {
  const profile = await getCurrentProfile();
  if (!profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!canManageData(profile.role)) {
    return NextResponse.json(
      { error: "Forbidden — admin access required to import data." },
      { status: 403 },
    );
  }

  let body: { rows?: Record<string, unknown>[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const rows = body.rows ?? [];
  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: "No rows to import" }, { status: 400 });
  }

  const records = mapRowsToRecords(rows);

  // Demo mode: accept the upload but don't persist (no DB configured).
  if (useSampleData) {
    return NextResponse.json({
      imported: records.length,
      demo: true,
      message:
        "Demo mode: file validated and accepted, but not persisted (configure Supabase to enable real imports).",
    });
  }

  const supabase = createAdminClient();

  // Insert in chunks to stay within payload limits.
  const CHUNK = 1000;
  let imported = 0;
  for (let i = 0; i < records.length; i += CHUNK) {
    const chunk = records.slice(i, i + CHUNK);
    const { error } = await supabase.from("sales").insert(chunk);
    if (error) {
      return NextResponse.json(
        {
          error: `Import failed at row ${i + 1}: ${error.message}`,
          imported,
        },
        { status: 500 },
      );
    }
    imported += chunk.length;
  }

  return NextResponse.json({ imported, demo: false });
}
