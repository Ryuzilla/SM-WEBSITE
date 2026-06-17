"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentProfile, canManageData } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/env";
import { UserRole } from "@/lib/types";

export async function updateUserRole(userId: string, role: UserRole) {
  const profile = await getCurrentProfile();
  if (!profile || !canManageData(profile.role)) {
    return { error: "Forbidden" };
  }
  if (!isSupabaseConfigured) {
    return { error: undefined, demo: true };
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", userId);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/users");
  return { error: undefined };
}
