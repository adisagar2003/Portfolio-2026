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
      <head>
        {/* Apply the saved theme before paint to avoid a flash (dark-first). */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{var t=localStorage.getItem('theme');if(t==='light'||t==='dark')document.documentElement.setAttribute('data-theme',t)}catch(e){}",
          }}
        />
        {supabaseOrigin ? (
          <>
            <link rel="preconnect" href={supabaseOrigin} crossOrigin="" />
            <link rel="dns-prefetch" href={supabaseOrigin} />
          </>
        ) : null}
      </head>
      <body>
        <a href="#top" className="skip-link">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
