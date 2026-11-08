"use client";

import { usePathname } from "next/navigation";
import { Segmented } from "@/app/_components/ui/Segmented";

// Admin section tabs: the segmented control with counts. A client leaf because
// the active state needs the pathname. /admin is the overview and must match
// exactly, or it would light up for every child route.
export function AdminTabs({
  items,
}: {
  items: ReadonlyArray<{ href: string; label: string; count?: number }>;
}) {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Segmented
      label="Editor sections"
      items={items.map((tab) => ({
        href: tab.href,
        label: tab.label,
        count: tab.count ? tab.count : undefined,
        active: isActive(tab.href),
      }))}
    />
  );
}
