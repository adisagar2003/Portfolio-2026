import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { login } from "./actions";
import "../admin/admin.css";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  // already signed in -> go to admin
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/admin");

  return (
    <main className="admin-auth">
      <form action={login} className="admin-card admin-auth-card">
        <h1 className="admin-h1">Admin sign in</h1>
        <p className="admin-muted">Restricted — portfolio editor.</p>
        {error ? <p className="admin-error">{error}</p> : null}
        <label className="admin-label">
          Email
          <input
            className="admin-input"
            type="email"
            name="email"
            required
            autoComplete="email"
          />
        </label>
        <label className="admin-label">
          Password
          <input
            className="admin-input"
            type="password"
            name="password"
            required
            autoComplete="current-password"
          />
        </label>
        <button className="admin-btn admin-btn-primary" type="submit">
          Sign in
        </button>
      </form>
    </main>
  );
}
