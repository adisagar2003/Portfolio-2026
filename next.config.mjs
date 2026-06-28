// Allow optimizing images served from the Supabase Storage bucket.
const supabaseHost = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname;
  } catch {
    return undefined;
  }
})();

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "github.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      ...(supabaseHost
        ? [{ protocol: "https", hostname: supabaseHost }]
        : []),
    ],
  },
};

export default nextConfig;
