import Link from "next/link";
import { requireAdmin } from "@/lib/supabase/admin";
import { signOut } from "./actions";
import "./admin.css";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await requireAdmin();

  return (
    <div className="admin">
      <header className="admin-bar">
        <div className="admin-bar-inner">
          <strong className="admin-brand">Portfolio admin</strong>
          <div className="admin-bar-right">
            <Link href="/" className="admin-link" target="_blank">
              View site ↗
            </Link>
            <span className="admin-muted admin-email">{user.email}</span>
            <form action={signOut}>
              <button className="admin-btn" type="submit">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="admin-main">{children}</main>
    </div>
  );
}
