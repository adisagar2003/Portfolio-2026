export type Theme = "dark" | "light";

/**
 * Resolve the theme to apply from a stored value. Dark-first: only an explicit
 * saved "light"/"dark" is honored, otherwise default to dark (the design's
 * intended default). Pure + tested; the same logic is inlined in the layout's
 * pre-paint script.
 */
export function resolveTheme(saved: string | null | undefined): Theme {
  return saved === "light" || saved === "dark" ? saved : "dark";
}
