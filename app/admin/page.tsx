import { requireAdmin } from "@/lib/supabase/admin";
import PostList from "@/components/admin/PostList";
import {
  updateSite,
  updateProfile,
  updateContact,
  upsertPost,
  deletePost,
  reorderPost,
  togglePublished,
  updateSection,
  upsertEntry,
  deleteEntry,
} from "./actions";

export const dynamic = "force-dynamic";

// pretty-print a JSONB value for a textarea
function j(v: unknown): string {
  if (v == null) return "";
  return JSON.stringify(v, null, 2);
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const { ok, error } = await searchParams;
  const { supabase } = await requireAdmin();

  const [site, profile, contact, posts, sections, entries] = await Promise.all([
    supabase.from("site").select("*").eq("id", 1).single(),
    supabase.from("profile").select("*").eq("id", 1).single(),
    supabase.from("contact").select("*").eq("id", 1).single(),
    supabase.from("posts").select("*").order("sort_order"),
    supabase.from("sections").select("*").order("sort_order"),
    supabase.from("section_entries").select("*").order("sort_order"),
  ]);

  const s = site.data ?? {};
  const p = profile.data ?? {};
  const c = contact.data ?? {};
  const postRows = posts.data ?? [];
  const sectionRows = sections.data ?? [];
  const entryRows = entries.data ?? [];

  return (
    <div className="admin-page">
      {ok ? <div className="admin-banner admin-ok">Saved: {ok}</div> : null}
      {error ? <div className="admin-banner admin-error">{error}</div> : null}

      {/* SITE -------------------------------------------------------------- */}
      <section className="admin-card">
        <h2 className="admin-h2">Site</h2>
        <form action={updateSite} className="admin-form">
          <Field label="Title" name="title" defaultValue={s.title} />
          <Area label="Description" name="description" defaultValue={s.description} />
          <Field label="URL" name="url" defaultValue={s.url} />
          <Field label="Footer left" name="footer_left" defaultValue={s.footer_left} />
          <Field label="Footer right" name="footer_right" defaultValue={s.footer_right} />
          <Save />
        </form>
      </section>

      {/* PROFILE ----------------------------------------------------------- */}
      <section className="admin-card">
        <h2 className="admin-h2">Profile</h2>
        <form action={updateProfile} className="admin-form">
          <div className="admin-grid">
            <Field label="Initials" name="initials" defaultValue={p.initials} />
            <Field label="Name" name="name" defaultValue={p.name} />
            <Field label="Role" name="role" defaultValue={p.role} />
            <Field label="Location" name="location" defaultValue={p.location} />
            <Field label="GitHub username" name="github_username" defaultValue={p.github_username} />
            <Field label="Avatar URL" name="avatar_url" defaultValue={p.avatar_url} />
          </div>
          <Area label="Bio" name="bio" defaultValue={p.bio} />
          <Area label="Company (JSON: {name, href})" name="company" defaultValue={j(p.company)} mono />
          <Area label="Socials (JSON array)" name="socials" defaultValue={j(p.socials)} mono />
          <Save />
        </form>
      </section>

      {/* CONTACT ----------------------------------------------------------- */}
      <section className="admin-card">
        <h2 className="admin-h2">Contact</h2>
        <form action={updateContact} className="admin-form">
          <Field label="Heading" name="heading" defaultValue={c.heading} />
          <Area label="Body" name="body" defaultValue={c.body} />
          <Area label="Socials (JSON array)" name="socials" defaultValue={j(c.socials)} mono />
          <Save />
        </form>
      </section>

      {/* POSTS ------------------------------------------------------------- */}
      <section className="admin-card">
        <PostList
          upsertPost={upsertPost}
          deletePost={deletePost}
          reorderPost={reorderPost}
          togglePublished={togglePublished}
          posts={postRows.map((post) => ({
            slug: post.slug,
            date: post.date,
            title: post.title,
            excerpt: post.excerpt,
            meta: post.meta,
            body: post.body_md ?? "",
            cover_url: post.cover_url ?? null,
            sort_order: post.sort_order,
            published: post.published,
          }))}
        />
      </section>

      {/* SECTIONS + ENTRIES ------------------------------------------------ */}
      {sectionRows.map((section) => {
        const own = entryRows.filter((e) => e.section_id === section.id);
        return (
          <section key={section.id} className="admin-card">
            <h2 className="admin-h2">
              Section: {section.label} <code>({section.id})</code>
            </h2>
            <form action={updateSection} className="admin-form admin-subcard">
              <input type="hidden" name="id" value={section.id} />
              <div className="admin-grid">
                <Field label="Index" name="index" defaultValue={section.index} />
                <Field label="Label" name="label" defaultValue={section.label} />
                <Field label="Sort order" name="sort_order" type="number" defaultValue={String(section.sort_order)} />
              </div>
              <Save label="Save section" />
            </form>

            {own.map((e) => (
              <form key={e.id} action={upsertEntry} className="admin-form admin-subcard">
                <input type="hidden" name="id" value={e.id} />
                <input type="hidden" name="section_id" value={section.id} />
                <div className="admin-grid">
                  <Field label="Period" name="period" defaultValue={e.period} />
                  <Field label="Title" name="title" defaultValue={e.title} />
                  <Field label="Href" name="href" defaultValue={e.href ?? ""} />
                  <Field label="Subtitle" name="subtitle" defaultValue={e.subtitle} />
                  <Field label="Sort order" name="sort_order" type="number" defaultValue={String(e.sort_order)} />
                  <Check label="Active dot" name="active" defaultChecked={e.active} />
                </div>
                <Area label="Description" name="description" defaultValue={e.description ?? ""} />
                <Area label="Tags (JSON: [{label, highlight?}])" name="tags" defaultValue={j(e.tags)} mono />
                <Area label="Bullets (JSON: [{lead, text}])" name="bullets" defaultValue={j(e.bullets)} mono />
                <div className="admin-actions">
                  <Save />
                  <ConfirmDelete action={deleteEntry} idName="id" idValue={e.id} />
                </div>
              </form>
            ))}

            <details className="admin-subcard">
              <summary className="admin-summary">+ New entry in {section.label}</summary>
              <form action={upsertEntry} className="admin-form">
                <input type="hidden" name="section_id" value={section.id} />
                <div className="admin-grid">
                  <Field label="Period" name="period" />
                  <Field label="Title" name="title" />
                  <Field label="Href" name="href" />
                  <Field label="Subtitle" name="subtitle" />
                  <Field label="Sort order" name="sort_order" type="number" defaultValue="0" />
                  <Check label="Active dot" name="active" />
                </div>
                <Area label="Description" name="description" />
                <Area label="Tags (JSON)" name="tags" defaultValue="[]" mono />
                <Area label="Bullets (JSON)" name="bullets" defaultValue="[]" mono />
                <Save label="Create entry" />
              </form>
            </details>
          </section>
        );
      })}
    </div>
  );
}

// ---- small server-rendered form bits --------------------------------------
function Field({
  label,
  name,
  defaultValue,
  placeholder,
  type = "text",
}: {
  label: string;
  name: string;
  defaultValue?: string;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="admin-label">
      {label}
      <input
        className="admin-input"
        type={type}
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
      />
    </label>
  );
}

function Area({
  label,
  name,
  defaultValue,
  mono = false,
  rows,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  mono?: boolean;
  rows?: number;
}) {
  return (
    <label className="admin-label">
      {label}
      <textarea
        className={mono ? "admin-input admin-mono" : "admin-input"}
        name={name}
        defaultValue={defaultValue}
        rows={rows ?? (mono ? 6 : 3)}
      />
    </label>
  );
}

function Check({
  label,
  name,
  defaultChecked = false,
}: {
  label: string;
  name: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="admin-check">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} />
      {label}
    </label>
  );
}

function Save({ label = "Save" }: { label?: string }) {
  return (
    <button className="admin-btn admin-btn-primary" type="submit">
      {label}
    </button>
  );
}

// delete posts to its own form so it doesn't submit the edit form
function ConfirmDelete({
  action,
  idName,
  idValue,
}: {
  action: (fd: FormData) => void;
  idName: string;
  idValue: string;
}) {
  return (
    <button className="admin-btn admin-btn-danger" type="submit" formAction={action} name={idName} value={idValue}>
      Delete
    </button>
  );
}
