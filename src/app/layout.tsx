import type { Metadata, Viewport } from "next";
import { EB_Garamond, Geist } from "next/font/google";
import { SiteHeader } from "@/app/_components/SiteHeader";
import { SiteFooter } from "@/app/_components/SiteFooter";
import { PUBLISHER_NAME, SITE_NAME, siteUrl } from "@/lib/site";
import { heroRegistan } from "@/lib/regionalImages";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

// Display serif for the masthead and headings. Serif is justified here because
// the brief is an actual publication, which is the one case the house rules allow
// it as a default; Garamond specifically because it reads as academic press
// rather than as fashion editorial. The only webfont the site loads besides Geist.
const displaySerif = EB_Garamond({
  variable: "--font-display",
  // Cyrillic is not optional here: the review names Kazakhstan, Kyrgyzstan and
  // Tajikistan in their own script (src/lib/site.ts), and a fallback face for
  // those three words beside Garamond would read as a mistake. Next emits one
  // extra subset file, requested only when a Cyrillic glyph is actually used.
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

// Tints the browser chrome (mobile URL bar, PWA title bar) to match the paper
// in each scheme, so the page doesn't sit inside a mismatched grey frame.
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f9f4e8" },
    { media: "(prefers-color-scheme: dark)", color: "#171310" },
  ],
};

export const metadata: Metadata = {
  // metadataBase resolves the relative canonical/OG URLs used per-page. Without
  // it Next emits relative og:url values, which most crawlers ignore.
  metadataBase: new URL(siteUrl()),
  title: {
    // The masthead already says Central Asian; the clause says what it is.
    default: `${SITE_NAME}: research on the region's politics, economies and societies`,
    template: `%s · ${SITE_NAME}`,
  },
  description:
    "Research, analysis and essays on the politics, economies and societies of Central Asia.",
  alternates: {
    // Advertise the feed on every page; readers' feed buttons look here.
    types: { "application/atom+xml": [{ url: "/feed.xml", title: SITE_NAME }] },
  },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    // Default share card: the site's own hero image. Paper pages override
    // this with their pool plate.
    images: [
      {
        url: heroRegistan.src,
        width: heroRegistan.width,
        height: heroRegistan.height,
      },
    ],
  },
};

// Site-level structured data: the review as a publication, not just a set of
// articles. Paper pages add ScholarlyArticle themselves; this names what the
// articles are part of.
const siteJsonLd = {
  "@context": "https://schema.org",
  "@type": "Periodical",
  name: SITE_NAME,
  url: siteUrl(),
  publisher: { "@type": "Organization", name: PUBLISHER_NAME },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${displaySerif.variable} h-full antialiased`}
      // The pre-paint script below may set data-theme before hydration, which
      // React must not treat as a mismatch to repair.
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col">
        {/* Pre-paint theme pin. Parser-blocking on purpose: it must run before
            anything renders, or a reader who pinned dark gets a light flash on
            every load. All colour logic stays in the light-dark() tokens in
            globals.css — this only sets the attribute those tokens react to. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem("theme");if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t)}catch(e){}`,
          }}
        />
        <script
          type="application/ld+json"
          // Static, code-authored JSON — nothing user-supplied reaches it.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(siteJsonLd) }}
        />
        {/* Keyboard users get past the decorated chrome in one tab. Visible only
            while focused; sits above everything so no header stacking hides it. */}
        <a
          href="#content"
          className="sr-only z-50 rounded bg-accent px-4 py-2 text-sm font-medium text-surface focus:not-sr-only focus:absolute focus:left-4 focus:top-4"
        >
          Skip to content
        </a>
        <SiteHeader />
        {/* No width constraint here: the homepage runs full-bleed sections while
            article pages set their own narrow measure. Constraining globally would
            box the hero in. */}
        <main id="content" className="flex-1">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
