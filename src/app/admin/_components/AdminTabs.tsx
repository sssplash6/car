"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Admin section tabs. A client leaf for the same reason as NavLinks: the
// active state needs the pathname, and a four-tab bar where the current tab
// never lights up forces re-orientation from the H1 on every navigation.
export function AdminTabs({
  items,
}: {
  items: ReadonlyArray<{ href: string; label: string; count?: number }>;
}) {
  const pathname = usePathname();

  // /admin is the overview and must match exactly, or it would light up for
  // every child route; the children own their subtrees.
  const isActive = (href: string) =>
    href === "/admin"
      ? pathname === "/admin"
      : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <ul className="-mb-px flex flex-wrap gap-x-6 text-sm">
      {items.map((tab) => {
        const active = isActive(tab.href);
        return (
          <li key={tab.href}>
            <Link
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={`inline-flex items-center gap-2 border-b-2 pb-3 transition-colors ${
                active
                  ? "border-accent text-ink"
                  : "border-transparent text-ink-soft hover:border-accent hover:text-accent"
              }`}
            >
              {tab.label}
              {typeof tab.count === "number" && tab.count > 0 && (
                <span className="rounded-full bg-accent px-1.5 text-[11px] font-medium leading-5 text-surface">
                  {tab.count}
                </span>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
