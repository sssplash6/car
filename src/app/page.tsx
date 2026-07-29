import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PAPER_STATUS } from "@/lib/papers";
import { COPY } from "@/lib/content";
import { REGION_COUNTRIES, formatDate } from "@/lib/site";
import { paperImage, slotImage } from "@/lib/placeholderImage";
import { Reveal } from "@/app/_components/Reveal";

// Homepage. No auth check anywhere in this file: this page and the abstract pages
// are the site's entire search presence, so gating them would delete its search
// traffic.
//
// All copy is placeholder text from src/lib/content.ts.
//
// Layout families are deliberately varied so no two sections share a shape:
// asymmetric split hero, full-bleed lead article, divided list plus aside, and a
// coverage strip. Eyebrows are rationed to two on the whole page.

export default async function HomePage() {
  const { hero, editorial, callForPapers } = COPY.home;

  const published = await prisma.paper.findMany({
    where: { status: PAPER_STATUS.PUBLISHED },
    orderBy: { publishedAt: "desc" },
    take: 7, // one lead plus six in the list
    select: {
      id: true,
      slug: true,
      title: true,
      abstract: true,
      authorLine: true,
      publishedAt: true,
    },
  });

  const [lead, ...rest] = published;

  return (
    <>
      {/* ---- Hero: asymmetric split ---- */}
      <section className="border-b border-rule bg-surface">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-10 px-6 pb-12 pt-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:pb-16 lg:pt-20">
          <div>
            <h1 className="display-flush max-w-xl font-serif text-[2.75rem] leading-[1.06] tracking-tight text-ink sm:text-[3.5rem]">
              {hero.title}
            </h1>
            <p className="prose-plain mt-5 max-w-md text-lg leading-relaxed text-ink-soft">
              {hero.body}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/papers"
                className="rounded bg-accent px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-dark active:translate-y-px"
              >
                Browse papers
              </Link>
              <Link
                href="/submit"
                className="rounded border border-rule-strong px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:border-accent hover:text-accent active:translate-y-px"
              >
                Submit a paper
              </Link>
            </div>
          </div>

          {/* priority: this is the LCP element, so it must not lazy-load. */}
          <div className="relative aspect-4/3 w-full overflow-hidden lg:aspect-3/2">
            <Image
              src={slotImage("hero-region", 1200, 800)}
              alt=""
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 46vw"
              className="object-cover"
            />
          </div>
        </div>
      </section>

      <div className="mx-auto w-full max-w-6xl px-6">
        {/* ---- Lead paper: full-bleed image over text ---- */}
        {lead ? (
          <Reveal className="border-b border-rule py-14">
            <article className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start lg:gap-14">
              <Link
                href={`/p/${lead.slug}`}
                className="group relative block aspect-3/2 overflow-hidden"
              >
                <Image
                  src={paperImage(lead.slug, 900, 600)}
                  alt=""
                  fill
                  sizes="(max-width: 1024px) 100vw, 42vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />
              </Link>

              <div>
                <h2 className="font-serif text-[2rem] leading-[1.14] tracking-tight sm:text-[2.5rem]">
                  <Link
                    href={`/p/${lead.slug}`}
                    className="text-ink transition-colors hover:text-accent"
                  >
                    {lead.title}
                  </Link>
                </h2>
                <p className="mt-3 text-sm text-muted-fg">
                  {lead.authorLine}
                  {lead.publishedAt && ` · ${formatDate(lead.publishedAt)}`}
                </p>
                <p className="mt-5 line-clamp-6 leading-relaxed text-ink-soft">
                  {lead.abstract}
                </p>
                <Link
                  href={`/p/${lead.slug}`}
                  className="mt-5 inline-block text-sm text-accent transition-colors hover:text-accent-dark"
                >
                  Read the abstract
                </Link>
              </div>
            </article>
          </Reveal>
        ) : (
          <section className="border-b border-rule py-14">
            <h2 className="font-serif text-2xl text-ink">Nothing published yet</h2>
            <p className="mt-3 max-w-md leading-relaxed text-muted-fg">
              Once an editor approves a submission it appears here, and the newest
              paper leads the page.
            </p>
            <Link
              href="/submit"
              className="mt-5 inline-block text-sm text-accent transition-colors hover:text-accent-dark"
            >
              Submit the first paper
            </Link>
          </section>
        )}

        {/* ---- Recent list plus editorial aside ---- */}
        <div className="grid gap-12 py-14 lg:grid-cols-[1fr_17rem] lg:gap-16">
          <section>
            {/* Eyebrow 1 of 2 on this page. */}
            <div className="flex items-baseline justify-between border-b border-rule-strong pb-3">
              <p className="eyebrow">Recent submissions</p>
              <Link
                href="/papers"
                className="text-sm text-accent transition-colors hover:text-accent-dark"
              >
                All papers
              </Link>
            </div>

            {rest.length === 0 ? (
              <p className="mt-6 text-muted-fg">
                {lead
                  ? "Only one paper is published so far. More will appear here as they clear review."
                  : "The list fills as papers clear review."}
              </p>
            ) : (
              <ol>
                {rest.map((paper, i) => (
                  <Reveal key={paper.id} delay={i * 0.04}>
                    <article className="grid grid-cols-[3rem_1fr] gap-5 border-b border-rule py-6 sm:grid-cols-[3.5rem_1fr]">
                      {/* Numbered rather than bulleted: the list is ordered by
                          recency, and the number carries that ordering where a
                          decorative dot would not. The lead paper above is
                          unnumbered, so this list starts at 01. */}
                      <span className="pt-1 font-serif text-xl text-muted-fg">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <div className="min-w-0">
                        <h3 className="font-serif text-xl leading-snug">
                          <Link
                            href={`/p/${paper.slug}`}
                            className="text-ink transition-colors hover:text-accent"
                          >
                            {paper.title}
                          </Link>
                        </h3>
                        <p className="mt-1.5 text-sm text-muted-fg">
                          {paper.authorLine}
                          {paper.publishedAt &&
                            ` · ${formatDate(paper.publishedAt)}`}
                        </p>
                        <p className="mt-2.5 line-clamp-2 leading-relaxed text-ink-soft">
                          {paper.abstract}
                        </p>
                      </div>
                    </article>
                  </Reveal>
                ))}
              </ol>
            )}
          </section>

          <aside className="space-y-9 lg:border-l lg:border-rule lg:pl-8">
            <section>
              <h2 className="font-serif text-lg text-ink">{editorial.title}</h2>
              <p className="prose-plain mt-2.5 text-sm leading-relaxed text-ink-soft">
                {editorial.body}
              </p>
            </section>

            <section className="border-t border-rule pt-8">
              <h2 className="font-serif text-lg text-ink">
                {callForPapers.title}
              </h2>
              <p className="prose-plain mt-2.5 text-sm leading-relaxed text-ink-soft">
                {callForPapers.body}
              </p>
              <Link
                href="/about"
                className="mt-3.5 inline-block text-sm text-accent transition-colors hover:text-accent-dark"
              >
                Guidance for contributors
              </Link>
            </section>
          </aside>
        </div>

        {/* ---- Coverage strip ----
             Deliberately typographic, with no photography. A photo captioned with
             a country name asserts that the image depicts that country, and
             placeholder stock cannot honour that claim. Decorative imagery is fine
             beside an article; it is not fine standing in for a place. */}
        <Reveal className="border-t border-rule-strong py-14">
          {/* Eyebrow 2 of 2 on this page. */}
          <p className="eyebrow">Coverage</p>
          <ul className="mt-7 flex flex-wrap items-baseline gap-x-8 gap-y-3">
            {REGION_COUNTRIES.map((country) => (
              <li
                key={country}
                className="font-serif text-2xl text-ink sm:text-[1.75rem]"
              >
                {country}
              </li>
            ))}
          </ul>
          <p className="mt-6 max-w-lg text-sm leading-relaxed text-muted-fg">
            The review also publishes work on the wider region where it bears on
            these five countries.
          </p>
        </Reveal>
      </div>
    </>
  );
}
