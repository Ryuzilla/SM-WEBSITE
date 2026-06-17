// Centralised, typed access to runtime configuration.

export const env = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
};

/** True when Supabase is fully configured for browser + auth usage. */
export const isSupabaseConfigured =
  env.supabaseUrl.length > 0 && env.supabaseAnonKey.length > 0;

/**
 * Whether the app should fall back to bundled sample data. This is the case
 * when Supabase isn't configured, or when explicitly requested via env.
 */
export const useSampleData =
  process.env.NEXT_PUBLIC_USE_SAMPLE_DATA === "true" || !isSupabaseConfigured;
