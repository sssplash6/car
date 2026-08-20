import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { PAPER_STATUS } from "@/lib/papers";
import { groupIntoIssues, tashkentQuarter } from "@/lib/issues";
import { formatDate } from "@/lib/site";
import { Diamond, IkatDivider, Rosette } from "@/app/_components/Ornament";
import { IssueCover } from "@/app/_components/IssueCover";
import { Reveal } from "@/app/_components/Reveal";

export const metadata: Metadata = {
  title: "Issues",
  description:
    "The archive of Central Asian Review, gathered into quarterly issues. Abstracts are free to read.",
  alternates: { canonical: "/issues" },
};

// The archive as a SHELF.
//
// The page used to repeat one shape — cover, contents, rule — down its whole
// length, which reads as a list of issues rather than as a run of volumes. It
// now opens on the shelf itself: every issue stood up in perspective, tipped
// back a few degrees, the one under the pointer pulled half out the way you
// pull a book to read its spine (.shelf / .volume in globals.css, transform
// only). The contents follow below, each register headed by its own numeral in
// the margin instead of a second copy of the same cover.
//
// Issues are derived from publish dates (src/lib/issues.ts), so this page can
// never disagree with /papers. Public and crawlable — no auth check.
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
  const isOpen = (issue: (typeof issues)[number]) =>
    issue.year === now.year && issue.quarter === now.quarter;

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
        <>
          {/* ---- The shelf ---- */}
          <section aria-labelledby="shelf-heading" className="mt-12">
            <h2 id="shelf-heading" className="sr-only">
              The volumes
            </h2>
            <Reveal>
              {/* Horizontally scrollable so a long run of volumes never
                  squeezes; the generous padding is what keeps a volume from
                  being clipped as it comes forward, since a scroll container
                  clips in both axes. */}
              <div className="shelf -mx-6 flex snap-x gap-8 overflow-x-auto px-6 pb-10 pt-4 sm:gap-10">
                {issues.map((issue, i) => (
                  <Link
                    key={issue.anchor}
                    href={`#${issue.anchor}`}
                    aria-label={`Issue № ${issue.number}, ${issue.label} — ${issue.papers.length} paper${issue.papers.length === 1 ? "" : "s"}`}
                    className="volume relative w-[10.5rem] shrink-0 snap-start sm:w-[12.5rem]"
                    // Hand-shelved rather than machine-stacked: the tilt
                    // wanders a degree either side so the run reads as objects
                    // someone put there.
                    style={
                      {
                        "--tilt": `${22 + ((i * 7) % 5) - 2}deg`,
                      } as React.CSSProperties
                    }
                  >
                    {/* The board you see because the volume is turned, and
                        the shadow it drops on the shelf behind it. */}
                    <span aria-hidden="true" className="volume-spine" />
                    <span aria-hidden="true" className="volume-shadow" />
                    <IssueCover
                      number={issue.number}
                      label={issue.label}
                      paperCount={issue.papers.length}
                      open={isOpen(issue)}
                      className="volume-face max-w-none"
                      headingLevel="p"
                    />
                  </Link>
                ))}
              </div>
            </Reveal>
            {/* The shelf board: the volumes have to stand on something. */}
            <div aria-hidden="true" className="shelf-board" />
            <p className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-muted-fg">
              <span className="oldstyle-nums">
                {issues.length} volume{issues.length === 1 ? "" : "s"}
              </span>
              {issues.some(isOpen) && (
                <span className="flex items-center gap-2 text-ember">
                  <Diamond />
                  The newest is still open, gathering this quarter&apos;s papers
                </span>
              )}
            </p>
          </section>

          <Reveal flat>
            <IkatDivider className="rule-draw mt-14 text-tile" />
          </Reveal>

          {/* ---- The registers ---- */}
          <div>
            {issues.map((issue, i) => {
              const open = isOpen(issue);
              return (
                <Reveal key={issue.anchor} flat>
                  <section
                    id={issue.anchor}
                    aria-labelledby={`${issue.anchor}-title`}
                    className={`grid gap-x-14 gap-y-6 py-12 lg:grid-cols-[11rem_1fr] lg:py-16 ${
                      i > 0 ? "border-t border-rule-strong" : ""
                    }`}
                  >
                    {/* The volume's numeral holds the margin while its papers
                        scroll — a running folio, the same grammar the papers
                        index uses for its years. */}
                    <div className="lg:sticky lg:top-[calc(var(--head-h)+2.5rem)] lg:self-start">
                      <h2
                        id={`${issue.anchor}-title`}
                        className="oldstyle-nums display-flush font-serif text-[clamp(3rem,2rem+3vw,4.5rem)] leading-none tracking-tight text-ink"
                      >
                        <span className="mr-1 align-top text-[0.4em] leading-none text-muted-fg">
                          №
                        </span>
                        {issue.number}
                      </h2>
                      <p className="mt-3 font-serif text-xl text-ink-soft">
                        {issue.label}
                      </p>
                      <p className="oldstyle-nums mt-1 text-sm text-muted-fg">
                        {issue.papers.length} paper
                        {issue.papers.length === 1 ? "" : "s"}
                      </p>
                      {open && (
                        <p className="mt-3 flex max-w-[11rem] items-center gap-2 text-sm text-ember">
                          <Diamond />
                          Open — gathering this quarter
                        </p>
                      )}
                    </div>

                    {/* The contents leaf: title, leader dots, locator date. */}
                    <ol className="lg:border-l lg:border-rule lg:pl-12">
                      {issue.papers.map((paper, row) => (
                        <li
                          key={paper.id}
                          className="folio-row mark-margin border-b border-rule py-5 first:pt-0 last:border-b-0"
                          style={{ "--i": row } as React.CSSProperties}
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
        </>
      )}
    </div>
  );
}
