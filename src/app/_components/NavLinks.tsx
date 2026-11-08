"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** A section owns its subtree, and Papers also owns the abstract pages
    (/p/<slug> is where reading the papers happens). */
export function isActivePath(pathname: string, href: string): boolean {
  return (
    pathname === href ||
    pathname.startsWith(`${href}/`) ||
    (href === "/papers" && pathname.startsWith("/p/"))
  );
}

// Primary nav pills. The active pill's background is its own element with a
// fixed view-transition name (globals.css: .pill-bg), so when a page change
// runs as a view transition the pill slides from the old section to the new
// one instead of jumping. A client leaf only because the active state needs
// the pathname.
export function NavLinks({ items }: { items: ReadonlyArray<{ href: string; label: string }> }) {
  const pathname = usePathname();

  return (
    <nav className="nav" aria-label="Primary">
      {items.map((item) => {
        const active = isActivePath(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className="pill-nav"
            aria-current={active ? "page" : undefined}
          >
            {active && <span className="pill-bg" aria-hidden="true" />}
            {/* Named after the pill in tree order, so during a page change the
                label paints above the sliding pill instead of under it. */}
            <span
              className="pill-label"
              style={{ viewTransitionName: `nav-${item.href.slice(1) || "home"}` }}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
