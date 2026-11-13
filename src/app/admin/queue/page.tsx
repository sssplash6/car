import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { PAPER_KIND, PAPER_STATUS } from "@/lib/papers";
import { bodyText, countWords, parseBody } from "@/lib/article/document";
import { formatDate } from "@/lib/site";
import { EmptyState, Notice } from "@/app/_components/ui/Feedback";
import { ReviewCard } from "@/app/admin/_components/ReviewCard";

export const metadata: Metadata = {
  title: "Review queue",
  robots: { index: false, follow: false },
};

type PageProps = { searchParams: Promise<{ notice?: string }> };

/** Whole days between a submission and now: the queue's staleness cue. */
function daysSince(date: Date): number {
  return Math.floor((Date.now() - date.getTime()) / (24 * 60 * 60 * 1000));
}

// The queue, oldest first. Authorization comes from admin/layout.tsx; the
// review actions re-check independently.
export default async function QueuePage({ searchParams }: PageProps) {
  const { notice } = await searchParams;

  const queue = await prisma.paper.findMany({
    where: { status: PAPER_STATUS.SUBMITTED },
    orderBy: { submittedAt: "asc" }, // a queue, not a feed
    select: {
      id: true,
      title: true,
      abstract: true,
      authorLine: true,
      fileSize: true,
      kind: true,
      subtitle: true,
      coverImage: true,
      body: true,
      submittedAt: true,
      submitter: { select: { email: true, name: true } },
    },
  });

  return (
    <div>
      <h2 className="sr-only">Review queue</h2>

      {notice === "already-decided" && (
        // Where a decision on a stale card lands: without it the button just
        // went dead and the editor had no idea their click did nothing.
        <Notice tone="info" className="mb-6 max-w-2xl">
          That paper had already been decided, most likely by another editor or an older tab. The
          queue below is current.
        </Notice>
      )}

      {queue.length === 0 ? (
        <EmptyState drawing="apple" title="Nothing waiting" body="New submissions appear here." />
      ) : (
        <>
          <p className="t-body text-ink-3">
            {queue.length} submission{queue.length === 1 ? "" : "s"} awaiting a decision, oldest first.
          </p>
          <div className="mt-8 grid gap-6">
            {queue.map((paper) => (
              <ReviewCard
                key={paper.id}
                id={paper.id}
                title={paper.title}
                abstract={paper.abstract}
                authorLine={paper.authorLine}
                fileSize={paper.fileSize}
                article={
                  paper.kind === PAPER_KIND.ARTICLE
                    ? {
                        subtitle: paper.subtitle,
                        coverImage: paper.coverImage,
                        words: countWords(bodyText(parseBody(paper.body))),
                      }
                    : null
                }
                submitterLabel={paper.submitter.email ?? paper.submitter.name ?? "unknown"}
                submittedAt={paper.submittedAt ? formatDate(paper.submittedAt) : "an unrecorded date"}
                waitingDays={paper.submittedAt ? daysSince(paper.submittedAt) : null}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
