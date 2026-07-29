import Link from "next/link";
import { requireAdmin } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { PAPER_STATUS } from "@/lib/papers";
import { PageShell } from "@/app/_components/PageShell";

// Admin shell.
//
// requireAdmin() here covers every page under /admin, so the child pages do not
// each repeat it. That is safe for PAGES because a layout runs on every
// navigation to a route it wraps — but it does NOT protect server actions, which
// is why every action in admin/actions.ts calls requireAdmin() itself. Do not
// remove those on the grounds that "the layout already checks".
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  // Queue count in the subnav, so an editor sees outstanding work from any admin
  // page without visiting the queue first.
  const pending = await prisma.paper.count({
    where: { status: PAPER_STATUS.SUBMITTED },
  });

  const tabs = [
    { href: "/admin", label: "Overview" },
    { href: "/admin/queue", label: "Review queue", count: pending },
    { href: "/admin/users", label: "Readers" },
    { href: "/admin/emails", label: "Email log" },
    { href: "/admin/content", label: "Site copy" },
  ];

  return (
    <PageShell wide>
      <p className="eyebrow">Editor dashboard</p>

      <nav className="mt-4 border-b border-rule">
        <ul className="-mb-px flex flex-wrap gap-x-6 text-sm">
          {tabs.map((tab) => (
            <li key={tab.href}>
              <Link
                href={tab.href}
                className="inline-flex items-center gap-2 border-b-2 border-transparent pb-3 text-ink-soft transition-colors hover:border-accent hover:text-accent"
              >
                {tab.label}
                {typeof tab.count === "number" && tab.count > 0 && (
                  <span className="rounded-full bg-accent px-1.5 text-[11px] font-medium leading-5 text-white">
                    {tab.count}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-10">{children}</div>
    </PageShell>
  );
}
