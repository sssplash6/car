import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { PAPER_STATUS } from "@/lib/papers";
import { groupIntoIssues } from "@/lib/issues";
import { isCurrentQuarter } from "@/lib/plates";
import { COPY } from "@/lib/content";
import { Reveal } from "@/app/_components/motion/Reveal";
import { Chip } from "@/app/_components/ui/Chip";
import { EmptyState } from "@/app/_components/ui/Feedback";
import { IssuePlate } from "@/app/_components/ui/IssuePlate";
import { PaperRow } from "@/app/_components/ui/PaperRow";
import { No } from "@/app/_components/ui/Numero";

export const metadata: Metadata = {
  title: "Issues",
  description:
    "The archive of Central Asian Review, gathered into quarterly issues. Abstracts are free to read.",
  alternates: { canonical: "/issues" },
};

// The archive as a run of objects (DESIGN.md §9.3): each issue a spread — its
// plate, sticky beside it on wide screens, and every paper it gathered.
// Issues are derived from publish dates (src/lib/issues.ts), so this page can
// never disagree with /papers. Public and crawlable.
export default async function IssuesPage() {
  const papers = await prisma.paper.findMany({
    where: { status: PAPER_STATUS.PUBLISHED },
    orderBy: { publishedAt: "desc" },
    select: { id: true, slug: true, title: true, authorLine: true, publishedAt: true },
  });

  const issues = groupIntoIssues(
    // publishedAt is always set on PUBLISHED rows; the filter narrows the type
    // rather than trusting the invariant silently.
    papers.flatMap((p) => (p.publishedAt ? [{ ...p, publishedAt: p.publishedAt }] : [])),
  );

  const d = (ms: number) => ({ "--d": `${ms}ms` }) as CSSProperties;

  return (
    <div className="wrap page-top page-end">
      <header className="stack-start">
        <p className="t-meta rise-load">
          The archive · {issues.length} {issues.length === 1 ? "issue" : "issues"}
        </p>
        <h1 className="t-h1 stack-title rise-load" style={d(60)}>
          {COPY.issues.title}
        </h1>
        <p className="t-lede stack-lede rise-load" style={d(160)}>
          {COPY.issues.lede}
        </p>
      </header>

      {issues.length === 0 ? (
        <EmptyState
          className="mt-16"
          drawing="tulip"
          title={COPY.issues.emptyTitle}
          body={COPY.issues.emptyBody}
          action={{ href: "/papers", label: COPY.about.readers.action }}
        />
      ) : (
        <div className="spreads">
          {issues.map((issue) => {
            const current = isCurrentQuarter(issue.year, issue.quarter);
            const count = issue.papers.length;
            return (
              <section
                key={issue.anchor}
                id={issue.anchor}
                className="spread"
                aria-labelledby={`${issue.anchor}-title`}
              >
                <Reveal gesture="settle" className="plate-col">
                  <IssuePlate
                    issue={{ ...issue, paperCount: count }}
                    variant="spread"
                    current={current}
                    carry="always"
                  />
                </Reveal>
                <div>
                  <Reveal>
                    <div className="spread-head">
                      <p className="t-meta">
                        <No /> {issue.number} · {count} {count === 1 ? "paper" : "papers"}
                      </p>
                      {current && <Chip tone="current">{COPY.issues.current}</Chip>}
                    </div>
                    <h2 id={`${issue.anchor}-title`} className="t-h2">
                      {issue.label}
                    </h2>
                  </Reveal>
                  <Reveal as="ol" gesture="rows" className="rows">
                    {issue.papers.map((paper, i) => (
                      <PaperRow key={paper.id} paper={paper} index={i} />
                    ))}
                  </Reveal>
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
