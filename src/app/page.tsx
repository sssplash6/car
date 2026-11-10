import { prisma } from "@/lib/prisma";
import { PAPER_STATUS } from "@/lib/papers";
import { issueFor, tashkentQuarter } from "@/lib/issues";
import { isCurrentQuarter } from "@/lib/plates";
import { COPY } from "@/lib/content";
import { Drawing } from "@/app/_components/illustrations/Drawing";
import { Reveal } from "@/app/_components/motion/Reveal";
import { ScrollFill } from "@/app/_components/motion/ScrollFill";
import { Button } from "@/app/_components/ui/Button";
import { EmptyState } from "@/app/_components/ui/Feedback";
import { HeadlineStack } from "@/app/_components/ui/HeadlineStack";
import { IssuePlate } from "@/app/_components/ui/IssuePlate";
import { Mark } from "@/app/_components/ui/Mark";
import { PaperRow } from "@/app/_components/ui/PaperRow";
import { No } from "@/app/_components/ui/Numero";

// Home (DESIGN.md §9.1): one statement, one horizon, the current issue, the
// editors' one sentence. No auth check anywhere here: this page and the
// abstract pages are the site's entire search presence.
//
// Order: hero (page) → the current issue (inset band) → the editors'
// statement (page) → the footer, whose first row is the call for submissions.

const ROWS = 6;

export default async function HomePage() {
  const { hero, issue: issueCopy, editorial } = COPY.home;

  const [recent, allDates] = await Promise.all([
    prisma.paper.findMany({
      where: { status: PAPER_STATUS.PUBLISHED },
      orderBy: { publishedAt: "desc" },
      take: ROWS,
      select: { id: true, slug: true, title: true, authorLine: true, publishedAt: true },
    }),
    // One indexed column for the whole archive: the issue number is derived
    // against every publish date, so home can never disagree with /issues.
    prisma.paper.findMany({
      where: { status: PAPER_STATUS.PUBLISHED },
      select: { publishedAt: true },
    }),
  ]);

  const dates = allDates.flatMap((p) => (p.publishedAt ? [p.publishedAt] : []));
  const newest = recent[0]?.publishedAt ?? null;

  // The current issue: the newest paper's quarter.
  const current = newest
    ? (() => {
        const found = issueFor(dates, newest);
        if (!found) return null;
        const { year, quarter } = tashkentQuarter(newest);
        const key = (d: Date) => {
          const q = tashkentQuarter(d);
          return q.year * 4 + q.quarter;
        };
        return {
          ...found,
          year,
          quarter,
          paperCount: dates.filter((d) => key(d) === year * 4 + quarter).length,
          papers: recent.filter((p) => p.publishedAt && key(p.publishedAt) === year * 4 + quarter),
        };
      })()
    : null;

  const issueHref = current ? `/issues#${current.anchor}` : "/papers";

  return (
    <>
      <section className="hero wrap" aria-labelledby="hero-title">
        <HeadlineStack
          align="center"
          size="display"
          rise="load"
          words
          blur
          titleId="hero-title"
          eyebrow={
            current ? (
              <>
                <No /> {current.number} · {current.label}
              </>
            ) : undefined
          }
          eyebrowHref={current ? issueHref : undefined}
          title={hero.title}
          deck={hero.deck}
          lede={hero.body}
          actions={
            <>
              <Button variant="primary" size="lg" href={issueHref}>
                {current ? hero.primary : COPY.papers.title}
              </Button>
              <Button variant="secondary" size="lg" href="/submit">
                {hero.secondary}
              </Button>
            </>
          }
        />
      </section>

      {/* The horizon: the steppe camp under the Tian Shan, the turbines and
          the new city, the train between them. Drawn on first paint, left to
          right, drifting 40px over the first screen of scroll. Decorative. */}
      <div className="wrap">
        <div className="horizon-wrap">
          <Drawing
            name="horizon"
            size="hero"
            draw="load"
            delay={200}
            stagger={34}
            preserveAspectRatio="xMidYMid slice"
          />
        </div>
      </div>

      <section className="band" aria-labelledby="issue-title">
        {current ? (
          <div className="wrap band-grid">
            <Reveal gesture="settle">
              <IssuePlate
                issue={current}
                variant="hero"
                href={issueHref}
                current={isCurrentQuarter(current.year, current.quarter)}
                carry="click"
              />
            </Reveal>
            <div>
              <Reveal className="band-head">
                <p className="t-meta">
                  <No /> {current.number} · {current.paperCount}{" "}
                  {current.paperCount === 1 ? "paper" : "papers"}
                </p>
                <h2 id="issue-title" className="t-h2">
                  {current.label}
                </h2>
              </Reveal>
              <Reveal as="ol" gesture="rows" className="rows">
                {current.papers.map((paper, i) => (
                  <PaperRow key={paper.id} paper={paper} index={i} className={i >= 4 ? "max-md:hidden" : undefined} />
                ))}
              </Reveal>
              <div className="band-links">
                <Button variant="link" href="/issues">
                  {issueCopy.allIssues}
                </Button>
                <Button variant="link" href="/papers">
                  {issueCopy.allPapers}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="wrap">
            <h2 id="issue-title" className="sr-only">
              {COPY.issues.title}
            </h2>
            <EmptyState
              drawing="tulip"
              title={issueCopy.emptyTitle}
              body={issueCopy.emptyBody}
              action={{ href: "/submit", label: hero.secondary }}
              headingLevel={3}
            />
          </div>
        )}
      </section>

      <section className="statement wrap" aria-labelledby="statement-label">
        <Mark size={96} draw="view" className="mark-big" />
        <ScrollFill text={editorial.statement} className="t-statement" />
        <div className="attrib">
          <span className="t-meta" id="statement-label">
            {editorial.attribution}
          </span>
          <Button variant="link" href="/about">
            {editorial.link}
          </Button>
        </div>
      </section>
    </>
  );
}
