import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { PAPER_STATUS } from "@/lib/papers";
import { formatDate } from "@/lib/site";
import { ReviewCard } from "@/app/admin/_components/ReviewCard";

export const metadata: Metadata = {
  title: "Review queue",
  robots: { index: false, follow: false },
};

// The queue. Authorization comes from admin/layout.tsx, which wraps every page
// under /admin — the review actions re-check independently.
export default async function QueuePage() {
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
            />
          ))}
        </div>
      )}
    </div>
  );
}
