"use client";

import dynamic from "next/dynamic";

/**
 * Defers the WebGL (ogl) shader into its own client chunk loaded after
 * hydration, so the heavy graphics code doesn't bloat the initial bundle or
 * block first paint. The background is purely decorative, so loading it a beat
 * late is fine.
 */
const ShaderBackground = dynamic(() => import("./ShaderBackground"), {
  ssr: false,
});

export default function ShaderBackgroundClient() {
  return <ShaderBackground />;
}
