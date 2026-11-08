import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { formatShortDate } from "@/lib/format";
import { Chip } from "@/app/_components/ui/Chip";
import { Notice } from "@/app/_components/ui/Feedback";
import { SearchField } from "@/app/_components/ui/SearchField";

export const metadata: Metadata = {
  title: "Readers",
  robots: { index: false, follow: false },
};

// Registered accounts, read-only.
//
// Roles are intentionally NOT editable here. ADMIN_EMAILS is the single source
// of truth and is reconciled on every sign-in, so a role changed in the
// database would be silently overwritten at that person's next login — a
// control that looks like it works but does not. Change the env var instead.
type PageProps = { searchParams: Promise<{ q?: string }> };

export default async function AdminUsersPage({ searchParams }: PageProps) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where: query ? { OR: [{ name: { contains: query } }, { email: { contains: query } }] } : undefined,
      orderBy: { createdAt: "desc" },
      take: 200, // the cap is stated below when it bites
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
      <h2 className="sr-only">Readers</h2>
      <p className="t-body max-w-2xl text-ink-3">
        {total} account{total === 1 ? "" : "s"}. Anyone with an account can read full papers and
        submit their own. Publishing is controlled by review, not by who can register.
      </p>

      <div className="mt-6">
        <SearchField
          action="/admin/users"
          id="user-search"
          label="Search accounts"
          defaultValue={query}
          placeholder="Search by name or email"
        />
      </div>

      {query && (
        <p role="status" className="result-line mt-4">
          {users.length} match{users.length === 1 ? "" : "es"} for “{query}” ·{" "}
          <Link href="/admin/users" className="prose-link">
            Clear
          </Link>
        </p>
      )}
      {!query && total > users.length && (
        <p className="result-line mt-4">Showing the newest {users.length}; search to find the rest.</p>
      )}

      <Notice tone="info" role="none" className="mt-6 max-w-2xl">
        Roles are set by the <code className="font-mono text-[0.875em]">ADMIN_EMAILS</code>{" "}
        environment variable and re-applied at every sign-in, so they are shown here but not
        editable. Editing the database directly would be undone at the next login.
      </Notice>

      {users.length === 0 ? (
        <p className="t-body mt-8 text-ink-3">
          {query ? "No account matches that. Try part of an email address." : "Nobody has signed in yet."}
        </p>
      ) : (
        <table className="dtable mt-8">
          <thead>
            <tr>
              <th scope="col">Name</th>
              <th scope="col">Email</th>
              <th scope="col">Role</th>
              <th scope="col">Papers</th>
              <th scope="col">Joined</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td className="primary-cell">{user.name ?? "Not given"}</td>
                <td data-label="Email" className="break-all">
                  {user.email ?? "no email"}
                </td>
                <td data-label="Role">
                  <Chip tone={user.role === "ADMIN" ? "current" : "neutral"}>
                    {user.role === "ADMIN" ? "Editor" : "Reader"}
                  </Chip>
                </td>
                <td data-label="Papers">{user._count.papers}</td>
                <td data-label="Joined" className="whitespace-nowrap">
                  {formatShortDate(user.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
