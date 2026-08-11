import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr";
import { prisma } from "@/lib/prisma";
import { PAPER_STATUS } from "@/lib/papers";
import { issueFor } from "@/lib/issues";
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
  TileBand,
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

  // The cover is a dated object: the current issue's imprint sits above the
  // headline, and the lead section names the same issue. Derived from the
  // lead paper's quarter, so the cover can never disagree with /issues.
  const leadIssue = lead?.publishedAt
    ? issueFor(
        published.flatMap((p) => (p.publishedAt ? [p.publishedAt] : [])),
        lead.publishedAt,
      )
    : null;

  return (
    <>
      {/* ---- Hero: the journal's COVER ----
           The brand's physical object is a hand-bound journal whose cover is
           cloth and tile (PRODUCT.md), and the site's night-lapis surface was
           spending its life in the footer. Promoted here, the page opens on
           the cover and turns to paper: parchment Garamond at display scale,
           the arch glowing against the dark, a gilded frieze at the fold.
           Every colour comes from the surface-night token scoping — inside
           it, the action colour IS gold. */}
      <section className="surface-night relative overflow-hidden">
        {/* Star lattice sunk into the night field — the same pairing the
            footer is allowed, mirrored at the site's opening. The lift
            classes let the cover close under the gilded frieze as the reader
            scrolls off it (scroll-driven, guarded in globals.css). */}
        <PatternField className="cover-lift-far text-tile opacity-[0.06]" />

        <div className="cover-lift-near relative mx-auto grid w-full max-w-6xl items-center gap-12 px-6 pb-16 pt-14 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20 lg:pb-24 lg:pt-20">
          <div>
            <Reveal load>
              {/* The imprint: a cover is a dated object, not a timeless
                  banner. Gild small caps — the cover's own metal. */}
              {leadIssue && (
                <p className="mb-7 flex items-center gap-2.5 text-[0.6875rem] uppercase tracking-[0.18em] text-gild">
                  <Diamond className="size-1.5" />
                  Issue № {leadIssue.number} · {leadIssue.label}
                </p>
              )}
              {/* Enormous on purpose: a cover carries one line of type, and
                  parchment on lapis is the identity at full commitment.
                  text-balance keeps the phrase from orphaning mid-thought. */}
              <h1 className="display-flush text-balance font-serif text-[clamp(3rem,1.1rem+6.4vw,6.25rem)] leading-[1.02] tracking-tight text-ink">
                {hero.title}
              </h1>
            </Reveal>
            <Reveal load delay={0.08}>
              <p className="prose-plain mt-7 max-w-md text-lg leading-relaxed text-ink-soft">
                {hero.body}
              </p>
            </Reveal>
            <Reveal load delay={0.16}>
              <div className="mt-10 flex flex-wrap items-center gap-3">
                {/* accent resolves to gild inside the night surface: the gold
                    button against lapis is the cover's clasp. Dark text via
                    the scoped surface token (night blue on gold, 5.6:1). */}
                <Link
                  href="/papers"
                  className="foil press-ink rounded px-6 py-3 text-sm font-medium text-surface"
                >
                  Browse papers
                </Link>
                <Link
                  href="/submit"
                  className="press-ink rounded border border-rule-strong px-6 py-3 text-sm font-medium text-ink hover:border-accent hover:text-accent"
                >
                  Submit a paper
                </Link>
              </div>
            </Reveal>
          </div>

          {/* The one arch on the site. priority: this is the LCP element, so it
              must not lazy-load; the clip reveal animates clip-path only, so the
              image element itself is painted (and measured) immediately. */}
          {/* The arch-shaped drop shadow (filter follows the clip-path) seats
              the portal into the night surface instead of stickering it on. */}
          <ClipReveal
            delay={0.12}
            className="mx-auto w-full max-w-md [filter:drop-shadow(0_22px_36px_rgb(0_0_0/0.38))] lg:max-w-none"
          >
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

        {/* The cover closes with the gilded frieze — the same threshold the
            footer opens with, so night bookends paper. This is the page's one
            major-boundary TileBand. */}
        <TileBand className="relative text-gild" />
      </section>

      <div className="mx-auto w-full max-w-6xl px-6">
        {/* ---- Lead paper: a framed plate over text ---- */}
        {lead ? (
          <Reveal className="py-14">
            <article className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start lg:gap-14">
              {/* Eyebrow 1 of 2 on this page, tying the lead to the archive —
                  and now carrying the real issue, linked to its cover. */}
              <div className="lg:col-span-2">
                <p className="eyebrow flex items-center gap-2.5">
                  <Diamond className="text-gild" />
                  {leadIssue ? (
                    <Link
                      href={`/issues#${leadIssue.anchor}`}
                      className="oldstyle-nums transition-colors hover:text-accent"
                    >
                      From Issue № {leadIssue.number} · {leadIssue.label}
                    </Link>
                  ) : (
                    "From the latest issue"
                  )}
                </p>
              </div>

              <Link
                href={`/p/${lead.slug}`}
                className="group shadow-plate relative block border border-rule-strong bg-surface p-1.5 transition-colors hover:border-accent"
              >
                {/* Framed like a museum plate: hairline, mount, gilded fillet,
                    then image. */}
                <span className="fillet relative block aspect-3/2 overflow-hidden">
                  <Image
                    src={paperImage(lead.slug)}
                    alt=""
                    fill
                    placeholder="blur"
                    sizes="(max-width: 1024px) 100vw, 42vw"
                    className="object-cover transition-transform duration-200 ease-[var(--ease-out-strong)] group-hover:scale-[1.03]"
                  />
                </span>
              </Link>

              <div>
                <h2 className="font-serif text-[2rem] leading-[1.14] tracking-tight sm:text-[2.5rem]">
                  <Link
                    href={`/p/${lead.slug}`}
                    className="title-link text-ink hover:text-accent"
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
                  // li first, Reveal inside: an <ol> whose children are divs
                  // is invalid markup and loses list semantics for AT. No
                  // stagger: each row scrolls in alone, so a delay would read
                  // as lag rather than choreography.
                  <li key={paper.id}>
                    <Reveal>
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
                            className="title-link text-ink hover:text-accent"
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
                  </li>
                ))}
              </ol>
            )}
          </section>

          <Reveal delay={0.08} className="reveal-plate">
            <aside className="space-y-9 lg:border-l lg:border-rule lg:pl-8">
              {/* A leaf from the Baburnama beside the editors' voice — the one
                  place the site shows manuscript art itself. The visible museum
                  credit is deliberate: provenance is part of the register. */}
              <figure className="shadow-plate border border-rule-strong bg-surface p-1">
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

              {/* The page's one framed moment: the standing invitation. */}
              <section className="relative bg-accent-soft p-5">
                {/* Full accent: the halved opacity sat under the 3:1 ornament
                    floor on the tinted field. */}
                <Corners className="text-accent" />
                <h2 className="font-serif text-lg text-ink">
                  {callForPapers.title}
                </h2>
                <p className="prose-plain mt-2.5 text-sm leading-relaxed text-ink-soft">
                  {callForPapers.body}
                </p>
                <Link
                  href="/about#contributors"
                  className="mt-3.5 inline-block text-sm font-medium text-accent transition-colors hover:text-accent-dark"
                >
                  Guidance for contributors
                </Link>
              </section>
            </aside>
          </Reveal>
        </div>

        {/* ---- The editors' statement, at full measure. This is the page's
             trust-carrying sentence; it was whispering at text-sm in a
             sidebar. Whitespace is the frame — no box, no new ornament. ---- */}
        <Reveal>
          <section className="py-16 text-center lg:py-24">
            <Diamond className="mx-auto size-2.5 text-gild" />
            <p className="prose-plain mx-auto mt-8 max-w-3xl text-balance font-serif text-[clamp(1.5rem,1rem+2vw,2.25rem)] leading-[1.45] text-ink">
              {editorial.body}
            </p>
            <p className="mt-7 text-sm text-muted-fg">{editorial.title}</p>
          </section>
        </Reveal>

        {/* ---- Interlude: the region itself, one wide mounted plate as a
             breath between the archive and its map. Honest caption — this is
             verified CC0 photography (public/regional/CREDITS.md), so naming
             the place is a claim the image can keep. ---- */}
        <Reveal className="reveal-plate pb-16">
          <figure className="shadow-plate border border-rule-strong bg-surface p-1.5">
            {/* 16/9 below sm: the 21/9 letterbox compressed to a 146px sliver
                on a phone, too shallow to read as a plate. */}
            <div className="fillet relative aspect-16/9 w-full overflow-hidden sm:aspect-8/3">
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
        <Reveal className="mx-auto w-full max-w-6xl px-6 py-16 lg:py-24">
          {/* Eyebrow 2 of 2 on this page. */}
          <p className="eyebrow">Coverage</p>
          {/* A woven inscription: the five names span the full measure
              between selvedge rules, set just shy of display scale — the
              page's quiet closing chord before the night footer. A marker
              per item survives line wrapping. */}
          <ul className="mt-8 flex flex-wrap items-baseline gap-x-10 gap-y-5 border-y border-rule-strong py-7">
            {REGION_COUNTRIES.map((country) => (
              <li
                key={country}
                className="flex items-baseline gap-x-3.5 font-serif text-[clamp(1.75rem,1.1rem+2.2vw,2.75rem)] leading-tight text-ink"
              >
                <Diamond className="size-2.5 self-center text-gild" />
                {country}
              </li>
            ))}
          </ul>
          <p className="mt-7 max-w-lg text-sm leading-relaxed text-muted-fg">
            The review also publishes work on the wider region where it bears on
            these five countries.
          </p>
        </Reveal>
      </section>
    </>
  );
}
