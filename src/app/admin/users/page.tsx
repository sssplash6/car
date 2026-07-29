import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/site";

export const metadata: Metadata = {
  title: "Readers",
  robots: { index: false, follow: false },
};

// Registered accounts, read-only.
//
// Roles are intentionally NOT editable here. ADMIN_EMAILS is the single source of
// truth and is reconciled on every sign-in, so a role changed in the database
// would be silently overwritten the next time that person logged in — a control
// that looks like it works but does not. Change the env var instead.
export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 200, // enough for a young publication; paginate if this grows
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      _count: { select: { papers: true } },
    },
  });

  return (
    <div>
      <h1 className="font-serif text-3xl text-ink">Readers</h1>
      <p className="mt-3 max-w-2xl text-muted-fg">
        Everyone who has signed in. Anyone with an account can read full papers and
        submit their own. Publishing is controlled by review, not by who can
        register.
      </p>
      <p className="mt-4 max-w-2xl rounded border border-rule bg-surface px-4 py-3 text-sm text-ink-soft">
        Roles are set by the <code className="text-accent">ADMIN_EMAILS</code>{" "}
        environment variable and re-applied at every sign-in, so they are shown
        here but not editable. Editing the database directly would be undone on the
        user&rsquo;s next login.
      </p>

      {users.length === 0 ? (
        <p className="mt-10 border-t border-rule pt-10 text-muted-fg">
          Nobody has signed in yet.
        </p>
      ) : (
        <div className="mt-8 overflow-x-auto">
          <table className="w-full min-w-lg text-left text-sm">
            <thead>
              <tr className="border-y border-rule text-xs uppercase tracking-wider text-muted-fg">
                <th className="py-3 pr-4 font-medium">Account</th>
                <th className="py-3 pr-4 font-medium">Role</th>
                <th className="py-3 pr-4 font-medium">Submissions</th>
                <th className="py-3 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-rule">
                  <td className="py-3 pr-4">
                    <span className="block text-ink">
                      {user.name ?? "Not given"}
                    </span>
                    <span className="block text-xs text-muted-fg">
                      {user.email ?? "no email"}
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    <span
                      className={
                        user.role === "ADMIN"
                          ? "font-medium text-accent"
                          : "text-muted-fg"
                      }
                    >
                      {user.role === "ADMIN" ? "Editor" : "Reader"}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-ink-soft">
                    {user._count.papers}
                  </td>
                  <td className="py-3 text-muted-fg">
                    {formatDate(user.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
