import type { Metadata } from "next";
import { EB_Garamond, Geist } from "next/font/google";
import { SiteHeader } from "@/app/_components/SiteHeader";
import { SiteFooter } from "@/app/_components/SiteFooter";
import { SITE_NAME, siteUrl } from "@/lib/site";
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
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  // metadataBase resolves the relative canonical/OG URLs used per-page. Without
  // it Next emits relative og:url values, which most crawlers ignore.
  metadataBase: new URL(siteUrl()),
  title: {
    default: `${SITE_NAME}: research and analysis on Central Asia`,
    template: `%s · ${SITE_NAME}`,
  },
  description:
    "Research, analysis and essays on the politics, economies and societies of Central Asia.",
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
    >
      <body className="flex min-h-full flex-col">
        <SiteHeader />
        {/* No width constraint here: the homepage runs full-bleed sections while
            article pages set their own narrow measure. Constraining globally would
            box the hero in. */}
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
