"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/supabase/admin";

// ---- helpers ---------------------------------------------------------------
function str(fd: FormData, name: string): string {
  return String(fd.get(name) ?? "").trim();
}
function strOrNull(fd: FormData, name: string): string | null {
  const v = str(fd, name);
  return v === "" ? null : v;
}
function bool(fd: FormData, name: string): boolean {
  return fd.get(name) === "on" || fd.get(name) === "true";
}
function int(fd: FormData, name: string): number {
  const n = parseInt(str(fd, name), 10);
  return Number.isFinite(n) ? n : 0;
}
/** Parse a JSON form field; throws a readable error so the action can report it. */
function json(fd: FormData, name: string): unknown {
  const raw = str(fd, name);
  if (raw === "") return name === "company" ? null : [];
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error(`Invalid JSON in "${name}"`);
  }
}

function done(error: string | null, ok: string) {
  revalidatePath("/");
  revalidatePath("/admin");
  redirect(error ? `/admin?error=${encodeURIComponent(error)}` : `/admin?ok=${ok}`);
}

// ---- site ------------------------------------------------------------------
export async function updateSite(fd: FormData) {
  const { supabase } = await requireAdmin();
  let err: string | null = null;
  try {
    const { error } = await supabase
      .from("site")
      .update({
        title: str(fd, "title"),
        description: str(fd, "description"),
        url: str(fd, "url"),
        footer_left: str(fd, "footer_left"),
        footer_right: str(fd, "footer_right"),
      })
      .eq("id", 1);
    if (error) err = error.message;
  } catch (e) {
    err = (e as Error).message;
  }
  done(err, "site");
}

// ---- profile ---------------------------------------------------------------
export async function updateProfile(fd: FormData) {
  const { supabase } = await requireAdmin();
  let err: string | null = null;
  try {
    const { error } = await supabase
      .from("profile")
      .update({
        initials: str(fd, "initials"),
        name: str(fd, "name"),
        role: str(fd, "role"),
        company: json(fd, "company"),
        location: str(fd, "location"),
        bio: str(fd, "bio"),
        avatar_url: str(fd, "avatar_url"),
        github_username: str(fd, "github_username"),
        socials: json(fd, "socials"),
      })
      .eq("id", 1);
    if (error) err = error.message;
  } catch (e) {
    err = (e as Error).message;
  }
  done(err, "profile");
}

// ---- contact ---------------------------------------------------------------
export async function updateContact(fd: FormData) {
  const { supabase } = await requireAdmin();
  let err: string | null = null;
  try {
    const { error } = await supabase
      .from("contact")
      .update({
        heading: str(fd, "heading"),
        body: str(fd, "body"),
        socials: json(fd, "socials"),
      })
      .eq("id", 1);
    if (error) err = error.message;
  } catch (e) {
    err = (e as Error).message;
  }
  done(err, "contact");
}

// ---- posts -----------------------------------------------------------------
export async function upsertPost(fd: FormData) {
  const { supabase } = await requireAdmin();
  let err: string | null = null;
  try {
    const slug = str(fd, "slug");
    if (!slug) throw new Error("slug is required");
    const { error } = await supabase.from("posts").upsert(
      {
        slug,
        date: str(fd, "date"),
        title: str(fd, "title"),
        excerpt: str(fd, "excerpt"),
        meta: str(fd, "meta"),
        body_md: str(fd, "body"),
        cover_url: strOrNull(fd, "cover_url"),
        sort_order: int(fd, "sort_order"),
        published: bool(fd, "published"),
      },
      { onConflict: "slug" },
    );
    if (error) err = error.message;
  } catch (e) {
    err = (e as Error).message;
  }
  done(err, "post");
}

export async function deletePost(fd: FormData) {
  const { supabase } = await requireAdmin();
  let err: string | null = null;
  const { error } = await supabase.from("posts").delete().eq("slug", str(fd, "slug"));
  if (error) err = error.message;
  done(err, "post-deleted");
}

// ---- sections --------------------------------------------------------------
export async function updateSection(fd: FormData) {
  const { supabase } = await requireAdmin();
  let err: string | null = null;
  const { error } = await supabase
    .from("sections")
    .update({
      index: str(fd, "index"),
      label: str(fd, "label"),
      sort_order: int(fd, "sort_order"),
    })
    .eq("id", str(fd, "id"));
  if (error) err = error.message;
  done(err, "section");
}

// ---- section entries -------------------------------------------------------
export async function upsertEntry(fd: FormData) {
  const { supabase } = await requireAdmin();
  let err: string | null = null;
  try {
    const id = strOrNull(fd, "id"); // empty -> insert
    const row = {
      section_id: str(fd, "section_id"),
      period: str(fd, "period"),
      title: str(fd, "title"),
      href: strOrNull(fd, "href"),
      subtitle: str(fd, "subtitle"),
      active: bool(fd, "active"),
      description: strOrNull(fd, "description"),
      tags: json(fd, "tags"),
      bullets: json(fd, "bullets"),
      sort_order: int(fd, "sort_order"),
    };
    const { error } = id
      ? await supabase.from("section_entries").update(row).eq("id", id)
      : await supabase.from("section_entries").insert(row);
    if (error) err = error.message;
  } catch (e) {
    err = (e as Error).message;
  }
  done(err, "entry");
}

export async function deleteEntry(fd: FormData) {
  const { supabase } = await requireAdmin();
  let err: string | null = null;
  const { error } = await supabase
    .from("section_entries")
    .delete()
    .eq("id", str(fd, "id"));
  if (error) err = error.message;
  done(err, "entry-deleted");
}

// ---- auth ------------------------------------------------------------------
export async function signOut() {
  const { supabase } = await requireAdmin();
  await supabase.auth.signOut();
  redirect("/login");
}
