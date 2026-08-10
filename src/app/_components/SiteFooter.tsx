import Link from "next/link";
import { COPY } from "@/lib/content";
import { PUBLISHER_NAME, SITE_NAME } from "@/lib/site";
import { PatternField, Rosette, TileBand } from "@/app/_components/Ornament";

// Footer — the site's close, on the "night tile" surface: deep lapis, parchment
// text, gilded links. The surface-night class re-declares the semantic tokens,
// so everything inside recolours itself without special variants (globals.css).
//
// Carries the publisher credit: the review fronts its own brand, and Freshman
// Academy is named here rather than in the masthead.
export function SiteFooter() {
  return (
    <footer className="surface-night relative mt-24">
      {/* Gilded frieze on the threshold, then the star lattice barely surfacing
          out of the field — the two ornaments this surface is allowed. */}
      <TileBand className="relative z-10 text-gild/80" />
      <PatternField className="text-tile opacity-[0.06]" />

      <div className="relative mx-auto grid w-full max-w-6xl gap-10 px-6 pb-14 pt-12 sm:grid-cols-[1.6fr_1fr_1fr]">
        <div>
          <p className="flex items-center gap-3">
            <Rosette className="size-8 shrink-0 text-gild" />
            <span className="display-flush font-serif text-2xl leading-tight text-ink">
              {SITE_NAME}
            </span>
          </p>
          <p className="prose-plain mt-4 max-w-xs text-sm leading-relaxed text-muted-fg">
            {COPY.footer.credit}
          </p>
        </div>

        <nav aria-label="Sections">
          <p className="text-sm font-medium text-ink">Read</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <FooterLink href="/papers">Papers</FooterLink>
            </li>
            <li>
              <FooterLink href="/issues">Issues</FooterLink>
            </li>
            <li>
              <FooterLink href="/about">About the Review</FooterLink>
            </li>
          </ul>
        </nav>

        <nav aria-label="Contribute">
          <p className="text-sm font-medium text-ink">Contribute</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <FooterLink href="/submit">Submit a paper</FooterLink>
            </li>
            <li>
              <FooterLink href="/submissions">Your submissions</FooterLink>
            </li>
          </ul>
        </nav>
      </div>

      <div className="relative border-t border-rule px-6 py-6">
        <p className="mx-auto max-w-6xl text-xs text-muted-fg">
          {/* Year is rendered server-side; the layout is already dynamic because
              the header reads the session, so this costs nothing extra. */}
          © {new Date().getFullYear()} {SITE_NAME}. Published by {PUBLISHER_NAME}.
        </p>
      </div>
    </footer>
  );
}

function FooterLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  // Inside surface-night, accent resolves to gild — links glint gold on hover.
  return (
    <Link
      href={href}
      className="text-muted-fg transition-colors hover:text-accent"
    >
      {children}
    </Link>
  );
}
