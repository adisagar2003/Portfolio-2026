import { describe, it, expect } from "vitest";
import {
  postTimestamp,
  sortPostsByDateDesc,
  formatPostDate,
  displayDateFor,
} from "./posts";

describe("postTimestamp", () => {
  it("prefers the authored display date (the intended publish date)", () => {
    const ts = postTimestamp({
      createdAt: "2020-01-01T00:00:00Z",
      date: "Jun 24, 2026",
    });
    expect(ts).toBe(Date.parse("Jun 24, 2026"));
  });

  it("falls back to createdAt when the display date is missing/unparseable", () => {
    expect(postTimestamp({ createdAt: "2026-06-24T20:29:59.120Z" })).toBe(
      Date.parse("2026-06-24T20:29:59.120Z"),
    );
    expect(
      postTimestamp({ date: "garbage", createdAt: "2026-06-24T20:29:59.120Z" }),
    ).toBe(Date.parse("2026-06-24T20:29:59.120Z"));
  });

  it("returns 0 when nothing is parseable", () => {
    expect(postTimestamp({ date: "not a date" })).toBe(0);
    expect(postTimestamp({})).toBe(0);
  });
});

describe("displayDateFor", () => {
  it("normalizes the authored date to a consistent format", () => {
    expect(displayDateFor({ date: "24 Jun 2026" })).toBe("Jun 24, 2026");
    expect(displayDateFor({ date: "May 2026" })).toBe("May 1, 2026");
  });

  it("falls back to createdAt when the authored date is unparseable", () => {
    expect(
      displayDateFor({ date: "", createdAt: "2026-06-21T01:13:40Z" }),
    ).toBe("Jun 21, 2026");
  });
});

describe("sortPostsByDateDesc", () => {
  it("orders posts newest-first by publish time, regardless of input order", () => {
    const posts = [
      { slug: "old", createdAt: "2026-04-01T00:00:00Z" },
      { slug: "new", createdAt: "2026-06-24T00:00:00Z" },
      { slug: "mid", createdAt: "2026-05-10T00:00:00Z" },
    ];
    expect(sortPostsByDateDesc(posts).map((p) => p.slug)).toEqual([
      "new",
      "mid",
      "old",
    ]);
  });

  it("does not mutate the input array", () => {
    const posts = [
      { slug: "a", createdAt: "2026-01-01T00:00:00Z" },
      { slug: "b", createdAt: "2026-02-01T00:00:00Z" },
    ];
    const copy = [...posts];
    sortPostsByDateDesc(posts);
    expect(posts).toEqual(copy);
  });
});

describe("formatPostDate", () => {
  it("formats an ISO timestamp to a consistent 'Mon D, YYYY'", () => {
    expect(formatPostDate("2026-06-24T20:29:59.120Z")).toBe("Jun 24, 2026");
  });

  it("normalizes an already-human date to the same consistent format", () => {
    expect(formatPostDate("Jun 2026")).toMatch(/^Jun \d{1,2}, 2026$/);
    expect(formatPostDate("24 Jun 2026")).toBe("Jun 24, 2026");
  });

  it("returns empty string for an unparseable value", () => {
    expect(formatPostDate("garbage")).toBe("");
    expect(formatPostDate("")).toBe("");
  });
});
