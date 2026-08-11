import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { PAPER_STATUS } from "@/lib/papers";
import { formatDate } from "@/lib/site";
import { ReviewCard } from "@/app/admin/_components/ReviewCard";

export const metadata: Metadata = {
  title: "Review queue",
  robots: { index: false, follow: false },
};

type PageProps = { searchParams: Promise<{ notice?: string }> };

/** Whole days between a submission and now — the queue's staleness cue. */
function daysSince(date: Date): number {
  return Math.floor((Date.now() - date.getTime()) / (24 * 60 * 60 * 1000));
}

// The queue. Authorization comes from admin/layout.tsx, which wraps every page
// under /admin — the review actions re-check independently.
export default async function QueuePage({ searchParams }: PageProps) {
  const { notice } = await searchParams;

  const queue = await prisma.paper.findMany({
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
  });

  return (
    <div>
      <h1 className="font-serif text-3xl text-ink">Review queue</h1>
      <p className="mt-3 text-muted-fg">
        {queue.length === 0
          ? "Nothing is waiting for review."
          : `${queue.length} paper${queue.length === 1 ? "" : "s"} awaiting a decision, oldest first.`}
      </p>

      {notice === "already-decided" && (
        // Where a decision on a stale card lands: without this the button
        // just went dead and the editor had no idea their click did nothing.
        <p
          role="status"
          className="mt-4 max-w-2xl rounded border border-rule bg-surface px-4 py-3 text-sm text-ink-soft"
        >
          That paper had already been decided, most likely by another editor
          or an older tab. The queue below is current.
        </p>
      )}

      {queue.length > 0 && (
        <div className="mt-10 space-y-10 border-t border-rule pt-10">
          {queue.map((paper) => (
            <ReviewCard
              key={paper.id}
              id={paper.id}
              title={paper.title}
              abstract={paper.abstract}
              authorLine={paper.authorLine}
              submitterLabel={
                paper.submitter.email ?? paper.submitter.name ?? "unknown"
              }
              submittedAt={
                paper.submittedAt ? formatDate(paper.submittedAt) : "an unrecorded date"
              }
              waitingDays={paper.submittedAt ? daysSince(paper.submittedAt) : null}
            />
          ))}
        </div>
      )}
    </div>
  );
}
