import { describe, it, expect } from "vitest";
import { siteBase, postUrl } from "./url";

describe("siteBase", () => {
  it("strips trailing slashes", () => {
    expect(siteBase("https://site.com/")).toBe("https://site.com");
    expect(siteBase("https://site.com///")).toBe("https://site.com");
    expect(siteBase("https://site.com")).toBe("https://site.com");
  });
});

describe("postUrl", () => {
  it("builds <base>/writing/<slug> with normalized base", () => {
    expect(postUrl("https://site.com/", "hello")).toBe(
      "https://site.com/writing/hello",
    );
  });
});
