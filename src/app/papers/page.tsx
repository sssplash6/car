import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import type { StaticImageData } from "next/image";
import { MagnifyingGlassIcon } from "@phosphor-icons/react/dist/ssr";
import { prisma } from "@/lib/prisma";
import { PAPER_STATUS } from "@/lib/papers";
import { tashkentQuarter } from "@/lib/issues";
import { formatDate } from "@/lib/site";
import { paperImage } from "@/lib/regionalImages";
import { PaperRow } from "@/app/_components/PaperRow";
import { TitleCarry } from "@/app/_components/TitleCarry";
import { Diamond, IkatDivider, Rosette } from "@/app/_components/Ornament";
import { Reveal } from "@/app/_components/Reveal";

export const metadata: Metadata = {
  title: "Papers",
  description:
    "Every paper published by Central Asian Review, newest first. Abstracts are free to read.",
  alternates: { canonical: "/papers" },
};

type PageProps = { searchParams: Promise<{ q?: string; year?: string }> };

// The full public index. Public and crawlable, like the homepage — no auth
// check, and both search and the year filter are plain GET links, so every
// view of the archive is a shareable URL and the page needs no client
// JavaScript at all.
//
// The filter rail is set as a woven register rather than a row of pills: this
// is a card catalogue's drawer labels, not a SaaS filter bar.
export default async function PapersPage({ searchParams }: PageProps) {
  const { q, year: yearParam } = await searchParams;
  const query = q?.trim() ?? "";
  const year = Number(yearParam) || null;

  const papers = await prisma.paper.findMany({
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
    },
  });

  const yearOf = (d: Date | null) => (d ? tashkentQuarter(d).year : 0);

  // Every year the archive holds, newest first — the drawer labels. Computed
  // from the search results so the rail can never offer an empty drawer.
  const years = [...new Set(papers.map((p) => yearOf(p.publishedAt)))]
    .filter(Boolean)
    .sort((a, b) => b - a);

  const filtered = year ? papers.filter((p) => yearOf(p.publishedAt) === year) : papers;

  // The index advances a row's pool image when it collides with the row above:
  // two identical plates in one screenful read as a bug. Only the index does
  // this — the paper page and share card keep the canonical hash.
  const rows: { paper: (typeof papers)[number]; image: StaticImageData }[] = [];
  for (const paper of filtered) {
    let image = paperImage(paper.slug);
    if (image === rows.at(-1)?.image) image = paperImage(paper.slug, 1);
    rows.push({ paper, image });
  }

  // Grouped by publication year (site timezone) when browsing the whole
  // archive; a search or a single-year view reads as one flat result list.
  const flat = Boolean(query) || Boolean(year);
  const byYear = new Map<number, typeof rows>();
  if (!flat) {
    for (const row of rows) {
      const y = yearOf(row.paper.publishedAt);
      byYear.set(y, [...(byYear.get(y) ?? []), row]);
    }
  }

  /** A filter link that preserves whatever else is set. */
  const href = (next: { year?: number | null }) => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    const y = next.year === undefined ? year : next.year;
    if (y) params.set("year", String(y));
    const s = params.toString();
    return s ? `/papers?${s}` : "/papers";
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-12">
      <header className="flex flex-wrap items-end justify-between gap-x-10 gap-y-7">
        <div className="max-w-2xl">
          <h1 className="display-flush font-serif text-[clamp(2.75rem,1.6rem+4.2vw,4.75rem)] leading-[1.02] tracking-tight text-ink">
            Papers
          </h1>
          <p className="mt-3 text-muted-fg">
            {papers.length === 0 && !query
              ? "Nothing has been published yet. The first papers appear as soon as they clear review."
              : "Abstracts are free to read; the full PDF needs an account."}
          </p>
        </div>

        <form action="/papers" role="search" className="w-full sm:max-w-sm">
          <label htmlFor="paper-search" className="sr-only">
            Search the papers
          </label>
          <div className="flex">
            <input
              id="paper-search"
              type="search"
              name="q"
              defaultValue={query}
              placeholder="Search titles, authors, abstracts"
              className="w-full rounded-l border border-field bg-surface px-3.5 py-2 text-base text-ink outline-none transition-colors placeholder:text-muted-fg focus:border-accent"
            />
            <button
              type="submit"
              aria-label="Search"
              className="press-ink cursor-pointer rounded-r border border-l-0 border-field px-3.5 text-muted-fg hover:border-accent hover:text-accent"
            >
              <MagnifyingGlassIcon size={18} aria-hidden="true" />
            </button>
          </div>
          {/* A search from inside a year keeps that year. */}
          {year && <input type="hidden" name="year" value={year} />}
        </form>
      </header>

      {/* ---- The drawer labels ----
           Only worth showing once the archive actually spans more than one
           year; before that it would be a control with a single setting. */}
      {years.length > 1 && (
        <nav
          aria-label="Filter by year"
          className="mt-9 flex flex-wrap items-center gap-x-1 gap-y-2 border-y border-rule py-3"
        >
          <span className="eyebrow mr-3">Years</span>
          <FilterChip href={href({ year: null })} active={!year}>
            All
          </FilterChip>
          {years.map((y) => (
            <FilterChip key={y} href={href({ year: y })} active={year === y}>
              <span className="oldstyle-nums">{y}</span>
            </FilterChip>
          ))}
        </nav>
      )}

      <IkatDivider className={`text-tile ${years.length > 1 ? "mt-8" : "mt-9"}`} />

      {flat ? (
        <section className="py-10">
          {/* role=status: the result count is what a screen-reader user needs
              announced after submitting the search form. */}
          <h2 className="text-sm text-muted-fg" role="status">
            {rows.length === 0
              ? `Nothing matches${query ? ` “${query}”` : ""}${year ? ` in ${year}` : ""}.`
              : `${rows.length} paper${rows.length === 1 ? "" : "s"}${query ? ` matching “${query}”` : ""}${year ? ` from ${year}` : ""}.`}{" "}
            <Link
              href="/papers"
              className="text-accent transition-colors hover:text-accent-dark"
            >
              Clear
            </Link>
          </h2>
          {rows.length === 0 ? (
            <p className="mt-8 max-w-md leading-relaxed text-muted-fg">
              Try a shorter term, or an author&rsquo;s surname. Every abstract
              is indexed, so anything a paper says, search can find.
            </p>
          ) : (
            <Reveal flat className="mt-4 block">
              {rows.map(({ paper, image }, i) => (
                <div
                  key={paper.id}
                  className="folio-row"
                  style={{ "--i": i } as React.CSSProperties}
                >
                  <PaperRow paper={paper} image={image} />
                </div>
              ))}
            </Reveal>
          )}
        </section>
      ) : papers.length === 0 ? (
        <div className="py-16 text-center">
          <Rosette className="mx-auto size-12 text-rule-strong" />
          <h2 className="mt-6 font-serif text-2xl text-ink">
            The first papers are in review
          </h2>
          <p className="mx-auto mt-3 max-w-md leading-relaxed text-muted-fg">
            Papers appear here as they clear editorial review.
          </p>
          <Link
            href="/submit"
            className="mt-6 inline-block text-sm text-accent transition-colors hover:text-accent-dark"
          >
            Submit a paper
          </Link>
        </div>
      ) : (
        [...byYear.entries()].map(([y, yearRows], i) => {
          // The year's first paper is its frontispiece — the lead-plate-then-
          // list grammar the homepage established, repeated at each year
          // break so the index has rhythm instead of an unbroken register.
          const [first, ...others] = yearRows;
          return (
            <section
              key={y}
              className={`grid gap-x-12 gap-y-4 py-12 lg:grid-cols-[10rem_1fr] ${
                i > 0 ? "border-t border-rule-strong" : ""
              }`}
            >
              {/* Year numeral in ink, not accent: display, not action — the
                  same rule that governs the issue numerals. It rides sticky
                  beside its papers, a running folio year. */}
              <div className="lg:sticky lg:top-[calc(var(--head-h)+2.5rem)] lg:self-start">
                <h2 className="oldstyle-nums font-serif text-[clamp(2.75rem,2rem+3vw,4rem)] leading-none tracking-tight text-ink">
                  {y || "Undated"}
                </h2>
                <Diamond className="mt-4 size-2 text-gild" />
                <p className="oldstyle-nums mt-4 text-sm text-muted-fg">
                  {yearRows.length} paper{yearRows.length === 1 ? "" : "s"}
                </p>
              </div>
              <div>
                <Reveal className="reveal-plate">
                  <article className="group mark-margin grid gap-6 border-b border-rule pb-8 sm:grid-cols-[1fr_15rem] sm:items-start">
                    <div className="max-w-[65ch]">
                      <TitleCarry slug={first.paper.slug}>
                        <h3 className="font-serif text-[1.65rem] leading-tight">
                          <Link
                            href={`/p/${first.paper.slug}`}
                            className="title-link text-ink hover:text-accent"
                          >
                            {first.paper.title}
                          </Link>
                        </h3>
                      </TitleCarry>
                      <p className="mt-2 text-sm text-muted-fg">
                        {first.paper.authorLine}
                        {first.paper.publishedAt &&
                          ` · ${formatDate(first.paper.publishedAt)}`}
                      </p>
                      <p className="mt-3 line-clamp-3 leading-relaxed text-ink-soft">
                        {first.paper.abstract}
                      </p>
                    </div>
                    <Link
                      href={`/p/${first.paper.slug}`}
                      className="shadow-plate relative block self-start border border-rule-strong bg-surface p-1.5 transition-colors group-hover:border-accent max-sm:hidden"
                      tabIndex={-1}
                      aria-hidden="true"
                    >
                      <span className="fillet relative block aspect-3/2 overflow-hidden">
                        <Image
                          src={first.image}
                          alt=""
                          fill
                          placeholder="blur"
                          sizes="15rem"
                          className="plate-drift object-cover"
                        />
                      </span>
                    </Link>
                  </article>
                </Reveal>
                <Reveal flat className="block">
                  {others.map(({ paper, image }, row) => (
                    <div
                      key={paper.id}
                      className="folio-row"
                      style={{ "--i": row } as React.CSSProperties}
                    >
                      <PaperRow paper={paper} image={image} />
                    </div>
                  ))}
                </Reveal>
              </div>
            </section>
          );
        })
      )}
    </div>
  );
}

/** A drawer label. Underlined when it is the drawer you are standing in. */
function FilterChip({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "true" : undefined}
      data-active={active || undefined}
      className={`link-underline press-ink px-2.5 py-1 text-[0.9375rem] transition-colors ${
        active ? "text-ink" : "text-muted-fg hover:text-ink"
      }`}
    >
      {children}
    </Link>
  );
}
