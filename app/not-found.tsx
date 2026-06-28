import Link from "next/link";
import { getContent } from "@/lib/content";
import { displayDateFor } from "@/lib/posts";

export default async function NotFound() {
  const { posts, profile } = await getContent();
  const recent = posts.slice(0, 3);

  return (
    <div className="root" id="top">
      <div className="notfound">
        <span className="notfound-logo metal">{profile.initials}</span>
        <h1 className="notfound-title">404 — page not found</h1>
        <p className="notfound-text">
          That link doesn’t lead anywhere. It may have moved or never existed.
        </p>
        <Link href="/" className="notfound-home">
          ← Back home
        </Link>

        {recent.length > 0 && (
          <div className="notfound-recent">
            <div className="notfound-recent-label">Recent writing</div>
            {recent.map((p) => (
              <Link key={p.slug} href={`/writing/${p.slug}`} className="notfound-post">
                <span className="notfound-post-title">{p.title}</span>
                <span className="notfound-post-date">{displayDateFor(p)}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
