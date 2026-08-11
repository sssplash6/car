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
type PageProps = { searchParams: Promise<{ q?: string }> };

export default async function AdminUsersPage({ searchParams }: PageProps) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where: query
        ? {
            OR: [{ name: { contains: query } }, { email: { contains: query } }],
          }
        : undefined,
      orderBy: { createdAt: "desc" },
      take: 200, // enough for a young publication; the cap is stated below when it bites
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        _count: { select: { papers: true } },
      },
    }),
    prisma.user.count(),
  ]);

  return (
    <div>
      <h1 className="font-serif text-3xl text-ink">Readers</h1>
      <p className="mt-3 max-w-2xl text-muted-fg">
        {total} account{total === 1 ? "" : "s"}. Anyone with an account can
        read full papers and submit their own. Publishing is controlled by
        review, not by who can register.
      </p>

      <form action="/admin/users" role="search" className="mt-6 max-w-sm">
        <label htmlFor="user-search" className="sr-only">
          Search accounts
        </label>
        <input
          id="user-search"
          type="search"
          name="q"
          defaultValue={query}
          placeholder="Search by name or email"
          className="w-full rounded border border-field bg-surface px-3.5 py-2 text-base text-ink outline-none transition-colors placeholder:text-muted-fg focus:border-accent sm:text-sm"
        />
      </form>

      {query && (
        <p role="status" className="mt-4 text-sm text-muted-fg">
          {users.length} match{users.length === 1 ? "" : "es"} for “{query}”.{" "}
          <a
            href="/admin/users"
            className="text-accent transition-colors hover:text-accent-dark"
          >
            Clear
          </a>
        </p>
      )}
      {!query && total > users.length && (
        <p className="mt-4 text-sm text-muted-fg">
          Showing the newest {users.length}; search to find the rest.
        </p>
      )}
      <p className="mt-4 max-w-2xl rounded border border-rule bg-surface px-4 py-3 text-sm text-ink-soft">
        Roles are set by the <code className="text-accent">ADMIN_EMAILS</code>{" "}
        environment variable and re-applied at every sign-in, so they are shown
        here but not editable. Editing the database directly would be undone on the
        user&rsquo;s next login.
      </p>

      {users.length === 0 ? (
        <p className="mt-10 border-t border-rule pt-10 text-muted-fg">
          {query
            ? "No account matches that. Try part of an email address."
            : "Nobody has signed in yet."}
        </p>
      ) : (
        <div className="mt-8 overflow-x-auto">
          <table className="w-full min-w-lg text-left text-sm">
            <thead>
              <tr className="border-y border-rule text-xs uppercase tracking-wider text-muted-fg">
                <th scope="col" className="py-3 pr-4 font-medium">Account</th>
                <th scope="col" className="py-3 pr-4 font-medium">Role</th>
                <th scope="col" className="py-3 pr-4 font-medium">Submissions</th>
                <th scope="col" className="py-3 font-medium">Joined</th>
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
