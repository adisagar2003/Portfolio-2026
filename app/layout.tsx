import type { Metadata } from "next";
import { Sora, Hanken_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { getContent } from "@/lib/content";

const supabaseOrigin = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).origin;
  } catch {
    return null;
  }
})();

const sora = Sora({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sora",
  display: "swap",
});
const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-hanken",
  display: "swap",
});
const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-jetbrains",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const { site } = await getContent();
  return {
    metadataBase: new URL(site.url),
    title: site.title,
    description: site.description,
    alternates: {
      types: { "application/rss+xml": "/feed.xml" },
    },
    openGraph: {
      title: site.title,
      description: site.description,
      url: site.url,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: site.title,
      description: site.description,
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      data-theme="dark"
      className={`${sora.variable} ${hanken.variable} ${jetbrains.variable}`}
    >
      {supabaseOrigin ? (
        <head>
          <link rel="preconnect" href={supabaseOrigin} crossOrigin="" />
          <link rel="dns-prefetch" href={supabaseOrigin} />
        </head>
      ) : null}
      <body>{children}</body>
    </html>
  );
}
