import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr";
import { prisma } from "@/lib/prisma";
import { PAPER_STATUS } from "@/lib/papers";
import { COPY } from "@/lib/content";
import { REGION_COUNTRIES, formatDate } from "@/lib/site";
import {
  asideBaburnama,
  heroRegistan,
  interludeSongKul,
  paperImage,
} from "@/lib/regionalImages";
import { Reveal } from "@/app/_components/Reveal";
import { ClipReveal } from "@/app/_components/ClipReveal";
import {
  ArchFrame,
  Corners,
  Diamond,
  IkatDivider,
  PatternField,
} from "@/app/_components/Ornament";

// Homepage. No auth check anywhere in this file: this page and the abstract pages
// are the site's entire search presence, so gating them would delete its search
// traffic.
//
// All copy is placeholder text from src/lib/content.ts.
//
// This page carries the site's one orchestrated entrance (the hero) and its
// biggest ornament (the arch). Everything after the hero reveals on scroll and
// keeps to hairlines, one ikat threshold, and one framed panel — the rationing
// rules live in DESIGN.md.

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
      {/* ---- Hero: asymmetric split, text against a pishtaq-arched image ---- */}
      <section className="relative overflow-hidden border-b border-rule bg-surface">
        {/* Star lattice barely surfacing out of the paper. Hero, paper header
            and footer are the only surfaces allowed this field. */}
        <PatternField className="text-gild opacity-[0.05]" />

        <div className="relative mx-auto grid w-full max-w-6xl items-center gap-12 px-6 pb-14 pt-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20 lg:pb-20 lg:pt-16">
          <div>
            <Reveal load>
              <h1 className="display-flush max-w-xl font-serif text-[clamp(2.75rem,1.2rem+5.2vw,4.5rem)] leading-[1.04] tracking-tight text-ink">
                {hero.title}
              </h1>
            </Reveal>
            <Reveal load delay={0.08}>
              <p className="prose-plain mt-6 max-w-md text-lg leading-relaxed text-ink-soft">
                {hero.body}
              </p>
            </Reveal>
            <Reveal load delay={0.16}>
              <div className="mt-9 flex flex-wrap items-center gap-3">
                <Link
                  href="/papers"
                  className="rounded bg-accent px-5 py-2.5 text-sm font-medium text-surface transition-colors hover:bg-accent-dark active:translate-y-px"
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
            </Reveal>
          </div>

          {/* The one arch on the site. priority: this is the LCP element, so it
              must not lazy-load; the clip reveal animates clip-path only, so the
              image element itself is painted (and measured) immediately. */}
          <ClipReveal delay={0.12} className="mx-auto w-full max-w-md lg:max-w-none">
            <ArchFrame className="aspect-4/5 w-full sm:aspect-3/4 lg:aspect-4/5">
              <div className="relative h-full w-full">
                <Image
                  src={heroRegistan}
                  alt="Portal and minarets of the Registan in Samarkand"
                  fill
                  priority
                  placeholder="blur"
                  sizes="(max-width: 1024px) 100vw, 44vw"
                  // Top-anchored crop: keeps the portal and minarets (and the
                  // sky above them, which meets the arch's point) and drops
                  // the plaza railing at the photo's foot entirely.
                  className="object-cover object-top"
                />
              </div>
            </ArchFrame>
          </ClipReveal>
        </div>
      </section>

      <div className="mx-auto w-full max-w-6xl px-6">
        {/* ---- Lead paper: a framed plate over text ---- */}
        {lead ? (
          <Reveal className="py-14">
            <article className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start lg:gap-14">
              {/* Eyebrow 1 of 2 on this page, tying the lead to the archive. */}
              <div className="lg:col-span-2">
                <p className="eyebrow flex items-center gap-2.5">
                  <Diamond className="text-gild" />
                  From the latest issue
                </p>
              </div>

              <Link
                href={`/p/${lead.slug}`}
                className="group relative block border border-rule-strong bg-surface p-1.5 transition-colors hover:border-accent"
              >
                {/* Framed like a museum plate: hairline, then mount, then image. */}
                <span className="relative block aspect-3/2 overflow-hidden">
                  <Image
                    src={paperImage(lead.slug)}
                    alt=""
                    fill
                    placeholder="blur"
                    sizes="(max-width: 1024px) 100vw, 42vw"
                    className="object-cover transition-transform duration-500 ease-[var(--ease-out-strong)] group-hover:scale-[1.03]"
                  />
                </span>
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
                  className="group mt-5 inline-flex items-center gap-1.5 text-sm text-accent transition-colors hover:text-accent-dark"
                >
                  Read the abstract
                  <ArrowRightIcon
                    size={15}
                    aria-hidden="true"
                    className="transition-transform duration-200 ease-[var(--ease-out-strong)] group-hover:translate-x-0.5"
                  />
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

        {/* The ikat threshold: the page turns from the lead to the stream. */}
        <IkatDivider className="text-tile" />

        {/* ---- Recent list plus editorial aside ---- */}
        <div className="grid gap-12 py-14 lg:grid-cols-[1fr_17rem] lg:gap-16">
          <section>
            <div className="flex items-baseline justify-between border-b border-rule-strong pb-3">
              <h2 className="font-serif text-xl text-ink">Recently published</h2>
              <Link
                href="/papers"
                className="group inline-flex items-center gap-1.5 text-sm text-accent transition-colors hover:text-accent-dark"
              >
                All papers
                <ArrowRightIcon
                  size={14}
                  aria-hidden="true"
                  className="transition-transform duration-200 ease-[var(--ease-out-strong)] group-hover:translate-x-0.5"
                />
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
                    <article className="group grid grid-cols-[3rem_1fr] gap-5 border-b border-rule py-6 sm:grid-cols-[3.5rem_1fr]">
                      {/* Numbered rather than bulleted: the list is ordered by
                          recency, and the number carries that ordering where a
                          decorative dot would not. The lead paper above is
                          unnumbered, so this list starts at 01. Oldstyle figures
                          because these are Garamond display numbers. */}
                      <span className="oldstyle-nums pt-1 font-serif text-xl text-muted-fg transition-colors group-hover:text-accent">
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

          <Reveal delay={0.1}>
            <aside className="space-y-9 lg:border-l lg:border-rule lg:pl-8">
              {/* A leaf from the Baburnama beside the editors' voice — the one
                  place the site shows manuscript art itself. The visible museum
                  credit is deliberate: provenance is part of the register. */}
              <figure className="border border-rule-strong bg-surface p-1">
                <div className="relative aspect-3/4 w-full overflow-hidden">
                  <Image
                    src={asideBaburnama}
                    alt="The Fall of Samarkand, a Timurid miniature from a Baburnama manuscript"
                    fill
                    placeholder="blur"
                    sizes="(max-width: 1024px) 100vw, 17rem"
                    className="object-cover object-top"
                  />
                </div>
                <figcaption className="px-1 pb-0.5 pt-2 text-xs leading-relaxed text-muted-fg">
                  The Fall of Samarkand, from the Baburnama · Walters Art Museum
                </figcaption>
              </figure>

              <section>
                <h2 className="font-serif text-lg text-ink">{editorial.title}</h2>
                <p className="prose-plain mt-2.5 text-sm leading-relaxed text-ink-soft">
                  {editorial.body}
                </p>
              </section>

              {/* The page's one framed moment: the standing invitation. */}
              <section className="relative bg-accent-soft p-5">
                <Corners className="text-accent/50" />
                <h2 className="font-serif text-lg text-ink">
                  {callForPapers.title}
                </h2>
                <p className="prose-plain mt-2.5 text-sm leading-relaxed text-ink-soft">
                  {callForPapers.body}
                </p>
                <Link
                  href="/about"
                  className="mt-3.5 inline-block text-sm font-medium text-accent transition-colors hover:text-accent-dark"
                >
                  Guidance for contributors
                </Link>
              </section>
            </aside>
          </Reveal>
        </div>

        {/* ---- Interlude: the region itself, one wide mounted plate as a
             breath between the archive and its map. Honest caption — this is
             verified CC0 photography (public/regional/CREDITS.md), so naming
             the place is a claim the image can keep. ---- */}
        <Reveal className="pb-16">
          <figure className="border border-rule-strong bg-surface p-1.5">
            <div className="relative aspect-21/9 w-full overflow-hidden sm:aspect-8/3">
              <Image
                src={interludeSongKul}
                alt="Yurts on the summer pasture at Song-Kul, Kyrgyzstan"
                fill
                placeholder="blur"
                sizes="(max-width: 1152px) 100vw, 1104px"
                className="object-cover"
              />
            </div>
            <figcaption className="px-1 pb-0.5 pt-2 text-right text-xs text-muted-fg">
              Song-Kul, Kyrgyzstan
            </figcaption>
          </figure>
        </Reveal>
      </div>

      {/* ---- Coverage strip ----
           Deliberately typographic, with no photography. A photo captioned with
           a country name asserts that the image depicts that country, and
           placeholder stock cannot honour that claim. The gild lozenges are
           punctuation, not attribution — geometry is shared heritage. */}
      <section className="border-t border-rule-strong bg-surface">
        <Reveal className="mx-auto w-full max-w-6xl px-6 py-14">
          {/* Eyebrow 2 of 2 on this page. */}
          <p className="eyebrow">Coverage</p>
          <ul className="mt-7 flex flex-wrap items-baseline gap-x-5 gap-y-3">
            {REGION_COUNTRIES.map((country, i) => (
              <li
                key={country}
                className="flex items-baseline gap-x-5 font-serif text-2xl text-ink sm:text-[1.75rem]"
              >
                {i > 0 && (
                  <Diamond className="size-2 self-center text-gild" />
                )}
                {country}
              </li>
            ))}
          </ul>
          <p className="mt-6 max-w-lg text-sm leading-relaxed text-muted-fg">
            The review also publishes work on the wider region where it bears on
            these five countries.
          </p>
        </Reveal>
      </section>
    </>
  );
}
