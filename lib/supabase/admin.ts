import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Guard for every admin page and write action. Confirms a signed-in Supabase
 * user (the single admin; public sign-ups are disabled) and returns the
 * cookie-bound server client to use for writes — RLS lets `authenticated`
 * write, so the session itself is the authorization. Redirects to /login when
 * not signed in.
 */
export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}
