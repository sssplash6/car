import Link from "next/link";
import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { requireUser } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { PAPER_KIND, PAPER_STATUS } from "@/lib/papers";
import { formatDate } from "@/lib/site";
import { COPY } from "@/lib/content";
import { CleanQuery } from "@/app/_components/CleanQuery";
import { Reveal } from "@/app/_components/motion/Reveal";
import { Button } from "@/app/_components/ui/Button";
import { EmptyState, Notice, StatusMark } from "@/app/_components/ui/Feedback";
import { SubmissionTrack } from "@/app/_components/ui/SubmissionTrack";

export const metadata: Metadata = {
  title: "My submissions",
  robots: { index: false, follow: false },
};

type PageProps = { searchParams: Promise<{ submitted?: string }> };

// An author's ledger (DESIGN.md §9.8): each paper, its status, and — when it
// was returned — the editor's note in full, never clamped.
export default async function SubmissionsPage({ searchParams }: PageProps) {
  const user = await requireUser();
  const { submitted } = await searchParams;
  const copy = COPY.submissions;

  // Scoped by submitterId in the where clause: ownership is a query
  // constraint, not a later check.
  const papers = await prisma.paper.findMany({
    where: { submitterId: user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      slug: true,
      title: true,
      status: true,
      reviewNote: true,
      kind: true,
      coverImage: true,
      updatedAt: true,
      createdAt: true,
      publishedAt: true,
    },
  });

  return (
    <div className="wrap-list page-top page-end">
      <div className="list-head">
        <h1 className="t-h1">{copy.title}</h1>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="md" href="/submit">
            Upload a PDF
          </Button>
          <Button variant="primary" size="md" href="/write">
            Write an article
          </Button>
        </div>
      </div>

      {submitted && (
        <>
          {/* One-shot: CleanQuery strips ?submitted=1 so a refresh does not
              replay it; role=status announces it once. */}
          <Notice tone="good" className="mt-8">
            Received. Your paper is with the editors; you will be emailed when a decision is made.
          </Notice>
          <CleanQuery />
        </>
      )}

      {papers.length === 0 ? (
        <EmptyState
          className="mt-8"
          drawing="apple"
          title={copy.emptyTitle}
          body={copy.emptyBody}
          action={{ href: "/write", label: "Write an article" }}
        />
      ) : (
        <Reveal as="ul" gesture="rows" className="ledger">
          {papers.map((paper, i) => {
            const isArticle = paper.kind === PAPER_KIND.ARTICLE;
            const editable =
              isArticle && (paper.status === PAPER_STATUS.DRAFT || paper.status === PAPER_STATUS.REJECTED);
            const href =
              paper.status === PAPER_STATUS.PUBLISHED
                ? `/p/${paper.slug}`
                : isArticle
                  ? editable
                    ? `/write/${paper.id}`
                    : `/preview/${paper.id}`
                  : null;
            return (
              <li key={paper.id} style={{ "--i": i } as CSSProperties}>
                <div className="ledger-row">
                  {isArticle && paper.coverImage && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={paper.coverImage} alt="" className="ledger-cover" />
                  )}
                  <div className="min-w-0 flex-1">
                    <h2 className="t-h4">
                      {href ? (
                        <Link href={href} className="prose-link">
                          {paper.title || "Untitled draft"}
                        </Link>
                      ) : (
                        paper.title
                      )}
                    </h2>
                    <p className="t-ui-sm mt-1.5 text-ink-3">
                      {isArticle ? "Article" : "Paper"}
                      {" · "}
                      {/* A draft was never submitted; saying so would claim a
                          queue position it does not have. */}
                      {paper.status === PAPER_STATUS.DRAFT
                        ? `edited ${formatDate(paper.updatedAt)}`
                        : `submitted ${formatDate(paper.createdAt)}`}
                      {paper.publishedAt && ` · published ${formatDate(paper.publishedAt)}`}
                      {" · "}
                      {isArticle ? (
                        editable ? (
                          <Link href={`/write/${paper.id}`} className="prose-link">
                            {paper.status === PAPER_STATUS.REJECTED ? "Revise" : "Continue writing"}
                          </Link>
                        ) : (
                          <Link href={`/preview/${paper.id}`} className="prose-link">
                            Preview
                          </Link>
                        )
                      ) : (
                        // Authors can always fetch their own file, so they can
                        // confirm what the editor is reading.
                        <a href={`/api/papers/${paper.id}/file`} className="prose-link">
                          Your PDF
                        </a>
                      )}
                    </p>
                    {paper.status !== PAPER_STATUS.DRAFT && <SubmissionTrack status={paper.status} />}
                  </div>
                  <div className="ledger-side">
                    <StatusMark status={paper.status} />
                  </div>
                </div>

                {/* The note is the whole point of a returned paper: without it
                    the author has no idea what to change. */}
                {paper.status === PAPER_STATUS.REJECTED && (
                  <div className="note-card">
                    <p className="t-meta">{copy.noteLabel}</p>
                    <p className="note-text prose-plain">
                      {paper.reviewNote ?? "The paper was returned for revision without a note."}
                    </p>
                    <div className="mt-3">
                      <Button variant="link" href={isArticle ? `/write/${paper.id}` : "/submit"}>
                        {isArticle ? "Revise the article" : copy.revise}
                      </Button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </Reveal>
      )}
    </div>
  );
}
