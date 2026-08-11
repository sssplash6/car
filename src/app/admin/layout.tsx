import { requireAdmin } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { PAPER_STATUS } from "@/lib/papers";
import { PageShell } from "@/app/_components/PageShell";
import { AdminTabs } from "@/app/admin/_components/AdminTabs";

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
    { href: "/admin/papers", label: "All papers" },
    { href: "/admin/users", label: "Readers" },
    { href: "/admin/emails", label: "Email log" },
  ];

  return (
    <PageShell wide>
      <p className="eyebrow">Editor dashboard</p>

      <nav aria-label="Editor sections" className="mt-4 border-b border-rule">
        <AdminTabs items={tabs} />
      </nav>

      <div className="mt-10">{children}</div>
    </PageShell>
  );
}
