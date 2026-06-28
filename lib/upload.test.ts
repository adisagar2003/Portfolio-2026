import { describe, it, expect } from "vitest";
import { imageFileError, MAX_IMAGE_BYTES } from "./upload";

describe("imageFileError", () => {
  it("accepts a normal image", () => {
    expect(imageFileError("image/png", 1000)).toBeNull();
  });

  it("rejects non-image types", () => {
    expect(imageFileError("application/pdf", 1000)).toMatch(/only image/i);
    expect(imageFileError("", 1000)).toMatch(/only image/i);
  });

  it("rejects files over the size limit", () => {
    expect(imageFileError("image/jpeg", MAX_IMAGE_BYTES + 1)).toMatch(/too large/i);
  });

  it("accepts a file exactly at the limit", () => {
    expect(imageFileError("image/jpeg", MAX_IMAGE_BYTES)).toBeNull();
  });

  it("honours a custom max", () => {
    expect(imageFileError("image/png", 2000, 1000)).toMatch(/too large/i);
  });
});
