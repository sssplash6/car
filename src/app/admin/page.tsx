import Link from "next/link";
import type { Metadata } from "next";
import { requireAdmin } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { PAPER_STATUS } from "@/lib/papers";
import { formatDate } from "@/lib/site";
import { StatusPill } from "@/app/_components/StatusPill";
import { ReviewCard } from "@/app/admin/_components/ReviewCard";

export const metadata: Metadata = {
  title: "Review queue",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  // Redirects non-admins to "/". This is the real /admin gate: the proxy only
  // knows whether someone is signed in, not what role they hold.
  await requireAdmin();

  const [queue, decided] = await Promise.all([
    prisma.paper.findMany({
      where: { status: PAPER_STATUS.SUBMITTED },
      orderBy: { submittedAt: "asc" }, // oldest first — a queue, not a feed
      select: {
        id: true,
        title: true,
        abstract: true,
        authorLine: true,
        submittedAt: true,
        submitter: { select: { email: true, name: true } },
      },
    }),
    prisma.paper.findMany({
      where: { status: { in: [PAPER_STATUS.PUBLISHED, PAPER_STATUS.REJECTED] } },
      orderBy: { updatedAt: "desc" },
      take: 25, // recent decisions only; this page is for acting, not archiving
      select: {
        id: true,
        slug: true,
        title: true,
        status: true,
        updatedAt: true,
      },
    }),
  ]);

  return (
    <div>
      <h1 className="font-serif text-3xl text-ink">Review queue</h1>
      <p className="mt-3 text-muted-fg">
        {queue.length === 0
          ? "Nothing is waiting for review."
          : `${queue.length} paper${queue.length === 1 ? "" : "s"} awaiting a decision.`}
      </p>

      {queue.length > 0 && (
        <div className="mt-10 space-y-10 border-t border-line pt-10">
          {queue.map((paper) => (
            <ReviewCard
              key={paper.id}
              id={paper.id}
              title={paper.title}
              abstract={paper.abstract}
              authorLine={paper.authorLine}
              submitterLabel={paper.submitter.email ?? paper.submitter.name ?? "unknown"}
              submittedAt={paper.submittedAt ? formatDate(paper.submittedAt) : "—"}
            />
          ))}
        </div>
      )}

      {decided.length > 0 && (
        <section className="mt-16">
          <h2 className="font-serif text-xl text-ink">Recent decisions</h2>
          <ul className="mt-6 border-t border-line">
            {decided.map((paper) => (
              <li
                key={paper.id}
                className="flex items-center justify-between gap-4 border-b border-line py-4"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm text-ink">
                    {paper.status === PAPER_STATUS.PUBLISHED ? (
                      <Link
                        href={`/p/${paper.slug}`}
                        className="transition-colors hover:text-brand"
                      >
                        {paper.title}
                      </Link>
                    ) : (
                      paper.title
                    )}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-fg">
                    {formatDate(paper.updatedAt)}
                  </p>
                </div>
                <StatusPill status={paper.status} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
