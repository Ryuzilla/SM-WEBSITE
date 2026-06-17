import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { UserProfile } from "@/lib/types";

/** A demo profile used when running without Supabase configured. */
export const DEMO_PROFILE: UserProfile = {
  id: "demo-user",
  email: "demo@sm-analytics.app",
  full_name: "Demo Executive",
  role: "admin",
  salesperson_id: null,
  created_at: new Date().toISOString(),
};

/**
 * Resolve the current authenticated user's profile (including role). Returns
 * the demo profile when Supabase isn't configured so previews work end-to-end.
 */
export async function getCurrentProfile(): Promise<UserProfile | null> {
  if (!isSupabaseConfigured) return DEMO_PROFILE;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) {
    // Authenticated but no profile row yet — default to salesperson.
    return {
      id: user.id,
      email: user.email ?? "",
      full_name: user.user_metadata?.full_name ?? null,
      role: "salesperson",
      salesperson_id: null,
      created_at: user.created_at,
    };
  }

  return profile as UserProfile;
}

export function canViewAllData(role: UserProfile["role"]): boolean {
  return role === "admin" || role === "manager";
}

export function canManageData(role: UserProfile["role"]): boolean {
  return role === "admin";
}
