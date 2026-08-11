import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { PAPER_STATUS } from "@/lib/papers";
import { groupIntoIssues, tashkentQuarter } from "@/lib/issues";
import { formatDate } from "@/lib/site";
import { Diamond, Rosette } from "@/app/_components/Ornament";
import { IssueCover } from "@/app/_components/IssueCover";
import { Reveal } from "@/app/_components/Reveal";

export const metadata: Metadata = {
  title: "Issues",
  description:
    "The archive of Central Asian Review, gathered into quarterly issues. Abstracts are free to read.",
  alternates: { canonical: "/issues" },
};

// The archive, read as a shelf of bound quarterlies: each issue is a cover
// (IssueCover — the night-tile material the homepage hero and footer own)
// beside its contents leaf, a ruled register with dot leaders. Issues are
// derived from publish dates (src/lib/issues.ts), so this page can never
// disagree with /papers. Public and crawlable — no auth check.
//
// No IkatDivider here: the covers carry the page's ornament budget, and a
// divider stacked above them would put two ornaments in one viewport.
export default async function IssuesPage() {
  const papers = await prisma.paper.findMany({
    where: { status: PAPER_STATUS.PUBLISHED },
    orderBy: { publishedAt: "desc" },
    select: {
      id: true,
      slug: true,
      title: true,
      authorLine: true,
      publishedAt: true,
    },
  });

  const issues = groupIntoIssues(
    // publishedAt is always set on PUBLISHED rows; the filter narrows the type
    // rather than trusting the invariant silently.
    papers.flatMap((p) => (p.publishedAt ? [{ ...p, publishedAt: p.publishedAt }] : [])),
  );

  // "Open" marks the quarter still receiving papers, so the newest issue reads
  // as a living thing rather than an already-sealed volume.
  const now = tashkentQuarter(new Date());

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-12">
      <header className="max-w-2xl">
        <p className="eyebrow">The archive</p>
        <h1 className="display-flush mt-3 font-serif text-[clamp(2.75rem,1.6rem+4.2vw,4.75rem)] leading-[1.02] tracking-tight text-ink">
          Issues
        </h1>
        <p className="mt-5 leading-relaxed text-ink-soft">
          The review publishes on a rolling basis; each quarter&apos;s papers are
          gathered here as an issue.{" "}
          {issues.length > 0 &&
            `${issues.length} issue${issues.length === 1 ? "" : "s"} so far.`}
        </p>
      </header>

      {issues.length === 0 ? (
        <div className="mt-10 border-t border-rule py-16 text-center">
          <Rosette className="mx-auto size-12 text-rule-strong" />
          <h2 className="mt-6 font-serif text-2xl text-ink">
            The first issue is still being written
          </h2>
          <p className="mx-auto mt-3 max-w-md leading-relaxed text-muted-fg">
            Papers appear here the quarter they clear review.
          </p>
          <Link
            href="/submit"
            className="mt-6 inline-block text-sm text-accent transition-colors hover:text-accent-dark"
          >
            Submit a paper
          </Link>
        </div>
      ) : (
        <div className="mt-6">
          {issues.map((issue, i) => {
            const open =
              issue.year === now.year && issue.quarter === now.quarter;
            return (
              <Reveal key={issue.anchor}>
                <section
                  id={issue.anchor}
                  aria-labelledby={`${issue.anchor}-title`}
                  className={`grid gap-x-14 gap-y-8 py-14 lg:grid-cols-[13rem_1fr] lg:py-16 ${
                    i > 0 ? "border-t border-rule-strong" : ""
                  }`}
                >
                  {/* The volume holds the margin while its papers scroll. */}
                  <div className="lg:sticky lg:top-10 lg:self-start">
                    <IssueCover
                      number={issue.number}
                      label={issue.label}
                      paperCount={issue.papers.length}
                      open={open}
                      anchorId={`${issue.anchor}-title`}
                    />
                    {open && (
                      <p className="mt-4 flex max-w-[13rem] items-center gap-2 text-sm text-ember">
                        <Diamond />
                        Open — gathering this quarter&apos;s papers
                      </p>
                    )}
                  </div>

                  {/* The contents leaf: title, leader dots, locator date. */}
                  <ol className="lg:border-l lg:border-rule lg:pl-12">
                    {issue.papers.map((paper) => (
                      <li
                        key={paper.id}
                        className="border-b border-rule py-5 first:pt-0 last:border-b-0"
                      >
                        <div className="flex items-baseline">
                          <h3 className="min-w-0 font-serif text-xl leading-snug">
                            <Link
                              href={`/p/${paper.slug}`}
                              className="title-link text-ink hover:text-accent"
                            >
                              {paper.title}
                            </Link>
                          </h3>
                          <span aria-hidden="true" className="leader" />
                          <span className="oldstyle-nums whitespace-nowrap text-sm text-muted-fg max-sm:hidden">
                            {formatDate(paper.publishedAt)}
                          </span>
                        </div>
                        <p className="mt-1.5 text-sm text-muted-fg">
                          {paper.authorLine}
                          <span className="sm:hidden">
                            {" · "}
                            {formatDate(paper.publishedAt)}
                          </span>
                        </p>
                      </li>
                    ))}
                  </ol>
                </section>
              </Reveal>
            );
          })}
        </div>
      )}
    </div>
  );
}
