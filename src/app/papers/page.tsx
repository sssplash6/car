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
import { Diamond, IkatDivider, Rosette } from "@/app/_components/Ornament";
import { Reveal } from "@/app/_components/Reveal";

export const metadata: Metadata = {
  title: "Papers",
  description:
    "Every paper published by Central Asian Review, newest first. Abstracts are free to read.",
  alternates: { canonical: "/papers" },
};

type PageProps = { searchParams: Promise<{ q?: string }> };

// The full public index. Public and crawlable, like the homepage — no auth
// check, and search is a plain GET form so results are shareable URLs and the
// page needs no client JavaScript.
export default async function PapersPage({ searchParams }: PageProps) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";

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

  // The index advances a row's pool image when it collides with the row above:
  // two identical plates in one screenful read as a bug. Only the index does
  // this — the paper page and share card keep the canonical hash.
  const rows: { paper: (typeof papers)[number]; image: StaticImageData }[] = [];
  for (const paper of papers) {
    let image = paperImage(paper.slug);
    if (image === rows.at(-1)?.image) image = paperImage(paper.slug, 1);
    rows.push({ paper, image });
  }

  // Grouped by publication year (site timezone) when browsing; a search reads
  // as one flat result list instead.
  const byYear = new Map<number, typeof rows>();
  if (!query) {
    for (const row of rows) {
      const year = row.paper.publishedAt
        ? tashkentQuarter(row.paper.publishedAt).year
        : 0;
      byYear.set(year, [...(byYear.get(year) ?? []), row]);
    }
  }

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
        </form>
      </header>

      <IkatDivider className="mt-9 text-tile" />

      {query ? (
        <section className="py-10">
          {/* role=status: the result count is what a screen-reader user needs
              announced after submitting the search form. */}
          <h2 className="text-sm text-muted-fg" role="status">
            {papers.length === 0
              ? `Nothing matches “${query}”.`
              : `${papers.length} paper${papers.length === 1 ? "" : "s"} match${papers.length === 1 ? "es" : ""} “${query}”.`}{" "}
            <Link
              href="/papers"
              className="text-accent transition-colors hover:text-accent-dark"
            >
              Clear the search
            </Link>
          </h2>
          {papers.length === 0 ? (
            <p className="mt-8 max-w-md leading-relaxed text-muted-fg">
              Try a shorter term, or an author&rsquo;s surname. Every abstract
              is indexed, so anything a paper says, search can find.
            </p>
          ) : (
            <div className="mt-4">
              {rows.map(({ paper, image }) => (
                <PaperRow key={paper.id} paper={paper} image={image} />
              ))}
            </div>
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
        [...byYear.entries()].map(([year, yearRows], i) => {
          // The year's first paper is its frontispiece — the lead-plate-then-
          // list grammar the homepage established, repeated at each year
          // break so the index has rhythm instead of an unbroken register.
          const [first, ...others] = yearRows;
          return (
            <section
              key={year}
              className={`grid gap-x-12 gap-y-4 py-12 lg:grid-cols-[10rem_1fr] ${
                i > 0 ? "border-t border-rule-strong" : ""
              }`}
            >
              {/* Year numeral in ink, not accent: display, not action — the
                  same rule that governs the issue numerals. It rides sticky
                  beside its papers, a running folio year. */}
              <div className="lg:sticky lg:top-10 lg:self-start">
                <h2 className="oldstyle-nums font-serif text-[clamp(2.75rem,2rem+3vw,4rem)] leading-none tracking-tight text-ink">
                  {year || "Undated"}
                </h2>
                <Diamond className="mt-4 size-2 text-gild" />
              </div>
              <div>
                <Reveal className="reveal-plate">
                  <article className="grid gap-6 border-b border-rule pb-8 sm:grid-cols-[1fr_15rem] sm:items-start">
                    <div className="max-w-[65ch]">
                      <h3 className="font-serif text-[1.65rem] leading-tight">
                        <Link
                          href={`/p/${first.paper.slug}`}
                          className="title-link text-ink hover:text-accent"
                        >
                          {first.paper.title}
                        </Link>
                      </h3>
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
                      className="group shadow-plate relative block self-start border border-rule-strong bg-surface p-1.5 transition-colors hover:border-accent max-sm:hidden"
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
                          className="object-cover transition-transform duration-200 ease-[var(--ease-out-strong)] group-hover:scale-[1.03]"
                        />
                      </span>
                    </Link>
                  </article>
                </Reveal>
                {others.map(({ paper, image }) => (
                  <Reveal key={paper.id}>
                    <PaperRow paper={paper} image={image} />
                  </Reveal>
                ))}
              </div>
            </section>
          );
        })
      )}
    </div>
  );
}
