import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { PAPER_STATUS } from "@/lib/papers";
import { daysAgo } from "@/lib/site";
import { formatShortDate } from "@/lib/format";
import { Button } from "@/app/_components/ui/Button";
import { Notice, StatusMark } from "@/app/_components/ui/Feedback";

export const metadata: Metadata = {
  title: "Editor's desk",
  robots: { index: false, follow: false },
};

// Overview: one quiet line of counts, the failure notice when it matters, and
// the most recently touched papers. Authorization comes from admin/layout.tsx.
export default async function AdminOverviewPage() {
  const [pending, published, returned, readers, recent, mailFailures] = await Promise.all([
    prisma.paper.count({ where: { status: PAPER_STATUS.SUBMITTED } }),
    prisma.paper.count({ where: { status: PAPER_STATUS.PUBLISHED } }),
    prisma.paper.count({ where: { status: PAPER_STATUS.REJECTED } }),
    prisma.user.count(),
    prisma.paper.findMany({
      orderBy: { updatedAt: "desc" },
      take: 8,
      select: {
        id: true,
        slug: true,
        title: true,
        authorLine: true,
        status: true,
        updatedAt: true,
      },
    }),
    // Surfaced up front because a failed decision email is invisible otherwise:
    // sending is fire-and-forget so a mail outage cannot roll back a publish.
    // Windowed to a week so the notice can actually clear.
    prisma.emailLog.count({ where: { status: "FAILED", createdAt: { gte: daysAgo(7) } } }),
  ]);

  return (
    <div>
      <h2 className="sr-only">Overview</h2>
      <p className="counts t-meta">
        <Link href="/admin/queue" className={pending > 0 ? "text-ink" : undefined}>
          {pending} awaiting review
        </Link>
        <span aria-hidden="true">·</span>
        <Link href="/papers">{published} published</Link>
        <span aria-hidden="true">·</span>
        <span>{returned} returned</span>
        <span aria-hidden="true">·</span>
        <Link href="/admin/users">
          {readers} {readers === 1 ? "reader" : "readers"}
        </Link>
      </p>

      {mailFailures > 0 && (
        <Notice
          tone="bad"
          className="mt-6 max-w-2xl"
          action={
            <Button variant="link" href="/admin/emails">
              Email log
            </Button>
          }
        >
          {mailFailures} notification email{mailFailures === 1 ? "" : "s"} failed to send this
          week. Authors can still see decisions in the app, so nothing is lost.
        </Notice>
      )}

      <section className="mt-12" aria-labelledby="recent-title">
        <h3 id="recent-title" className="t-meta">
          Recent submissions
        </h3>
        {recent.length === 0 ? (
          <p className="t-body mt-4 text-ink-3">No submissions yet.</p>
        ) : (
          <table className="dtable mt-4">
            <thead>
              <tr>
                <th scope="col">Title</th>
                <th scope="col">Authors</th>
                <th scope="col">Status</th>
                <th scope="col">Updated</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((paper) => (
                <tr key={paper.id}>
                  <td className="primary-cell">
                    {paper.status === PAPER_STATUS.PUBLISHED ? (
                      <Link href={`/p/${paper.slug}`} className="prose-link">
                        {paper.title}
                      </Link>
                    ) : (
                      paper.title
                    )}
                  </td>
                  <td data-label="Authors">{paper.authorLine}</td>
                  <td data-label="Status">
                    <StatusMark status={paper.status} />
                  </td>
                  <td data-label="Updated" className="whitespace-nowrap">
                    {formatShortDate(paper.updatedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
