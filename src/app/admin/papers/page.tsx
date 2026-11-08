import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { PAPER_STATUS } from "@/lib/papers";
import { formatShortDate } from "@/lib/format";
import { PendingButton } from "@/app/_components/PendingButton";
import { StatusMark } from "@/app/_components/ui/Feedback";
import { withdrawPaper } from "@/app/admin/actions";

export const metadata: Metadata = {
  title: "All papers",
  robots: { index: false, follow: false },
};

// Every paper the review has handled, with the decision record: the editors'
// memory. Who decided, and the note that went to the author, stay visible —
// without them past decisions were unreviewable.
export default async function AdminPapersPage() {
  const papers = await prisma.paper.findMany({
    orderBy: { updatedAt: "desc" },
    take: 100, // newest hundred; revisit when the archive outgrows one screenful
    select: {
      id: true,
      slug: true,
      title: true,
      authorLine: true,
      status: true,
      reviewNote: true,
      updatedAt: true,
      reviewer: { select: { email: true, name: true } },
    },
  });

  return (
    <div>
      <h2 className="sr-only">All papers</h2>
      <p className="t-body max-w-2xl text-ink-3">
        Everything the review has handled, newest activity first. Withdrawing a published paper
        returns it to the review queue and takes it off the public site.
      </p>

      {papers.length === 0 ? (
        <p className="t-body mt-8 text-ink-3">No papers yet.</p>
      ) : (
        <table className="dtable mt-8">
          <thead>
            <tr>
              <th scope="col">Title</th>
              <th scope="col">Authors</th>
              <th scope="col">Status</th>
              <th scope="col">Updated</th>
              <th scope="col">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {papers.map((paper) => {
              const reviewer = paper.reviewer?.email ?? paper.reviewer?.name ?? null;
              return (
                <tr key={paper.id}>
                  <td className="primary-cell">
                    {paper.status === PAPER_STATUS.PUBLISHED ? (
                      <Link href={`/p/${paper.slug}`} className="prose-link">
                        {paper.title}
                      </Link>
                    ) : (
                      paper.title
                    )}
                    {reviewer && (
                      <span className="t-ui-sm mt-1 block text-ink-3">Decided by {reviewer}</span>
                    )}
                    {paper.status === PAPER_STATUS.REJECTED && paper.reviewNote && (
                      <span className="t-ui-sm mt-1 block max-w-xl text-ink-2">
                        “{paper.reviewNote}”
                      </span>
                    )}
                  </td>
                  <td data-label="Authors">{paper.authorLine}</td>
                  <td data-label="Status">
                    <StatusMark status={paper.status} />
                  </td>
                  <td data-label="Updated" className="whitespace-nowrap">
                    {formatShortDate(paper.updatedAt)}
                  </td>
                  <td data-label="Actions">
                    {paper.status === PAPER_STATUS.PUBLISHED && (
                      <form action={withdrawPaper}>
                        <input type="hidden" name="id" value={paper.id} />
                        <PendingButton variant="ghost" size="sm" pendingLabel="Withdrawing…">
                          Withdraw
                        </PendingButton>
                      </form>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
