import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Inter, Source_Serif_4 } from "next/font/google";
import { SiteHeader } from "@/app/_components/SiteHeader";
import { SiteFooter } from "@/app/_components/SiteFooter";
import { PUBLISHER_NAME, SITE_NAME, siteUrl } from "@/lib/site";
import { demoMode } from "@/auth.config";
import { signInAsDev } from "@/app/_actions/auth";
import "./globals.css";

// Three families, all with full Cyrillic (DESIGN.md §2.1): the review names
// Kazakhstan, Kyrgyzstan and Tajikistan in their own script, and the old faces
// could not set Қ or ҷ. `subsets` only decides what is preloaded; next/font
// self-hosts every subset's @font-face, so the Cyrillic files load on demand
// when a native name renders. Do not add cyrillic-ext here.
const serif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
  axes: ["opsz"],
  display: "swap",
});
const sans = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  axes: ["opsz"],
  display: "swap",
});
const mono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

// Tints the browser chrome to the page in each scheme.
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf9f5" },
    { media: "(prefers-color-scheme: dark)", color: "#141413" },
  ],
};

export const metadata: Metadata = {
  // metadataBase resolves the relative canonical/OG URLs used per page.
  metadataBase: new URL(siteUrl()),
  title: {
    default: `${SITE_NAME}: research on the region's politics, economies and societies`,
    template: `%s · ${SITE_NAME}`,
  },
  description:
    "Research, analysis and essays on the politics, economies and societies of Central Asia.",
  alternates: {
    types: { "application/atom+xml": [{ url: "/feed.xml", title: SITE_NAME }] },
  },
  // The share card comes from app/opengraph-image.tsx (paper pages: their own).
  openGraph: { type: "website", siteName: SITE_NAME },
};

// Site-level structured data: the review as a publication.
const siteJsonLd = {
  "@context": "https://schema.org",
  "@type": "Periodical",
  name: SITE_NAME,
  url: siteUrl(),
  publisher: { "@type": "Organization", name: PUBLISHER_NAME },
};

// Pre-paint, parser-blocking on purpose: pins a chosen theme before anything
// renders (no flash), and marks the first page of a browser session so the
// header Mark draws itself once, in CSS, without waiting for hydration.
const PREPAINT = `try{var t=localStorage.getItem("theme");if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t)}catch(e){}try{if(!sessionStorage.getItem("carVisited")){document.documentElement.setAttribute("data-first-visit","");sessionStorage.setItem("carVisited","1")}}catch(e){}`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${serif.variable} ${sans.variable} ${mono.variable} h-full antialiased`}
      // Lets Next turn smooth scrolling off during route changes.
      data-scroll-behavior="smooth"
      // The pre-paint script may set data-theme / data-first-visit before
      // hydration, which React must not treat as a mismatch to repair.
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col">
        <script dangerouslySetInnerHTML={{ __html: PREPAINT }} />
        <script
          type="application/ld+json"
          // Static, code-authored JSON: nothing user-supplied reaches it.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(siteJsonLd) }}
        />
        <a href="#content" className="skip-link btn btn-primary btn-sm">
          Skip to content
        </a>
        {demoMode && (
          // The public demo (DEMO_MODE): say so on every page, and put the
          // one-click sign-in where visitors land, not only on /login.
          <div className="border-b border-rule bg-surface-1">
            <div className="wrap flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-2">
              <p className="t-ui-sm text-ink-2">Demo site: fictional papers, wiped every night.</p>
              <div className="actions">
                <form action={signInAsDev.bind(null, "reader")}>
                  <button type="submit" className="btn btn-ghost btn-sm">
                    Try as reader
                  </button>
                </form>
                <form action={signInAsDev.bind(null, "admin")}>
                  <button type="submit" className="btn btn-secondary btn-sm">
                    Try as editor
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
        <SiteHeader />
        <main id="content" className="flex-1">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
