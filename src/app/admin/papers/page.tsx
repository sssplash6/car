import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { PAPER_STATUS } from "@/lib/papers";
import { formatDate } from "@/lib/site";
import { StatusPill } from "@/app/_components/StatusPill";
import { PendingButton } from "@/app/_components/PendingButton";
import { withdrawPaper } from "@/app/admin/actions";

export const metadata: Metadata = {
  title: "All papers",
  robots: { index: false, follow: false },
};

// Every paper the review has ever handled, with the decision record. This is
// the editors' memory: the queue shows only what is pending, and before this
// page existed there was no way to see what was decided, when, or what note
// was sent — and no way back from a misclicked Publish.
export default async function AdminPapersPage() {
  const papers = await prisma.paper.findMany({
    orderBy: { updatedAt: "desc" },
    take: 100, // newest hundred; revisit when the archive outgrows one screenful
    select: {
      id: true,
      slug: true,
      title: true,
      status: true,
      reviewNote: true,
      updatedAt: true,
      publishedAt: true,
      submitter: { select: { email: true, name: true } },
      reviewer: { select: { email: true, name: true } },
    },
  });

  return (
    <div>
      <h1 className="font-serif text-3xl text-ink">All papers</h1>
      <p className="mt-3 max-w-2xl text-muted-fg">
        Everything the review has handled, newest activity first, with the
        decision record. Withdrawing a published paper returns it to the
        review queue and takes it off the public site.
      </p>

      {papers.length === 0 ? (
        <p className="mt-10 border-t border-rule pt-10 text-muted-fg">
          No papers yet.
        </p>
      ) : (
        <ul className="mt-8 border-t border-rule">
          {papers.map((paper) => {
            const reviewerLabel =
              paper.reviewer?.email ?? paper.reviewer?.name ?? null;
            return (
              <li key={paper.id} className="border-b border-rule py-5">
                <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2">
                  <div className="min-w-0">
                    <p className="text-sm text-ink">
                      {paper.status === PAPER_STATUS.PUBLISHED ? (
                        <Link
                          href={`/p/${paper.slug}`}
                          className="transition-colors hover:text-accent"
                        >
                          {paper.title}
                        </Link>
                      ) : (
                        paper.title
                      )}
                    </p>
                    <p className="mt-1 text-xs text-muted-fg">
                      {paper.submitter.email ??
                        paper.submitter.name ??
                        "unknown"}{" "}
                      · {formatDate(paper.updatedAt)}
                      {reviewerLabel && ` · decided by ${reviewerLabel}`}
                    </p>
                    {/* The note that went to the author is part of the record;
                        losing it made past decisions unreviewable. */}
                    {paper.status === PAPER_STATUS.REJECTED &&
                      paper.reviewNote && (
                        <p className="mt-2 max-w-xl text-xs leading-relaxed text-ink-soft">
                          “{paper.reviewNote}”
                        </p>
                      )}
                  </div>
                  <div className="flex shrink-0 items-center gap-4">
                    <StatusPill status={paper.status} />
                    {paper.status === PAPER_STATUS.PUBLISHED && (
                      <form action={withdrawPaper}>
                        <input type="hidden" name="id" value={paper.id} />
                        <PendingButton
                          pendingLabel="Withdrawing…"
                          className="rounded border border-rule-strong px-3 py-1.5 text-xs font-medium text-ink-soft transition-colors hover:border-state-bad hover:text-state-bad"
                        >
                          Withdraw
                        </PendingButton>
                      </form>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
