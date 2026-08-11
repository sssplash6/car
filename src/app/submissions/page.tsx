import Link from "next/link";
import type { Metadata } from "next";
import { requireUser } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { PAPER_STATUS } from "@/lib/papers";
import { formatDate } from "@/lib/site";
import { StatusPill } from "@/app/_components/StatusPill";
import { PageShell } from "@/app/_components/PageShell";
import { CleanQuery } from "@/app/_components/CleanQuery";
import { Rosette } from "@/app/_components/Ornament";

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
    <PageShell>
      <h1 className="font-serif text-4xl text-ink">My submissions</h1>

      {submitted && (
        <>
          {/* One-shot banner: CleanQuery strips ?submitted=1 so a refresh or
              bookmark does not replay it; role=status announces it once. */}
          <p
            role="status"
            className="mt-6 rounded border border-state-good/40 px-4 py-3 text-sm text-state-good"
          >
            Received. Your paper is with the editors; you will be emailed when
            a decision is made.
          </p>
          <CleanQuery />
        </>
      )}

      {papers.length === 0 ? (
        <div className="mt-10 border-t border-rule py-14 text-center">
          <Rosette className="mx-auto size-12 text-rule-strong" />
          <h2 className="mt-6 font-serif text-2xl text-ink">
            Nothing submitted yet
          </h2>
          <p className="mx-auto mt-3 max-w-md leading-relaxed text-muted-fg">
            Papers you submit appear here with their review status.
          </p>
          <Link
            href="/submit"
            className="mt-6 inline-block text-sm text-accent transition-colors hover:text-accent-dark"
          >
            Submit a paper
          </Link>
        </div>
      ) : (
        <ul className="mt-10 border-t border-rule">
          {papers.map((paper) => (
            <li key={paper.id} className="border-b border-rule py-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-serif text-lg text-ink">
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
                  </h2>
                  <p className="mt-1 text-xs text-muted-fg">
                    {/* A draft was never submitted; saying so would claim a
                        queue position it does not have. */}
                    {paper.status === PAPER_STATUS.DRAFT ? "Started" : "Submitted"}{" "}
                    {formatDate(paper.createdAt)}
                    {paper.publishedAt &&
                      ` · published ${formatDate(paper.publishedAt)}`}
                  </p>
                </div>
                <StatusPill status={paper.status} />
              </div>

              {/* The reviewer note is the whole point of the REJECTED state —
                  without it the author has no idea what to change. Attributed
                  and framed like the site's other notices (full border, no
                  side-stripe). */}
              {paper.status === PAPER_STATUS.REJECTED && (
                <div className="mt-4 max-w-xl rounded border border-state-bad/40 px-4 py-3">
                  <p className="text-xs font-medium text-state-bad">
                    Note from the editor
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-ink/80">
                    {paper.reviewNote ??
                      "The paper was returned for revision without a note."}
                  </p>
                  <Link
                    href="/submit"
                    className="mt-2.5 inline-block text-sm text-accent transition-colors hover:text-accent-dark"
                  >
                    Submit a revised version
                  </Link>
                </div>
              )}

              {/* Authors can always fetch their own file, published or not, so
                  they can confirm what the reviewer is looking at. */}
              <a
                href={`/api/papers/${paper.id}/file`}
                className="mt-3 inline-block text-sm text-accent transition-colors hover:text-accent-dark"
              >
                Download what you uploaded
              </a>
            </li>
          ))}
        </ul>
      )}
    </PageShell>
  );
}
