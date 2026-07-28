import Link from "next/link";
import type { Metadata } from "next";
import { requireUser } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { PAPER_STATUS } from "@/lib/papers";
import { formatDate } from "@/lib/site";
import { StatusPill } from "@/app/_components/StatusPill";

export const metadata: Metadata = {
  title: "My submissions",
  robots: { index: false, follow: false },
};

type PageProps = { searchParams: Promise<{ submitted?: string }> };

export default async function SubmissionsPage({ searchParams }: PageProps) {
  const user = await requireUser();
  const { submitted } = await searchParams;

  // Scoped by submitterId in the where clause rather than fetched-and-filtered,
  // per ONBOARDING.md §3 — ownership is a query constraint, not a later check.
  const papers = await prisma.paper.findMany({
    where: { submitterId: user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      slug: true,
      title: true,
      status: true,
      reviewNote: true,
      createdAt: true,
      publishedAt: true,
    },
  });

  return (
    <div>
      <h1 className="font-serif text-3xl text-ink">My submissions</h1>

      {submitted && (
        <p className="mt-6 rounded-md border border-chart-good/40 px-4 py-3 text-sm text-chart-good">
          Received. Your paper is now in the review queue.
        </p>
      )}

      {papers.length === 0 ? (
        <p className="mt-10 border-t border-line pt-10 text-muted-fg">
          You have not submitted anything yet.{" "}
          <Link href="/submit" className="text-brand hover:text-brand-dark">
            Submit a paper
          </Link>
          .
        </p>
      ) : (
        <ul className="mt-10 border-t border-line">
          {papers.map((paper) => (
            <li key={paper.id} className="border-b border-line py-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-serif text-lg text-ink">
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
                  </h2>
                  <p className="mt-1 text-xs text-muted-fg">
                    Submitted {formatDate(paper.createdAt)}
                    {paper.publishedAt &&
                      ` · published ${formatDate(paper.publishedAt)}`}
                  </p>
                </div>
                <StatusPill status={paper.status} />
              </div>

              {/* The reviewer note is the whole point of the REJECTED state —
                  without it the author has no idea what to change. */}
              {paper.status === PAPER_STATUS.REJECTED && paper.reviewNote && (
                <p className="mt-4 border-l-2 border-chart-bad/40 pl-4 text-sm text-ink/80">
                  {paper.reviewNote}
                </p>
              )}

              {/* Authors can always fetch their own file, published or not, so
                  they can confirm what the reviewer is looking at. */}
              <a
                href={`/api/papers/${paper.id}/file`}
                className="mt-3 inline-block text-xs text-brand transition-colors hover:text-brand-dark"
              >
                Download what you uploaded
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
