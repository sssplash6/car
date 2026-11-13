import Link from "next/link";
import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { PAPER_STATUS } from "@/lib/papers";
import { issueFor, tashkentQuarter } from "@/lib/issues";
import { plateFromLabel } from "@/lib/plates";
import { excerpt } from "@/lib/snippet";
import { COPY } from "@/lib/content";
import { Drawing } from "@/app/_components/illustrations/Drawing";
import { Reveal } from "@/app/_components/motion/Reveal";
import { WordRise } from "@/app/_components/motion/WordRise";
import { EmptyState } from "@/app/_components/ui/Feedback";
import { PaperRow } from "@/app/_components/ui/PaperRow";
import { Segmented } from "@/app/_components/ui/Segmented";
import { PapersSearch } from "@/app/papers/_components/PapersSearch";
import { PapersPreview, type PreviewItem } from "@/app/papers/_components/PapersPreview";

export const metadata: Metadata = {
  title: "Papers",
  description:
    "Every paper published by Central Asian Review, newest first. Abstracts are free to read.",
  alternates: { canonical: "/papers" },
};

type PageProps = { searchParams: Promise<{ q?: string; year?: string }> };

// The full public index (DESIGN.md §9.2). Public and crawlable; search and the
// year filter are plain GET URLs, so every view of the archive is shareable.
// Search runs as you type (PapersSearch). Rows carry their issue's colour
// chip; on wide screens a preview pane beside the list follows the row you
// point at.
export default async function PapersPage({ searchParams }: PageProps) {
  const { q, year: yearParam } = await searchParams;
  const query = q?.trim() ?? "";
  const year = Number(yearParam) || null;

  const [papers, allDates] = await Promise.all([
    prisma.paper.findMany({
      where: {
        status: PAPER_STATUS.PUBLISHED,
        // SQLite's LIKE is case-insensitive for ASCII, which covers the site's
        // English-language corpus; `contains` maps straight onto it.
        ...(query && {
          OR: [
            { title: { contains: query } },
            { authorLine: { contains: query } },
            { abstract: { contains: query } },
          ],
        }),
      },
      orderBy: { publishedAt: "desc" },
      select: {
        id: true,
        slug: true,
        title: true,
        abstract: true,
        authorLine: true,
        publishedAt: true,
        coverImage: true,
      },
    }),
    // Issue numbers are derived against the whole archive, not the results.
    prisma.paper.findMany({
      where: { status: PAPER_STATUS.PUBLISHED },
      select: { publishedAt: true },
    }),
  ]);

  const dates = allDates.flatMap((p) => (p.publishedAt ? [p.publishedAt] : []));
  const yearOf = (d: Date | null) => (d ? tashkentQuarter(d).year : 0);

  // Every year the results hold, newest first — computed from the results so
  // the control can never offer an empty year.
  const years = [...new Set(papers.map((p) => yearOf(p.publishedAt)))]
    .filter(Boolean)
    .sort((a, b) => b - a);

  const rows = (year ? papers.filter((p) => yearOf(p.publishedAt) === year) : papers).map(
    (paper) => ({
      ...paper,
      issue: paper.publishedAt ? issueFor(dates, paper.publishedAt) : null,
    }),
  );

  // A search or a single year reads as one flat list; the whole archive is
  // grouped by year.
  const flat = Boolean(query) || Boolean(year);
  const byYear = new Map<number, typeof rows>();
  if (!flat) {
    for (const row of rows) {
      const y = yearOf(row.publishedAt);
      byYear.set(y, [...(byYear.get(y) ?? []), row]);
    }
  }

  /** A filter link that keeps the search. */
  const href = (nextYear: number | null) => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (nextYear) params.set("year", String(nextYear));
    const s = params.toString();
    return s ? `/papers?${s}` : "/papers";
  };

  const count = (n: number) => `${n} ${n === 1 ? "paper" : "papers"}`;

  // The preview pane's data: each row's opening lines, and one small plate
  // (colour + drawing) per issue that appears in the results.
  const previewItems: PreviewItem[] = rows.map((paper) => ({
    slug: paper.slug,
    title: paper.title,
    authors: paper.authorLine,
    date: paper.publishedAt?.toISOString() ?? null,
    snippet: excerpt(paper.abstract, 280),
    coverImage: paper.coverImage,
    issue: paper.issue ? { number: paper.issue.number, label: paper.issue.label } : null,
  }));
  const plates: Record<number, { className: string; art: React.ReactNode }> = {};
  for (const paper of rows) {
    if (!paper.issue || plates[paper.issue.number]) continue;
    const plate = plateFromLabel(paper.issue.number, paper.issue.label);
    plates[paper.issue.number] = {
      className: plate.className,
      art: <Drawing name={plate.subject} size="sm" tone="plate" draw="none" />,
    };
  }
  const resultLine = query
    ? `${count(rows.length)} ${rows.length === 1 ? "matches" : "match"} “${query}”${year ? ` in ${year}` : ""}`
    : `${count(rows.length)} from ${year}`;

  return (
    <div className="wrap page-top page-end">
      <header>
        <p className="t-meta rise-load">
          {COPY.papers.title} · {dates.length} published
        </p>
        <WordRise as="h1" text={COPY.papers.title} className="t-h1 stack-title" mode="load" />
        <div className="papers-controls rise-load" style={{ "--d": "200ms" } as CSSProperties}>
          <PapersSearch defaultValue={query} year={year} placeholder={COPY.papers.searchPlaceholder} />
          {years.length > 1 && (
            <Segmented
              label="Filter by year"
              scroll={false}
              items={[
                { href: href(null), label: "All", active: !year },
                ...years.map((y) => ({ href: href(y), label: String(y), active: year === y })),
              ]}
            />
          )}
        </div>
      </header>

      <div id="papers-results" className="papers-results mt-16">
        {flat ? (
          <section aria-label="Results">
            {/* role=status: what a screen-reader user needs after searching. */}
            <p role="status" className="result-line">
              {rows.length > 0 && (
                <>
                  {resultLine} ·{" "}
                  <Link href="/papers" className="prose-link">
                    Clear
                  </Link>
                </>
              )}
            </p>
            {rows.length === 0 ? (
              <EmptyState
                drawing="saiga"
                title={COPY.papers.noMatchTitle}
                body={COPY.papers.noMatchBody}
                action={{ href: "/papers", label: COPY.papers.clear }}
              />
            ) : (
              <PapersPreview items={previewItems} plates={plates}>
                <Reveal as="ol" gesture="rows" className="rows mt-4">
                  {rows.map((paper, i) => (
                    <PaperRow key={paper.id} paper={paper} index={i} titleSize="h4" meta="date-issue" />
                  ))}
                </Reveal>
              </PapersPreview>
            )}
          </section>
        ) : papers.length === 0 ? (
          <EmptyState
            drawing="tulip"
            title={COPY.papers.emptyTitle}
            body={COPY.papers.emptyBody}
            action={{ href: "/submit", label: COPY.home.hero.secondary }}
          />
        ) : (
          <PapersPreview items={previewItems} plates={plates}>
          {[...byYear.entries()].map(([y, yearRows], g) => (
            <section
              key={y}
              className="year-group"
              aria-labelledby={`year-${y}`}
              style={
                g > 0
                  ? ({ contentVisibility: "auto", containIntrinsicSize: "auto 600px" } as CSSProperties)
                  : undefined
              }
            >
              <Reveal className="year-head">
                <h2 id={`year-${y}`} className="t-h2">
                  {y || "Undated"}
                </h2>
                <span className="t-meta">{count(yearRows.length)}</span>
              </Reveal>
              <Reveal as="ol" gesture="rows" className="rows">
                {yearRows.map((paper, i) => (
                  <PaperRow key={paper.id} paper={paper} index={i} titleSize="h4" meta="date-issue" />
                ))}
              </Reveal>
            </section>
          ))}
          </PapersPreview>
        )}
      </div>
    </div>
  );
}
