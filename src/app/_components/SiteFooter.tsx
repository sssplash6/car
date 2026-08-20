import Link from "next/link";
import { COPY } from "@/lib/content";
import { PUBLISHER_NAME, REGION_COUNTRIES, SITE_NAME } from "@/lib/site";
import {
  PatternField,
  Rosette,
  RosetteGrand,
  TileBand,
} from "@/app/_components/Ornament";

// The endpaper.
//
// The homepage opens on a bound cover; this is the leaf the book closes on, and
// it is the same material — deep lapis, parchment text, gilded links — on the
// "night tile" surface. The surface-night class re-declares the semantic
// tokens, so everything inside recolours itself without special variants
// (globals.css). The device sits behind it at architectural scale, the way a
// binder's blind stamp sits under the pastedown.
//
// It carries the publisher credit: the review fronts its own brand, and
// Freshman Academy is named here rather than in the masthead. It also carries
// the site's colophon — what the thing is set in and how it is dated — because
// a colophon at the close is where a printed object says how it was made.
export function SiteFooter() {
  return (
    <footer className="surface-night relative mt-20 overflow-hidden print:hidden">
      {/* Gilded frieze on the threshold, then the star lattice barely surfacing
          out of the field — the two ornaments this surface is allowed, plus the
          device ghosted at dome scale behind everything. */}
      <TileBand className="relative z-10 text-gild" />
      <PatternField className="text-tile opacity-[0.06]" />
      <RosetteGrand
        aria-hidden="true"
        className="pointer-events-none absolute -right-40 top-1/2 size-[38rem] -translate-y-1/2 text-gild opacity-[0.07] max-lg:hidden"
      />

      <div className="relative mx-auto grid w-full max-w-6xl gap-10 px-6 pb-12 pt-14 sm:grid-cols-[1.6fr_1fr_1fr]">
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
          {/* The region, set as a woven line of names rather than a list: the
              close is where the book says what it is about, in one breath. */}
          <p className="mt-5 max-w-xs text-xs leading-relaxed text-muted-fg">
            {REGION_COUNTRIES.map((c) => c.en).join(" · ")}
          </p>
        </div>

        <nav aria-label="Sections">
          <p className="folio-label text-ink">Read</p>
          <ul className="mt-3.5 space-y-2 text-sm">
            <li>
              <FooterLink href="/papers">Papers</FooterLink>
            </li>
            <li>
              <FooterLink href="/issues">Issues</FooterLink>
            </li>
            <li>
              <FooterLink href="/about">About the Review</FooterLink>
            </li>
            <li>
              <FooterLink href="/feed.xml">Atom feed</FooterLink>
            </li>
          </ul>
        </nav>

        <nav aria-label="Contribute">
          <p className="folio-label text-ink">Contribute</p>
          <ul className="mt-3.5 space-y-2 text-sm">
            <li>
              <FooterLink href="/submit">Submit a paper</FooterLink>
            </li>
            <li>
              {/* Same label as the page and menu: two names for one place
                  reads as two places. */}
              <FooterLink href="/submissions">My submissions</FooterLink>
            </li>
            <li>
              <FooterLink href="/about#contributors">
                Guidance for contributors
              </FooterLink>
            </li>
          </ul>
        </nav>
      </div>

      {/* The colophon proper: how the object is made and dated. Every claim
          here is checkable against the code — the faces are the two the site
          loads, and the quarters are the ones src/lib/issues.ts computes. */}
      <div className="relative border-t border-rule px-6 py-6">
        <div className="mx-auto flex max-w-6xl flex-wrap items-baseline gap-x-6 gap-y-2 text-xs text-muted-fg">
          {/* Year is rendered server-side; the layout is already dynamic because
              the header reads the session, so this costs nothing extra. */}
          <span>
            © {new Date().getFullYear()} {SITE_NAME}. Published by{" "}
            {PUBLISHER_NAME}.
          </span>
          <span className="max-sm:hidden">
            Set in EB Garamond and Geist · issues follow the Tashkent quarters
          </span>
          <span className="ml-auto flex items-center gap-x-5">
            <FooterLink href="/privacy">Privacy</FooterLink>
            {/* The shortcut belongs at the close too: a reader who has reached
                the foot of a page is looking for somewhere else to be. */}
            <span className="hidden items-center gap-1.5 sm:flex">
              <kbd className="rounded border border-rule px-1.5 py-0.5 font-sans text-[0.6875rem] leading-none text-ink">
                ⌘K
              </kbd>
              searches the catalogue
            </span>
          </span>
        </div>
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
      className="link-underline text-muted-fg transition-colors hover:text-accent"
    >
      {children}
    </Link>
  );
}
