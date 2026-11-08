import { requireAdmin } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { PAPER_STATUS } from "@/lib/papers";
import { AdminTabs } from "@/app/admin/_components/AdminTabs";

// The editor's desk (DESIGN.md §9.10). Product register: no entrance motion,
// no drawings except empty states, no bands — editors live here.
//
// requireAdmin() here covers every page under /admin. That is safe for PAGES
// (a layout runs on every navigation to a route it wraps) but does NOT protect
// server actions, which is why every action in admin/actions.ts calls
// requireAdmin() itself. Do not remove those on the grounds that "the layout
// already checks".
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  // Queue count in the tabs, so outstanding work shows from any admin page.
  const pending = await prisma.paper.count({ where: { status: PAPER_STATUS.SUBMITTED } });

  const tabs = [
    { href: "/admin", label: "Overview" },
    { href: "/admin/queue", label: "Review queue", count: pending },
    { href: "/admin/papers", label: "All papers" },
    { href: "/admin/users", label: "Readers" },
    { href: "/admin/emails", label: "Email log" },
  ];

  return (
    <div className="wrap page-top page-end">
      <p className="t-meta">Editor desk</p>
      <h1 className="t-h2 mt-3">Editor&rsquo;s desk</h1>
      <div className="admin-tabs">
        <AdminTabs items={tabs} />
      </div>
      <div className="mt-12">{children}</div>
    </div>
  );
}
