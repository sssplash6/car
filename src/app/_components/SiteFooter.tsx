import Link from "next/link";
import { COPY } from "@/lib/content";
import { PUBLISHER_NAME, REGION_COUNTRIES, SITE_NAME } from "@/lib/site";
import { Drawing } from "@/app/_components/illustrations/Drawing";
import { Mark } from "@/app/_components/ui/Mark";
import { FooterCall } from "@/app/_components/FooterCall";
import { ThemeSelect } from "@/app/_components/ThemeToggle";

// The floor of every page (DESIGN.md §8.2): full-bleed ink, the one place the
// call for submissions lives (public pages only, see FooterCall), the
// publisher credit, and the five countries named in their own languages, set
// only in Source Serif 4 so Қ and ҷ come from the same face as the Latin.
export function SiteFooter() {
  const call = COPY.callForPapers;
  return (
    <footer className="site-footer print:hidden">
      <div className="wrap">
        <FooterCall
          title={call.title}
          body={call.body}
          action={call.action}
          link={call.link}
          art={<Drawing name="cotton" size="md" tone="door" draw="view" />}
        />

        <div className="foot-grid">
          <div className="foot-brand">
            <Link href="/" className="brand" aria-label={`${SITE_NAME}, home`}>
              <Mark size={32} tone="door" />
              <span className="wordmark">{SITE_NAME}</span>
            </Link>
            <p>{COPY.footer.credit}</p>
          </div>
          <nav className="foot-col" aria-label="Read">
            <h3>Read</h3>
            <Link href="/papers">Papers</Link>
            <Link href="/issues">Issues</Link>
            <a href="/feed.xml">Atom feed</a>
          </nav>
          <nav className="foot-col" aria-label="Contribute">
            <h3>Contribute</h3>
            <Link href="/submit">Submit a paper</Link>
            <Link href="/about#contributors">For contributors</Link>
            <Link href="/submissions">My submissions</Link>
          </nav>
          <nav className="foot-col" aria-label="Review">
            <h3>Review</h3>
            <Link href="/about">About</Link>
            <Link href="/privacy">Privacy</Link>
          </nav>
        </div>

        <div className="foot-base">
          {/* Server-rendered year; the layout is dynamic anyway (the header
              reads the session). */}
          <div className="foot-meta">
            <p className="t-micro">
              © {new Date().getFullYear()} {PUBLISHER_NAME}
            </p>
            <ThemeSelect tone="door" />
          </div>
          <p className="natives">
            {REGION_COUNTRIES.map((country) => (
              <span key={country.lang} lang={country.lang}>
                {country.native}
              </span>
            ))}
          </p>
        </div>
      </div>
    </footer>
  );
}
