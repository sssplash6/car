import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr";
import { prisma } from "@/lib/prisma";
import { PAPER_STATUS } from "@/lib/papers";
import { groupIntoIssues, issueFor } from "@/lib/issues";
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
import { CoverLight } from "@/app/_components/CoverLight";
import { InkSet } from "@/app/_components/InkSet";
import { TitleCarry } from "@/app/_components/TitleCarry";
import {
  ArchFrame,
  Corners,
  Diamond,
  IkatDivider,
  IkatSelvedge,
  PatternField,
  TileBand,
} from "@/app/_components/Ornament";

// Homepage. No auth check anywhere in this file: this page and the abstract pages
// are the site's entire search presence, so gating them would delete its search
// traffic.
//
// All copy is placeholder text from src/lib/content.ts.
//
// The page is the journal as an OBJECT, front to back: the bound cover, the
// lead plate, the contents leaf with its apparatus in the margin, the editors'
// statement, an interlude, and the cloth the whole thing is bound in. Ornament
// marks those boundaries and nothing else — the rationing rules live in
// DESIGN.md, and the motion grammar (ink-set / rule-draw / folio-row) in
// globals.css.

export default async function HomePage() {
  const { hero, editorial, callForPapers } = COPY.home;

  const [published, allDates] = await Promise.all([
    prisma.paper.findMany({
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
    }),
    // Cheap: one indexed column, used for the cover's imprint and the
    // apparatus's tally. The cover is a dated object and must be able to say
    // which volume it is without guessing from the seven papers it shows.
    prisma.paper.findMany({
      where: { status: PAPER_STATUS.PUBLISHED },
      select: { publishedAt: true },
    }),
  ]);

  const [lead, ...rest] = published;

  const publishDates = allDates.flatMap((p) =>
    p.publishedAt ? [p.publishedAt] : [],
  );
  const issueCount = groupIntoIssues(
    publishDates.map((d, i) => ({
      id: String(i),
      slug: String(i),
      title: "",
      authorLine: "",
      publishedAt: d,
    })),
  ).length;

  // The cover is a dated object: the current issue's imprint sits above the
  // headline, and the lead section names the same issue. Derived from the
  // lead paper's quarter against the WHOLE archive, so the cover can never
  // disagree with /issues.
  const leadIssue = lead?.publishedAt
    ? issueFor(publishDates, lead.publishedAt)
    : null;

  return (
    <>
      {/* ================= THE COVER =================
          The brand's physical object is a hand-bound journal whose cover is
          cloth and tile (PRODUCT.md). The page opens on that cover and turns
          to paper: a gilded keyline set in from the boards, illumination at
          the corners, parchment Garamond stamped in foil that answers the
          reader's pointer, and the portal glowing through the cloth. Every
          colour comes from the surface-night token scoping — inside it, the
          action colour IS gold. */}
      <section className="surface-night relative overflow-hidden">
        {/* Star lattice sunk into the night field. The lift classes let the
            cover close under the gilded frieze as the reader scrolls off it
            (scroll-driven, guarded in globals.css). */}
        <PatternField className="cover-lift-far text-tile opacity-[0.07]" />
        {/* The boards: a double gilded keyline, drawn open as the cover
            arrives. Purely decorative, so it sits outside the content flow. */}
        <div aria-hidden="true" className="cover-keyline" />

        <CoverLight className="cover-lift-near relative mx-auto grid w-full max-w-6xl items-center gap-12 px-8 pb-16 pt-14 sm:px-12 lg:grid-cols-[1.08fr_0.92fr] lg:gap-16 lg:pb-24 lg:pt-20">
          <div>
            <Reveal load>
              {/* The imprint: a cover is a dated object, not a timeless
                  banner. Gild small caps — the cover's own metal. */}
              {leadIssue && (
                <p className="mb-7 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[0.6875rem] uppercase tracking-[0.2em] text-gild">
                  <Diamond className="size-1.5" />
                  <span className="oldstyle-nums">
                    Issue № {leadIssue.number} · {leadIssue.label}
                  </span>
                  <span aria-hidden="true" className="h-px w-8 bg-gild/45" />
                  <span className="text-muted-fg">Published quarterly</span>
                </p>
              )}
            </Reveal>
            <Reveal load delay={0.06} flat>
              {/* Enormous on purpose: a cover carries one line of type, and
                  parchment on lapis is the identity at full commitment. The
                  words are SET rather than faded (InkSet), and the gold sits
                  inside the letters rather than behind them (.foil-type,
                  lit by CoverLight). */}
              <h1
                data-foil
                className="foil-type display-flush text-balance font-serif text-[clamp(3rem,1.1rem+6.4vw,6.25rem)] leading-[1.02] tracking-tight text-ink"
              >
                <InkSet text={hero.title} />
              </h1>
            </Reveal>
            <Reveal load delay={0.34}>
              <p className="prose-plain mt-7 max-w-md text-lg leading-relaxed text-ink-soft">
                {hero.body}
              </p>
            </Reveal>
            <Reveal load delay={0.42}>
              <div className="mt-10 flex flex-wrap items-center gap-3">
                {/* accent resolves to gild inside the night surface: the gold
                    button against lapis is the cover's clasp. Dark text via
                    the scoped surface token (night blue on gold, 5.6:1). */}
                <Link
                  href="/papers"
                  className="foil press-ink group inline-flex items-center gap-2 rounded px-6 py-3 text-sm font-medium text-surface"
                >
                  Browse papers
                  <ArrowRightIcon
                    size={15}
                    aria-hidden="true"
                    className="transition-transform duration-200 ease-[var(--ease-out-strong)] group-hover:translate-x-0.5"
                  />
                </Link>
                <Link
                  href="/submit"
                  className="press-ink rounded border border-rule-strong px-6 py-3 text-sm font-medium text-ink hover:border-accent hover:text-accent"
                >
                  Submit a paper
                </Link>
                {/* The cover's own tally, set as an imprint line rather than a
                    metric block: what a title page tells you about the run. */}
                <p className="oldstyle-nums ml-1 text-sm text-muted-fg">
                  {allDates.length} paper{allDates.length === 1 ? "" : "s"} ·{" "}
                  {issueCount} issue{issueCount === 1 ? "" : "s"}
                </p>
              </div>
            </Reveal>
          </div>

          {/* The one arch on the site. priority: this is the LCP element, so it
              must not lazy-load; the clip reveal animates clip-path only, so the
              image element itself is painted (and measured) immediately. */}
          <div className="relative mx-auto w-full max-w-md lg:max-w-none">
            {/* The lamp: a warm bloom seated under the portal, so the arch
                reads as an opening cut through the cloth rather than a plate
                stuck onto it. */}
            <div aria-hidden="true" className="arch-lamp" />
            {/* The arch-shaped drop shadow (filter follows the clip-path)
                seats the portal into the night surface. */}
            <ClipReveal
              delay={0.12}
              className="relative [filter:drop-shadow(0_22px_36px_rgb(0_0_0/0.42))]"
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
        </CoverLight>

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
                  and carrying the real issue, linked to its cover. */}
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
                    then image — and the photograph drifts a hair further than
                    its frame does, which is what puts the frame in front. */}
                <span className="fillet relative block aspect-3/2 overflow-hidden">
                  <Image
                    src={paperImage(lead.slug)}
                    alt=""
                    fill
                    placeholder="blur"
                    sizes="(max-width: 1024px) 100vw, 42vw"
                    className="plate-drift object-cover"
                  />
                </span>
              </Link>

              <div className="mark-margin">
                <TitleCarry slug={lead.slug}>
                  <h2 className="font-serif text-[2rem] leading-[1.14] tracking-tight sm:text-[2.5rem]">
                    <Link
                      href={`/p/${lead.slug}`}
                      className="title-link text-ink hover:text-accent"
                    >
                      {lead.title}
                    </Link>
                  </h2>
                </TitleCarry>
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

        {/* The ikat threshold: the page turns from the lead to the stream, and
            the rule is RULED — drawn outward from its centre. */}
        <Reveal flat>
          <IkatDivider className="rule-draw text-tile" />
        </Reveal>

        {/* ---- The contents leaf, with its apparatus in the margin ---- */}
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
              // ONE Reveal around the whole list: a table of contents is a
              // single object, so it unrolls as a run (.folio-row staggers by
              // --i) instead of each row fading in alone as the eye reaches it.
              <Reveal flat>
                <ol>
                  {rest.map((paper, i) => (
                    <li
                      key={paper.id}
                      className="folio-row"
                      style={{ "--i": i } as React.CSSProperties}
                    >
                      <article className="group mark-margin grid grid-cols-[3rem_1fr] gap-5 border-b border-rule py-6 sm:grid-cols-[3.5rem_1fr]">
                        {/* Numbered rather than bulleted: the list is ordered by
                            recency, and the number carries that ordering where a
                            decorative dot would not. The lead paper above is
                            unnumbered, so this list starts at 01. Oldstyle figures
                            because these are Garamond display numbers. */}
                        <span className="oldstyle-nums pt-1 font-serif text-xl text-muted-fg transition-colors group-hover:text-accent">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <div className="min-w-0">
                          <TitleCarry slug={paper.slug}>
                            <h3 className="font-serif text-xl leading-snug">
                              <Link
                                href={`/p/${paper.slug}`}
                                className="title-link text-ink hover:text-accent"
                              >
                                {paper.title}
                              </Link>
                            </h3>
                          </TitleCarry>
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
                    </li>
                  ))}
                </ol>
              </Reveal>
            )}
          </section>

          {/* The apparatus rides ALONGSIDE the contents rather than running out
              halfway down them: sticky, so the manuscript leaf and the standing
              invitation stay beside whatever row the reader has reached. */}
          <Reveal delay={0.08} className="reveal-plate lg:self-start">
            <aside className="space-y-9 lg:sticky lg:top-[calc(var(--head-h)+2rem)] lg:border-l lg:border-rule lg:pl-8">
              {/* A leaf from the Baburnama beside the editors' voice — the one
                  place the site shows manuscript art itself. The visible museum
                  credit is deliberate: provenance is part of the register. */}
              <figure className="group shadow-plate border border-rule-strong bg-surface p-1">
                <div className="relative aspect-3/4 w-full overflow-hidden">
                  <Image
                    src={asideBaburnama}
                    alt="The Fall of Samarkand, a Timurid miniature from a Baburnama manuscript"
                    fill
                    placeholder="blur"
                    sizes="(max-width: 1024px) 100vw, 17rem"
                    className="plate-drift object-cover object-top"
                  />
                </div>
                <figcaption className="px-1 pb-0.5 pt-2 text-xs leading-relaxed text-muted-fg">
                  The Fall of Samarkand, from the Baburnama · Walters Art Museum
                </figcaption>
              </figure>

              {/* The page's one framed moment: the standing invitation, with the
                  gilded thread travelling its frame while the reader is on it. */}
              <section className="gild-thread-host relative bg-accent-soft p-5">
                {/* Full accent: the halved opacity sat under the 3:1 ornament
                    floor on the tinted field. */}
                <Corners className="text-accent" />
                <span aria-hidden="true" className="gild-thread" />
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
             trust-carrying sentence, so it is the third and last place on the
             site where type is SET rather than faded — a slower step, because
             the passage is long. Whitespace is the frame. ---- */}
        <Reveal flat>
          <section className="py-14 text-center lg:py-20">
            <Diamond className="mx-auto size-2.5 text-gild" />
            <p
              className="prose-plain mx-auto mt-8 max-w-3xl text-balance font-serif text-[clamp(1.5rem,1rem+2vw,2.25rem)] leading-[1.45] text-ink"
              style={{ "--ink-step": "15ms" } as React.CSSProperties}
            >
              <InkSet text={editorial.body} />
            </p>
            <p className="mt-7 text-sm text-muted-fg">{editorial.title}</p>
          </section>
        </Reveal>

        {/* ---- Interlude: the region itself, one wide mounted plate as a
             breath between the archive and the cloth it is bound in. Honest
             caption — this is verified CC0 photography
             (public/regional/CREDITS.md), so naming the place is a claim the
             image can keep. ---- */}
        <Reveal className="reveal-plate pb-16">
          <figure className="group shadow-plate border border-rule-strong bg-surface p-1.5">
            {/* 16/9 below sm: the 21/9 letterbox compressed to a 146px sliver
                on a phone, too shallow to read as a plate. */}
            <div className="fillet relative aspect-16/9 w-full overflow-hidden sm:aspect-8/3">
              <Image
                src={interludeSongKul}
                alt="Yurts on the summer pasture at Song-Kul, Kyrgyzstan"
                fill
                placeholder="blur"
                sizes="(max-width: 1152px) 100vw, 1104px"
                className="plate-drift object-cover"
              />
            </div>
            <figcaption className="px-1 pb-0.5 pt-2 text-right text-xs text-muted-fg">
              Song-Kul, Kyrgyzstan
            </figcaption>
          </figure>
        </Reveal>
      </div>

      {/* ================= THE CLOTH =================
           The binding, and the page's closing chord: five countries named in
           English and in their own language, woven into the ikat the cover is
           bound in. Deliberately typographic, with no photography — a photo
           captioned with a country name asserts that the image depicts that
           country, and no pool image can honour that claim. Geometry and
           language are shared heritage; flags and emblems are politics, and
           there are none here. */}
      <section className="relative -mb-20 overflow-hidden border-t border-rule-strong bg-surface">
        <div aria-hidden="true" className="ikat-cloth absolute inset-0" />
        <IkatSelvedge className="relative text-tile" />

        <Reveal flat className="relative mx-auto w-full max-w-6xl px-6 py-16 lg:py-24">
          {/* Eyebrow 2 of 2 on this page. */}
          <p className="eyebrow">Coverage</p>

          <ul className="mt-10 grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
            {REGION_COUNTRIES.map((country, i) => (
              <li
                key={country.en}
                className="folio-row group border-t border-rule-strong pt-4"
                style={{ "--i": i } as React.CSSProperties}
              >
                <p className="flex items-baseline gap-3 font-serif text-[clamp(1.6rem,1.1rem+1.5vw,2.25rem)] leading-tight text-ink">
                  <Diamond className="size-2 shrink-0 self-center text-gild transition-transform duration-500 ease-[var(--ease-out-strong)] group-hover:rotate-90" />
                  {country.en}
                </p>
                {/* The country's own name, in its own script. lang is markup,
                    not decoration: it tells assistive technology which voice to
                    read it in. */}
                <p
                  lang={country.lang}
                  className="mt-1 pl-[1.4rem] font-serif text-lg text-muted-fg"
                >
                  {country.native}
                </p>
              </li>
            ))}
            <li
              className="folio-row border-t border-rule pt-4 text-sm leading-relaxed text-muted-fg"
              style={{ "--i": REGION_COUNTRIES.length } as React.CSSProperties}
            >
              The review also publishes work on the wider region wherever it
              bears on these five countries.
            </li>
          </ul>
        </Reveal>

        <IkatSelvedge flip className="relative text-tile" />
      </section>
    </>
  );
}
