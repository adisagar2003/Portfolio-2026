export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * Validate an image before uploading. Returns an error message, or null if OK.
 * Pure (takes primitives) so it's unit-testable without the File API.
 */
export function imageFileError(
  type: string,
  size: number,
  maxBytes: number = MAX_IMAGE_BYTES,
): string | null {
  if (!type.startsWith("image/")) return "Only image files can be uploaded.";
  if (size > maxBytes) {
    const mb = (maxBytes / (1024 * 1024)).toFixed(0);
    return `Image is too large (max ${mb} MB).`;
  }
  return null;
}
