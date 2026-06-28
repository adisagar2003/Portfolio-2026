import { createClient } from "@supabase/supabase-js";

/**
 * Cookie-less anon client for PUBLIC content reads (RLS allows public select).
 *
 * Using this instead of the cookie-bound server client lets the public pages
 * be statically generated / ISR-cached — `cookies()` would otherwise opt every
 * page into fully dynamic rendering and a Supabase round-trip on every request.
 */
export function createPublicClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
