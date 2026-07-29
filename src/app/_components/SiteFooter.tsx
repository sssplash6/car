import Link from "next/link";
import { getBlock } from "@/lib/content";
import { PUBLISHER_NAME, SITE_NAME } from "@/lib/site";

// Footer. Carries the publisher credit: the review fronts its own brand, and
// Freshman Academy is named here rather than in the masthead.
//
// No eyebrows here, deliberately. The page above already spends its budget of two,
// and column headings in a footer read as labels rather than as section markers.
export async function SiteFooter() {
  const credit = await getBlock("footer.credit");

  return (
    <footer className="mt-20 border-t border-rule bg-surface">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-6 py-14 sm:grid-cols-[1.6fr_1fr_1fr]">
        <div>
          <p className="display-flush font-serif text-2xl leading-tight text-ink">
            {SITE_NAME}
          </p>
          <p className="prose-plain mt-3 max-w-xs text-sm leading-relaxed text-muted-fg">
            {credit.body}
          </p>
        </div>

        <nav aria-label="Sections">
          <p className="text-sm font-medium text-ink">Read</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <FooterLink href="/papers">Papers</FooterLink>
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

      <div className="border-t border-rule px-6 py-6">
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
  return (
    <Link
      href={href}
      className="text-muted-fg transition-colors hover:text-accent"
    >
      {children}
    </Link>
  );
}
