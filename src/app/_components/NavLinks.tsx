"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Primary nav list. A client leaf only because the active state needs the
// current pathname; the surrounding header stays a server component.
export function NavLinks({
  items,
}: {
  items: ReadonlyArray<{ href: string; label: string }>;
}) {
  const pathname = usePathname();

  // A section owns its subtree, and Papers also owns the abstract pages —
  // /p/<slug> is where "reading the papers" actually happens.
  const isActive = (href: string) =>
    pathname === href ||
    pathname.startsWith(`${href}/`) ||
    (href === "/papers" && pathname.startsWith("/p/"));

  return (
    <ul className="flex items-center gap-5 text-[0.9375rem] sm:gap-7">
      {items.map((item) => {
        const active = isActive(item.href);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={active ? "page" : undefined}
              data-active={active || undefined}
              className={`link-underline inline-block py-1 transition-colors ${
                active ? "text-ink" : "text-ink-soft hover:text-ink"
              }`}
            >
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
