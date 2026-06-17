import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

/**
 * Server-side Supabase client bound to the request cookies. Use in Server
 * Components, Route Handlers and Server Actions for user-scoped queries
 * (respects Row Level Security).
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Called from a Server Component — safe to ignore; middleware
          // refreshes the session cookie on navigation.
        }
      },
    },
  });
}

/**
 * Privileged client using the service-role key. NEVER import this into a
 * client component — server-only (API routes / server actions) for bulk
 * imports and admin tasks. Bypasses RLS.
 */
export function createAdminClient() {
  if (!env.supabaseServiceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured");
  }
  return createSupabaseClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
