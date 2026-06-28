import { describe, it, expect } from "vitest";
import {
  parsePostInput,
  parseDeleteInput,
  MAX_TITLE_LEN,
  MAX_BODY_LEN,
} from "./api-posts";

describe("parsePostInput length limits", () => {
  it("rejects an over-long title", () => {
    const r = parsePostInput({ title: "x".repeat(MAX_TITLE_LEN + 1), body: "b" });
    expect(r.ok).toBe(false);
  });
  it("rejects an over-long body", () => {
    const r = parsePostInput({ title: "t", body: "x".repeat(MAX_BODY_LEN + 1) });
    expect(r.ok).toBe(false);
  });
  it("accepts content at the limits", () => {
    const r = parsePostInput({
      title: "x".repeat(MAX_TITLE_LEN),
      body: "x".repeat(MAX_BODY_LEN),
    });
    expect(r.ok).toBe(true);
  });
});

describe("parseDeleteInput", () => {
  it("requires a non-empty string slug", () => {
    expect(parseDeleteInput({}).ok).toBe(false);
    expect(parseDeleteInput({ slug: "" }).ok).toBe(false);
    expect(parseDeleteInput({ slug: 5 }).ok).toBe(false);
    expect(parseDeleteInput(null).ok).toBe(false);
  });
  it("trims and returns the slug", () => {
    expect(parseDeleteInput({ slug: " my-post " })).toEqual({
      ok: true,
      slug: "my-post",
    });
  });
});

describe("parsePostInput", () => {
  it("rejects non-object payloads", () => {
    expect(parsePostInput(null).ok).toBe(false);
    expect(parsePostInput([]).ok).toBe(false);
    expect(parsePostInput("x").ok).toBe(false);
  });

  it("requires a non-empty string title and body", () => {
    expect(parsePostInput({ body: "b" }).ok).toBe(false);
    expect(parsePostInput({ title: "t" }).ok).toBe(false);
    expect(parsePostInput({ title: "  ", body: "b" }).ok).toBe(false);
    expect(parsePostInput({ title: 5, body: "b" }).ok).toBe(false);
  });

  it("applies defaults for optional fields", () => {
    const r = parsePostInput({ title: "T", body: "B" });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value).toMatchObject({
      title: "T",
      body: "B",
      coverUrl: null,
      published: true,
      sortOrder: 0,
      overwrite: false,
    });
    expect(r.value.slug).toBeUndefined();
  });

  it("normalizes types and trims strings", () => {
    const r = parsePostInput({
      title: "  Hello  ",
      body: " content ",
      slug: " my-slug ",
      cover_url: "https://img/x.png",
      published: false,
      sort_order: "3",
      overwrite: 1,
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.title).toBe("Hello");
    expect(r.value.slug).toBe("my-slug");
    expect(r.value.coverUrl).toBe("https://img/x.png");
    expect(r.value.published).toBe(false);
    expect(r.value.sortOrder).toBe(3);
    expect(r.value.overwrite).toBe(true);
  });

  it("falls back to 0 for an unparseable sort_order", () => {
    const r = parsePostInput({ title: "T", body: "B", sort_order: "abc" });
    expect(r.ok && r.value.sortOrder).toBe(0);
  });
});
