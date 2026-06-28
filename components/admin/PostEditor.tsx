"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import Markdown from "@/components/Markdown";
import { createClient } from "@/lib/supabase/client";
import {
  slugify,
  buildMeta,
  autoExcerpt,
  readTime,
  wordCount,
} from "@/lib/post-utils";

export interface PostInitial {
  slug?: string;
  date?: string;
  title?: string;
  excerpt?: string;
  meta?: string;
  body?: string;
  cover_url?: string | null;
  sort_order?: number;
  published?: boolean;
}

type View = "write" | "split" | "preview";

const BUCKET = "blog-images";

export default function PostEditor({
  action,
  initial = {},
  isNew = false,
  takenSlugs = [],
}: {
  action: (fd: FormData) => void;
  initial?: PostInitial;
  isNew?: boolean;
  /** slugs already in use by OTHER posts — used to block accidental overwrite */
  takenSlugs?: string[];
}) {
  const taRef = useRef<HTMLTextAreaElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [full, setFull] = useState(false);
  const [help, setHelp] = useState(false);

  const [title, setTitle] = useState(initial.title ?? "");
  const [slug, setSlug] = useState(initial.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(!isNew && !!initial.slug);
  const [date, setDate] = useState(initial.date ?? todayDisplay());
  const [excerpt, setExcerpt] = useState(initial.excerpt ?? "");
  const [sortOrder, setSortOrder] = useState(String(initial.sort_order ?? 0));
  const [cover, setCover] = useState(initial.cover_url ?? "");
  const [coverBusy, setCoverBusy] = useState(false);
  const [body, setBody] = useState(initial.body ?? "");
  const [view, setView] = useState<View>("split");
  const [uploading, setUploading] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // image library
  const [libOpen, setLibOpen] = useState(false);
  const [lib, setLib] = useState<{ name: string; url: string }[] | null>(null);
  const [libBusy, setLibBusy] = useState(false);

  // draft autosave
  const draftKey = `pe-draft:${initial.slug ?? "__new__"}`;
  const [restored, setRestored] = useState<null | "available" | "dismissed">(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const meta = buildMeta(date, body);
  const slugTaken = takenSlugs.includes(slug.trim());
  const blocked = !slug.trim() || slugTaken;

  // On mount: offer to restore a newer local draft than what's in the DB.
  // Skip when a template was loaded into a new post — that content is the
  // intended starting point, not a stale draft to restore over.
  useEffect(() => {
    if (isNew && (initial.title || initial.body)) return;
    try {
      const raw = localStorage.getItem(draftKey);
      if (!raw) return;
      const d = JSON.parse(raw) as { body?: string };
      if (d.body && d.body !== (initial.body ?? "")) setRestored("available");
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Autosave the working draft (debounced) so a reload never loses writing.
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        localStorage.setItem(
          draftKey,
          JSON.stringify({ title, slug, date, excerpt, body, sortOrder }),
        );
        setSavedAt(new Date().toLocaleTimeString());
      } catch {
        /* quota / private mode — ignore */
      }
    }, 800);
    return () => clearTimeout(t);
  }, [draftKey, title, slug, date, excerpt, body, sortOrder]);

  function restoreDraft() {
    try {
      const d = JSON.parse(localStorage.getItem(draftKey) || "{}");
      if (d.title != null) setTitle(d.title);
      if (d.slug != null) {
        setSlug(d.slug);
        setSlugTouched(true);
      }
      if (d.date != null) setDate(d.date);
      if (d.excerpt != null) setExcerpt(d.excerpt);
      if (d.body != null) setBody(d.body);
      if (d.sortOrder != null) setSortOrder(d.sortOrder);
    } catch {
      /* ignore */
    }
    setRestored("dismissed");
  }
  function clearDraft() {
    try {
      localStorage.removeItem(draftKey);
    } catch {
      /* ignore */
    }
    setRestored("dismissed");
  }

  // Warn before leaving with unsaved edits.
  const dirty =
    title !== (initial.title ?? "") ||
    body !== (initial.body ?? "") ||
    excerpt !== (initial.excerpt ?? "") ||
    slug !== (initial.slug ?? "") ||
    date !== (initial.date ?? todayDisplay()) ||
    sortOrder !== String(initial.sort_order ?? 0) ||
    cover !== (initial.cover_url ?? "");
  const savingRef = useRef(false);
  useEffect(() => {
    const h = (e: BeforeUnloadEvent) => {
      if (dirty && !savingRef.current) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  // Esc exits fullscreen
  useEffect(() => {
    if (!full) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFull(false);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [full]);

  async function deleteImage(name: string) {
    try {
      const supabase = createClient();
      await supabase.storage.from(BUCKET).remove([name]);
      setLib((cur) => (cur ? cur.filter((i) => i.name !== name) : cur));
    } catch {
      /* ignore */
    }
  }

  // ---- image library: list existing uploads for reuse ----------------------
  async function openLibrary() {
    setLibOpen(true);
    if (lib) return;
    setLibBusy(true);
    try {
      const supabase = createClient();
      const out: { name: string; url: string }[] = [];
      // list bucket root folders (per-slug) then their files
      const { data: folders } = await supabase.storage.from(BUCKET).list("", {
        limit: 100,
        sortBy: { column: "created_at", order: "desc" },
      });
      for (const f of folders ?? []) {
        if (f.id) {
          // a file at root
          const { data } = supabase.storage.from(BUCKET).getPublicUrl(f.name);
          out.push({ name: f.name, url: data.publicUrl });
        } else {
          const { data: files } = await supabase.storage
            .from(BUCKET)
            .list(f.name, { limit: 100, sortBy: { column: "created_at", order: "desc" } });
          for (const file of files ?? []) {
            const path = `${f.name}/${file.name}`;
            const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
            out.push({ name: path, url: data.publicUrl });
          }
        }
      }
      setLib(out);
    } catch {
      setLib([]);
    } finally {
      setLibBusy(false);
    }
  }

  // ---- title -> slug auto-derive (until slug manually edited) --------------
  function onTitle(v: string) {
    setTitle(v);
    if (!slugTouched) setSlug(slugify(v));
  }

  // ---- selection wrapping --------------------------------------------------
  const applyWrap = useCallback(
    (prefix: string, suffix = "", placeholder = "") => {
      const el = taRef.current;
      if (!el) return;
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const sel = body.slice(start, end) || placeholder;
      const next = body.slice(0, start) + prefix + sel + suffix + body.slice(end);
      setBody(next);
      requestAnimationFrame(() => {
        el.focus();
        el.setSelectionRange(start + prefix.length, start + prefix.length + sel.length);
      });
    },
    [body],
  );

  const applyLinePrefix = useCallback(
    (token: string) => {
      const el = taRef.current;
      if (!el) return;
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const lineStart = body.lastIndexOf("\n", start - 1) + 1;
      const block = body.slice(lineStart, end);
      const prefixed = block
        .split("\n")
        .map((l) => (l.startsWith(token) ? l : token + l))
        .join("\n");
      const next = body.slice(0, lineStart) + prefixed + body.slice(end);
      setBody(next);
      requestAnimationFrame(() => {
        el.focus();
        el.setSelectionRange(lineStart, lineStart + prefixed.length);
      });
    },
    [body],
  );

  // insert text at cursor (used by toolbar table, library, image upload).
  // `replace` swaps a placeholder in place (keeps caret where it is); a plain
  // insert drops text at the caret and then moves the caret past it.
  const insertAtCursor = useCallback((text: string, replace?: string) => {
    const el = taRef.current;
    if (replace) {
      setBody((prev) => (prev.includes(replace) ? prev.replace(replace, text) : prev));
      return;
    }
    const start = el ? el.selectionStart : null;
    setBody((prev) => {
      if (start == null) return prev + text;
      return prev.slice(0, start) + text + prev.slice(start);
    });
    if (el && start != null) {
      requestAnimationFrame(() => {
        el.focus();
        el.setSelectionRange(start + text.length, start + text.length);
      });
    }
  }, []);

  // ---- image upload --------------------------------------------------------
  const uploadImage = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) return;
      // unique token so concurrent/same-named uploads never swap into the
      // wrong slot (String.replace would otherwise hit the first match).
      const token = `![uploading ${file.name}…](#upload-${rand()}${rand()})`;
      insertAtCursor(token);
      setUploading(true);
      try {
        const supabase = createClient();
        const ext = file.name.split(".").pop() || "png";
        const safe = (slug || slugify(title) || "post").slice(0, 40);
        const path = `${safe}/${stamp()}-${rand()}.${ext}`;
        const { error } = await supabase.storage
          .from(BUCKET)
          .upload(path, file, { cacheControl: "31536000", upsert: false });
        if (error) throw error;
        const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
        const alt = file.name.replace(/\.[^.]+$/, "");
        insertAtCursor(`![${alt}](${data.publicUrl})`, token);
      } catch (e) {
        insertAtCursor(`<!-- upload failed: ${(e as Error).message} -->`, token);
      } finally {
        setUploading(false);
      }
    },
    [insertAtCursor, slug, title],
  );

  function onPickFiles(files: FileList | null) {
    if (!files) return;
    Array.from(files).forEach(uploadImage);
  }

  async function uploadCover(file: File | undefined) {
    if (!file || !file.type.startsWith("image/")) return;
    setCoverBusy(true);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop() || "png";
      const safe = (slug || slugify(title) || "post").slice(0, 40);
      const path = `${safe}/cover-${stamp()}-${rand()}.${ext}`;
      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { cacheControl: "31536000", upsert: false });
      if (error) throw error;
      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
      setCover(data.publicUrl);
    } catch {
      /* ignore */
    } finally {
      setCoverBusy(false);
    }
  }

  function onPaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    const imgs = Array.from(e.clipboardData.files).filter((f) =>
      f.type.startsWith("image/"),
    );
    if (imgs.length) {
      e.preventDefault();
      imgs.forEach(uploadImage);
      return;
    }
    // Paste a URL while text is selected -> wrap the selection as a link.
    const el = taRef.current;
    const pasted = e.clipboardData.getData("text/plain").trim();
    if (el && el.selectionStart !== el.selectionEnd && isUrl(pasted)) {
      e.preventDefault();
      applyWrap("[", `](${pasted})`);
    }
  }

  function onDrop(e: React.DragEvent<HTMLTextAreaElement>) {
    const imgs = Array.from(e.dataTransfer.files).filter((f) =>
      f.type.startsWith("image/"),
    );
    if (imgs.length) {
      e.preventDefault();
      imgs.forEach(uploadImage);
    }
  }

  // ---- keyboard shortcuts --------------------------------------------------
  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Tab") {
      // indent instead of leaving the textarea
      e.preventDefault();
      const el = e.currentTarget;
      const start = el.selectionStart;
      const next = body.slice(0, start) + "  " + body.slice(el.selectionEnd);
      setBody(next);
      requestAnimationFrame(() => {
        el.focus();
        el.setSelectionRange(start + 2, start + 2);
      });
      return;
    }
    if (e.key === "Enter" && !e.shiftKey && !e.metaKey && !e.ctrlKey) {
      // smart list continuation: continue "- ", "* ", or "N. " items;
      // pressing Enter on an empty item exits the list.
      const el = e.currentTarget;
      if (el.selectionStart !== el.selectionEnd) return;
      const pos = el.selectionStart;
      const lineStart = body.lastIndexOf("\n", pos - 1) + 1;
      const line = body.slice(lineStart, pos);
      const m = line.match(/^(\s*)([-*]|\d+\.)\s+(.*)$/);
      if (!m) return;
      const [, indent, marker, content] = m;
      if (content.trim() === "") {
        // empty item -> remove the marker and break out of the list
        e.preventDefault();
        const next = body.slice(0, lineStart) + indent + body.slice(pos);
        setBody(next);
        const caret = lineStart + indent.length;
        requestAnimationFrame(() => {
          el.focus();
          el.setSelectionRange(caret, caret);
        });
        return;
      }
      e.preventDefault();
      const nextMarker = /^\d+\.$/.test(marker)
        ? `${parseInt(marker, 10) + 1}.`
        : marker;
      const insert = `\n${indent}${nextMarker} `;
      const next = body.slice(0, pos) + insert + body.slice(pos);
      setBody(next);
      const caret = pos + insert.length;
      requestAnimationFrame(() => {
        el.focus();
        el.setSelectionRange(caret, caret);
      });
      return;
    }
    if (!(e.metaKey || e.ctrlKey)) return;
    const k = e.key.toLowerCase();
    if (k === "s") {
      e.preventDefault();
      if (blocked) return;
      savingRef.current = true; // suppress the unsaved-changes prompt on save
      formRef.current?.requestSubmit();
    } else if (k === "b") {
      e.preventDefault();
      applyWrap("**", "**", "bold");
    } else if (k === "i") {
      e.preventDefault();
      applyWrap("_", "_", "italic");
    } else if (k === "k") {
      e.preventDefault();
      applyWrap("[", "](https://)", "text");
    }
  }

  const words = wordCount(body);

  return (
    <form ref={formRef} action={action} className={full ? "pe pe-full" : "pe"}>
      {/* hidden mirrors so these submit even when the settings panel is closed */}
      <input type="hidden" name="meta" value={meta} />
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="date" value={date} />
      <input type="hidden" name="sort_order" value={sortOrder} />
      <input type="hidden" name="cover_url" value={cover} />

      {/* top bar */}
      <div className="pe-top">
        <input
          className="pe-title"
          name="title"
          value={title}
          onChange={(e) => onTitle(e.target.value)}
          placeholder="Post title"
          autoComplete="off"
        />
        <div className="pe-top-actions">
          <label className="pe-pub">
            <input
              type="checkbox"
              name="published"
              defaultChecked={initial.published ?? true}
            />
            Published
          </label>
          <button
            className="pe-save"
            type="submit"
            disabled={blocked}
            title={
              !slug.trim()
                ? "Add a slug first"
                : slugTaken
                  ? "That slug is already used by another post"
                  : ""
            }
            onClick={() => {
              savingRef.current = true; // suppress unsaved-changes prompt
            }}
          >
            {isNew ? "Create post" : "Save"}
            {dirty ? " •" : ""}
          </button>
        </div>
      </div>

      {/* unsaved-draft restore banner */}
      {restored === "available" && (
        <div className="pe-restore">
          A more recent local draft was found.
          <button type="button" className="pe-mini" onClick={restoreDraft}>
            Restore it
          </button>
          <button type="button" className="pe-mini" onClick={clearDraft}>
            Discard
          </button>
        </div>
      )}

      {/* settings row (slug / date / sort) */}
      <button
        type="button"
        className="pe-settings-toggle"
        onClick={() => setSettingsOpen((o) => !o)}
      >
        {settingsOpen ? "▾" : "▸"} Post settings —{" "}
        <code>{slug || "no-slug"}</code> · {meta}
      </button>
      {slugTaken && (
        <div className="pe-restore" style={{ color: "#e57368" }}>
          The slug <code>{slug}</code> is already used by another post — change it
          so you don’t overwrite that post.
        </div>
      )}
      {settingsOpen && (
        <div className="pe-settings">
          <label className="pe-f">
            Slug
            <input
              className="pe-input"
              value={slug}
              onChange={(e) => {
                setSlug(slugify(e.target.value));
                setSlugTouched(true);
              }}
              placeholder="my-post"
            />
          </label>
          <label className="pe-f">
            Date (display)
            <input
              className="pe-input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              placeholder="Jun 2026"
            />
          </label>
          <label className="pe-f">
            Sort order
            <input
              className="pe-input"
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            />
          </label>
          <div className="pe-f pe-cover">
            <span>Cover image (social card + article header)</span>
            <div className="pe-cover-row">
              {cover ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img className="pe-cover-thumb" src={cover} alt="cover" />
              ) : (
                <div className="pe-cover-thumb pe-cover-empty">no cover</div>
              )}
              <div className="pe-cover-actions">
                <label className="pe-mini">
                  {coverBusy ? "uploading…" : cover ? "Replace" : "Upload"}
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(e) => {
                      uploadCover(e.target.files?.[0]);
                      e.target.value = "";
                    }}
                  />
                </label>
                {cover && (
                  <button
                    type="button"
                    className="pe-mini"
                    onClick={() => setCover("")}
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* excerpt */}
      <label className="pe-f pe-excerpt">
        <span className="pe-excerpt-head">
          Excerpt
          <button
            type="button"
            className="pe-mini"
            onClick={() => setExcerpt(autoExcerpt(body))}
          >
            auto from body
          </button>
          <span
            className={
              "pe-count" +
              (excerpt.length > 0 && (excerpt.length < 50 || excerpt.length > 160)
                ? " pe-count-warn"
                : "")
            }
          >
            {excerpt.length}/160
          </span>
        </span>
        <textarea
          className="pe-input"
          name="excerpt"
          rows={2}
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          placeholder="One-line summary shown in the list and as the social description."
        />
      </label>

      {/* toolbar */}
      <div className="pe-toolbar">
        <ToolBtn onClick={() => applyWrap("**", "**", "bold")} title="Bold (⌘B)">
          <b>B</b>
        </ToolBtn>
        <ToolBtn onClick={() => applyWrap("_", "_", "italic")} title="Italic (⌘I)">
          <i>I</i>
        </ToolBtn>
        <span className="pe-sep" />
        <ToolBtn onClick={() => applyLinePrefix("## ")} title="Heading">
          H2
        </ToolBtn>
        <ToolBtn onClick={() => applyLinePrefix("### ")} title="Sub-heading">
          H3
        </ToolBtn>
        <ToolBtn onClick={() => applyLinePrefix("> ")} title="Quote">
          ❝
        </ToolBtn>
        <ToolBtn onClick={() => applyLinePrefix("- ")} title="Bullet list">
          •
        </ToolBtn>
        <ToolBtn onClick={() => applyLinePrefix("1. ")} title="Numbered list">
          1.
        </ToolBtn>
        <span className="pe-sep" />
        <ToolBtn onClick={() => applyWrap("[", "](https://)", "text")} title="Link (⌘K)">
          🔗
        </ToolBtn>
        <ToolBtn onClick={() => applyWrap("`", "`", "code")} title="Inline code">
          {"</>"}
        </ToolBtn>
        <ToolBtn
          onClick={() => applyWrap("\n```\n", "\n```\n", "code block")}
          title="Code block"
        >
          ▢
        </ToolBtn>
        <ToolBtn
          onClick={() =>
            insertAtCursor(
              "\n| Column | Column |\n| --- | --- |\n| cell | cell |\n| cell | cell |\n",
            )
          }
          title="Insert table"
        >
          ▦
        </ToolBtn>
        <span className="pe-sep" />
        <label className="pe-tool pe-tool-img" title="Upload image(s)">
          {uploading ? "⏳" : "🖼"} Image
          <input
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(e) => {
              onPickFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </label>
        <ToolBtn onClick={openLibrary} title="Insert from uploaded images">
          🗂
        </ToolBtn>
        <div className="pe-views">
          {(["write", "split", "preview"] as View[]).map((v) => (
            <button
              key={v}
              type="button"
              className={"pe-view" + (view === v ? " pe-view-on" : "")}
              onClick={() => setView(v)}
            >
              {v}
            </button>
          ))}
        </div>
        <ToolBtn onClick={() => setHelp((h) => !h)} title="Markdown help">
          ?
        </ToolBtn>
        <ToolBtn
          onClick={() => setFull((f) => !f)}
          title={full ? "Exit fullscreen (Esc)" : "Distraction-free fullscreen"}
        >
          {full ? "✕" : "⛶"}
        </ToolBtn>
      </div>

      {help && (
        <div className="pe-help">
          <code># H1</code> <code>## H2</code> <code>**bold**</code>{" "}
          <code>_italic_</code> <code>[link](url)</code> <code>`code`</code>{" "}
          <code>- list</code> <code>1. numbered</code> <code>&gt; quote</code>{" "}
          <code>![alt](img)</code> <code>--- (rule)</code> · shortcuts:{" "}
          <code>⌘B</code> <code>⌘I</code> <code>⌘K</code> <code>⌘S save</code> ·
          drag/paste images straight in.
        </div>
      )}

      {/* editor + preview */}
      <div className={"pe-pane pe-pane-" + view}>
        {view !== "preview" && (
          <textarea
            ref={taRef}
            className="pe-body"
            name="body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={onKeyDown}
            onPaste={onPaste}
            onDrop={onDrop}
            placeholder={
              "Write in markdown. Drag, paste, or upload images — they go straight to storage.\n\n## A heading\n\nA paragraph with a [link](https://example.com)."
            }
            spellCheck
          />
        )}
        {view !== "write" && (
          <div className="pe-preview article-md">
            {body.trim() ? (
              <Markdown body={body} />
            ) : (
              <p className="pe-empty">Nothing to preview yet.</p>
            )}
          </div>
        )}
      </div>

      <div className="pe-foot">
        {words} words · {readTime(body)} min read
        {uploading ? " · uploading image…" : ""}
        {savedAt ? ` · draft autosaved ${savedAt}` : ""}
      </div>

      {/* image library modal */}
      {libOpen && (
        <div className="pe-modal" onClick={() => setLibOpen(false)}>
          <div className="pe-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="pe-modal-head">
              <strong>Image library</strong>
              <button
                type="button"
                className="pe-mini"
                onClick={() => setLibOpen(false)}
              >
                Close
              </button>
            </div>
            {libBusy ? (
              <p className="pe-empty">Loading…</p>
            ) : lib && lib.length ? (
              <div className="pe-grid">
                {lib.map((img) => (
                  <div key={img.name} className="pe-thumb-wrap">
                    <button
                      type="button"
                      className="pe-thumb"
                      title={`Insert ${img.name}`}
                      onClick={() => {
                        const alt =
                          img.name.split("/").pop()?.replace(/\.[^.]+$/, "") ?? "";
                        insertAtCursor(`![${alt}](${img.url})`);
                        setLibOpen(false);
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img.url} alt={img.name} loading="lazy" />
                    </button>
                    <button
                      type="button"
                      className="pe-thumb-del"
                      title="Delete image from storage"
                      onClick={() => deleteImage(img.name)}
                    >
                      🗑
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="pe-empty">
                No images uploaded yet. Use the 🖼 button, or drag/paste an image
                into the editor.
              </p>
            )}
          </div>
        </div>
      )}
    </form>
  );
}

function ToolBtn({
  onClick,
  title,
  children,
}: {
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button type="button" className="pe-tool" title={title} onClick={onClick}>
      {children}
    </button>
  );
}

function todayDisplay(): string {
  // client-side only; fine because this is a "use client" component
  return new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
function isUrl(s: string): boolean {
  return /^https?:\/\/\S+$/i.test(s) && !/\s/.test(s);
}
function stamp(): string {
  return Date.now().toString(36);
}
function rand(): string {
  return Math.random().toString(36).slice(2, 8);
}
