import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { PAPER_STATUS } from "@/lib/papers";
import { groupIntoIssues, tashkentQuarter } from "@/lib/issues";
import { formatDate } from "@/lib/site";
import { Diamond, IkatDivider, Rosette } from "@/app/_components/Ornament";
import { Reveal } from "@/app/_components/Reveal";

export const metadata: Metadata = {
  title: "Issues",
  description:
    "The archive of Central Asian Review, gathered into quarterly issues. Abstracts are free to read.",
  alternates: { canonical: "/issues" },
};

// The archive, read as quarterly issues. Public and crawlable like the rest of
// the reading surfaces — no auth check. Issues are derived from publish dates
// (src/lib/issues.ts), so this page can never disagree with /papers.
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
    <div className="mx-auto w-full max-w-5xl px-6 py-12">
      <header className="max-w-2xl">
        <p className="eyebrow">The archive</p>
        <h1 className="display-flush mt-3 font-serif text-[clamp(2.5rem,1.5rem+3vw,3.25rem)] leading-[1.05] tracking-tight text-ink">
          Issues
        </h1>
        <p className="mt-4 leading-relaxed text-ink-soft">
          The review publishes on a rolling basis; each quarter&apos;s papers are
          gathered here as an issue.{" "}
          {issues.length > 0 &&
            `${issues.length} issue${issues.length === 1 ? "" : "s"} so far.`}
        </p>
      </header>

      <IkatDivider className="mt-10 text-tile" />

      {issues.length === 0 ? (
        <div className="py-16 text-center">
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
        <div>
          {issues.map((issue, i) => {
            const open =
              issue.year === now.year && issue.quarter === now.quarter;
            return (
              <Reveal key={issue.anchor} delay={Math.min(i * 0.05, 0.15)}>
                <section
                  id={issue.anchor}
                  aria-labelledby={`${issue.anchor}-title`}
                  className={`grid gap-6 py-12 lg:grid-cols-[15rem_1fr] lg:gap-12 ${
                    i > 0 ? "border-t border-rule-strong" : ""
                  }`}
                >
                  <div>
                    <p
                      id={`${issue.anchor}-title`}
                      className="oldstyle-nums font-serif text-[3.25rem] leading-none tracking-tight text-accent"
                    >
                      № {issue.number}
                    </p>
                    <p className="mt-2 font-serif text-xl text-ink">
                      {issue.label}
                    </p>
                    <p className="mt-1.5 text-sm text-muted-fg">
                      {issue.papers.length} paper
                      {issue.papers.length === 1 ? "" : "s"}
                    </p>
                    {open && (
                      <p className="mt-3 flex items-center gap-2 text-sm text-ember">
                        <Diamond />
                        Open — gathering this quarter&apos;s papers
                      </p>
                    )}
                  </div>

                  <ol>
                    {issue.papers.map((paper) => (
                      <li
                        key={paper.id}
                        className="border-b border-rule py-5 first:pt-0 last:border-b-0"
                      >
                        <h3 className="font-serif text-xl leading-snug">
                          <Link
                            href={`/p/${paper.slug}`}
                            className="text-ink transition-colors hover:text-accent"
                          >
                            {paper.title}
                          </Link>
                        </h3>
                        <p className="mt-1.5 text-sm text-muted-fg">
                          {paper.authorLine} · {formatDate(paper.publishedAt)}
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
