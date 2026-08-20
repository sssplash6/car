import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  DownloadSimpleIcon,
  LockSimpleIcon,
} from "@phosphor-icons/react/dist/ssr";
import { prisma } from "@/lib/prisma";
import { getOptionalUser } from "@/lib/dal";
import { PAPER_STATUS } from "@/lib/papers";
import { issueFor, tashkentQuarter } from "@/lib/issues";
import { SITE_NAME, formatDate, siteUrl } from "@/lib/site";
import { paperImage } from "@/lib/regionalImages";
import { AuthorLine } from "@/app/_components/AuthorLine";
import { CopyButton } from "@/app/_components/CopyButton";
import { Reveal } from "@/app/_components/Reveal";
import { TitleCarry } from "@/app/_components/TitleCarry";
import {
  Corners,
  Diamond,
  Headpiece,
  Rosette,
  TileBand,
} from "@/app/_components/Ornament";

// A published paper's abstract page. Public and crawlable: the PDF behind it is
// gated, so this page carries all of the paper's search weight.
//
// Only PUBLISHED papers resolve here. An author checking their own pending
// submission does that from /submissions, which keeps this page's visibility rule
// to a single condition.
//
// Deliberately calm, and ordered for the reader from search: front matter flows
// straight into the abstract (the decision content), the decorative plate sits
// below it as an interlude, and the page ends with the scholarly furniture.
//
// Two things make it a READING page rather than a poster. A running head pins
// under the site's strip once the title leaf has gone by, carrying the paper's
// name, its volume and a gild rule that fills with the reader's progress — the
// journal furniture a printed page keeps in its top margin. And the colophon
// has moved out of the foot and into the MARGIN, sticky, where marginalia
// belongs: while the reader is in the abstract, what the thing is and how to
// cite it are beside their hand rather than a scroll away. Content order in the
// markup is unchanged (abstract first), so the rail costs the reader from
// search nothing.
//
// The ornament budget goes to the ʿunwān headpiece, one tile band, and the
// framed download panel; the title leaf is one of the three places on the site
// where type is SET rather than faded.

type PageProps = { params: Promise<{ slug: string }> };

const publishedSelect = {
  id: true,
  slug: true,
  title: true,
  abstract: true,
  authorLine: true,
  originalName: true,
  fileSize: true,
  publishedAt: true,
} as const;

async function findPublished(slug: string) {
  return prisma.paper.findFirst({
    where: { slug, status: PAPER_STATUS.PUBLISHED },
    select: publishedSelect,
  });
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const paper = await findPublished(slug);

  if (!paper) return { title: "Paper not found" };

  // The abstract doubles as the meta description, trimmed to ~155 characters
  // because Google truncates around there and a description cut mid-word reads
  // badly.
  const description = truncateAtWord(paper.abstract, 155);

  // The paper's pool image doubles as the share card. metadataBase makes the
  // static-asset path absolute; width/height come from the import.
  const image = paperImage(paper.slug);

  return {
    title: paper.title,
    description,
    alternates: { canonical: `/p/${paper.slug}` },
    openGraph: {
      type: "article",
      title: paper.title,
      description,
      url: `${siteUrl()}/p/${paper.slug}`,
      siteName: SITE_NAME,
      publishedTime: paper.publishedAt?.toISOString(),
      images: [{ url: image.src, width: image.width, height: image.height }],
    },
    // Highwire citation_* tags: Google Scholar's inclusion rules require these
    // and do NOT parse JSON-LD — without them the review does not exist in the
    // one engine its audience searches first. citation_pdf_url is deliberately
    // absent: the PDF is gated, and pointing Scholar at a login wall is worse
    // than pointing it at the abstract.
    other: {
      citation_title: paper.title,
      citation_author: paper.authorLine
        .split(",")
        .map((name) => name.trim())
        .filter(Boolean),
      ...(paper.publishedAt && {
        citation_publication_date: scholarDate(paper.publishedAt),
      }),
      citation_journal_title: SITE_NAME,
      citation_abstract_html_url: `${siteUrl()}/p/${paper.slug}`,
    },
  };
}

export default async function PaperPage({ params }: PageProps) {
  const { slug } = await params;
  const paper = await findPublished(slug);

  if (!paper) notFound();

  // The user check and the issue lookup are independent — run them together.
  // The published list feeds both the issue computation and the "also in this
  // issue" section, so it selects display fields rather than dates alone.
  const [user, published] = await Promise.all([
    getOptionalUser(),
    prisma.paper.findMany({
      where: { status: PAPER_STATUS.PUBLISHED },
      select: {
        id: true,
        slug: true,
        title: true,
        authorLine: true,
        publishedAt: true,
      },
    }),
  ]);

  const publishDates = published.flatMap((p) =>
    p.publishedAt ? [p.publishedAt] : [],
  );

  // Which quarterly issue this paper belongs to (src/lib/issues.ts). Citing the
  // issue on the paper itself is what makes the derived archive feel bound.
  const issue = paper.publishedAt
    ? issueFor(publishDates, paper.publishedAt)
    : null;

  // The rest of this paper's quarter, newest first — the reader's path deeper
  // into the archive instead of a dead end after the download panel.
  const quarterKey = (d: Date) => {
    const { year, quarter } = tashkentQuarter(d);
    return year * 4 + quarter;
  };
  const alsoInIssue = paper.publishedAt
    ? published
        .filter(
          (p): p is (typeof published)[number] & { publishedAt: Date } =>
            p.id !== paper.id &&
            p.publishedAt !== null &&
            quarterKey(p.publishedAt) === quarterKey(paper.publishedAt!),
        )
        .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime())
        .slice(0, 4)
    : [];

  // The page turns: the papers either side of this one across the WHOLE
  // archive, newest first. "Also in this issue" is discovery within a volume;
  // this is the plain gesture of reading on, and it never dead-ends.
  const ordered = published
    .flatMap((p) => (p.publishedAt ? [{ ...p, publishedAt: p.publishedAt }] : []))
    .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
  const here = ordered.findIndex((p) => p.id === paper.id);
  const newer = here > 0 ? ordered[here - 1] : null;
  const older = here >= 0 && here < ordered.length - 1 ? ordered[here + 1] : null;

  // Citation text, derived entirely from data on the page. The BibTeX author
  // field wants "A and B", not the display line's commas.
  const year = paper.publishedAt?.getFullYear();
  const citation = [
    // The author line does not carry terminal punctuation of its own (initials
    // aside), so the citation adds the period between authors and title.
    paper.authorLine.endsWith(".") ? paper.authorLine : `${paper.authorLine}.`,
    `“${paper.title}.”`,
    SITE_NAME +
      (issue ? `, Issue № ${issue.number}, ${issue.label}` : "") +
      ".",
    `${siteUrl()}/p/${paper.slug}`,
  ].join(" ");
  const bibtex = [
    `@article{${paper.slug}${year ? `-${year}` : ""},`,
    `  author  = {${paper.authorLine.split(",").map((s) => s.trim()).filter(Boolean).join(" and ")}},`,
    `  title   = {${paper.title}},`,
    `  journal = {${SITE_NAME}},`,
    ...(year ? [`  year    = {${year}},`] : []),
    ...(issue ? [`  number  = {${issue.number}},`] : []),
    `  url     = {${siteUrl()}/p/${paper.slug}}`,
    `}`,
  ].join("\n");

  // Flexible sampling markup. The abstract on this page is free and identical for
  // everyone, so there is no cloaking here, but the full paper genuinely requires
  // registration: the work is declared not-free with the gated region named by
  // cssSelector. Serving crawlers the PDF while showing readers a wall would be
  // cloaking and is penalised. This is the supported way to say "metered".
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ScholarlyArticle",
    headline: paper.title,
    abstract: paper.abstract,
    author: paper.authorLine
      .split(",")
      .map((name) => ({ "@type": "Person", name: name.trim() }))
      .filter((a) => a.name),
    datePublished: paper.publishedAt?.toISOString(),
    publisher: { "@type": "Organization", name: SITE_NAME },
    url: `${siteUrl()}/p/${paper.slug}`,
    ...(issue && {
      isPartOf: {
        "@type": "PublicationIssue",
        issueNumber: issue.number,
        name: `Issue № ${issue.number}, ${issue.label}`,
      },
    }),
    isAccessibleForFree: false,
    hasPart: {
      "@type": "WebPageElement",
      isAccessibleForFree: false,
      cssSelector: ".gated-download",
    },
  };

  return (
    <article>
      <script
        type="application/ld+json"
        // Escaping "<" prevents a title containing "</script>" from breaking out
        // of the tag. JSON.stringify alone does not escape it.
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />

      {/* The frontispiece: front matter set as a manuscript's title leaf. The
          ʿunwān headpiece takes the ornament slot, the title is centered at
          title-page scale, and the authors are promoted to the page's second
          voice — they are content, not metadata.

          The title deliberately does NOT set itself word by word: its ceremony
          is the carry from the index row (TitleCarry), and a shared-element
          morph landing on type that is still arriving would fight itself. */}
      <header className="border-b border-rule bg-surface print:border-0">
        <div className="mx-auto w-full max-w-4xl px-6 pb-14 pt-10">
          <Link
            href="/papers"
            className="group inline-flex items-center gap-1.5 text-sm text-muted-fg transition-colors hover:text-accent print:hidden"
          >
            <ArrowLeftIcon
              size={15}
              aria-hidden="true"
              className="transition-transform duration-200 ease-[var(--ease-out-strong)] group-hover:-translate-x-0.5"
            />
            All papers
          </Link>

          <Headpiece className="mx-auto mt-8 h-10 w-full max-w-sm text-gild print:hidden" />

          <TitleCarry slug={paper.slug}>
            <h1 className="mx-auto mt-7 max-w-3xl text-balance text-center font-serif text-[clamp(2.5rem,1.4rem+4.2vw,4.25rem)] leading-[1.05] tracking-tight text-ink">
              {paper.title}
            </h1>
          </TitleCarry>

          {/* Each name is a door into the archive: the question a reader asks
              right after deciding a paper is worth citing is what else its
              authors have published here. */}
          <p className="mt-6 text-center font-serif text-xl text-ink">
            <AuthorLine line={paper.authorLine} />
          </p>
          {paper.publishedAt && (
            <p className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-sm text-muted-fg">
              <span>Published {formatDate(paper.publishedAt)}</span>
              {issue && (
                // A typographic chip, not a bare link: the issue is an object
                // on this site (the archive shelves its covers), so its
                // citation dresses like one — and the border makes the
                // affordance visible where colour alone hid it.
                <Link
                  href={`/issues#${issue.anchor}`}
                  className="press-ink oldstyle-nums inline-flex items-center border border-rule-strong px-2 py-0.5 text-xs text-ink hover:border-accent hover:text-accent"
                >
                  № {issue.number} · {issue.label}
                </Link>
              )}
            </p>
          )}
        </div>
        {/* The page's one tile band: the threshold between front matter and
            the work itself. Full-strength tile — at /70 the band fell below the
            doctrine's own 3:1 ornament floor in light mode. */}
        <TileBand className="relative text-tile print:hidden" />
      </header>

      {/* ---- The running head ----
           Journal furniture: once the title leaf has gone by, the top margin of
           every page still says what you are reading, which volume it belongs
           to and — the one thing paper cannot do — how far through you are.
           Sticky under the site's own pinned strip; the gild rule at its foot
           fills with scroll where scroll-driven animations exist. */}
      <div className="running-head border-b border-rule bg-canvas/92 backdrop-blur-sm print:hidden">
        <div className="mx-auto flex h-11 w-full max-w-6xl items-baseline gap-x-4 px-6">
          <p className="min-w-0 truncate font-serif text-[0.9375rem] leading-none text-ink">
            {paper.title}
          </p>
          <span aria-hidden="true" className="leader max-sm:hidden" />
          {issue && (
            <span className="oldstyle-nums shrink-0 text-xs text-muted-fg max-sm:hidden">
              № {issue.number} · {issue.label}
            </span>
          )}
          <a
            href="#the-full-paper"
            className="ml-auto shrink-0 text-xs text-accent transition-colors hover:text-accent-dark sm:ml-0"
          >
            {user ? "Download" : "Get the PDF"}
          </a>
        </div>
        <div
          aria-hidden="true"
          className="progress-rule h-[2px] bg-gild"
        />
      </div>

      <div className="mx-auto w-full max-w-6xl px-6 py-12">
        <div className="grid gap-x-14 gap-y-12 lg:grid-cols-[minmax(0,1fr)_15rem]">
          <div className="min-w-0">
            <div className="max-w-[62ch]">
              {/* Small caps for the apparatus, serif for the work: the furniture
                  steps back so Garamond belongs to the scholarship alone. */}
              <h2 className="folio-label">Abstract</h2>
              {/* The site's one illuminated initial (DESIGN.md): the first letter
                  of the abstract, set in lapis Garamond three lines deep. The
                  gild lozenge closes the passage — the scribe's end-mark pairing
                  with the dropcap that opened it. */}
              <p className="prose-plain dropcap mt-5 text-[1.1875rem] leading-[1.75] text-ink-soft">
                {paper.abstract}
                <span aria-hidden="true">
                  {" "}
                  <Diamond className="text-gild" />
                </span>
              </p>
            </div>

            {/* The pool plate, mounted like every other photograph on the site
                (hairline, mount, image) and placed as an interlude AFTER the
                abstract: it decorates beside the work, it is not the work.
                Hidden in print — it is decoration, and it would cost ink. */}
            <Reveal className="reveal-plate">
              <figure className="group shadow-plate mt-12 border border-rule-strong bg-surface p-1.5 print:hidden">
                <div className="fillet relative aspect-16/9 w-full overflow-hidden sm:aspect-21/9">
                  <Image
                    src={paperImage(paper.slug)}
                    alt=""
                    fill
                    placeholder="blur"
                    sizes="(max-width: 1152px) 100vw, 46rem"
                    className="plate-drift object-cover"
                  />
                </div>
              </figure>
            </Reveal>

            {/* The gated moment, framed like a bookplate, with the gilded
                thread travelling its frame while the reader is on it. Named by
                the JSON-LD cssSelector above, so renaming this class silently
                breaks the metered-content declaration. */}
            <div
              id="the-full-paper"
              className="gated-download gild-thread-host shadow-plate relative mt-12 scroll-mt-32 overflow-hidden border border-rule-strong bg-surface p-7 print:hidden sm:p-9"
            >
              <Corners className="text-gild" />
              <span aria-hidden="true" className="gild-thread" />
              {/* Blind emboss: the press's device in ink-free relief, pressed
                  into the bookplate behind the text. Same colour as the ground,
                  so it reads as paper, not a second ornament. */}
              <Rosette className="emboss pointer-events-none absolute -right-6 top-1/2 size-40 -translate-y-1/2 max-sm:hidden" />
              {user ? (
                <div className="relative">
                  <h2 className="font-serif text-xl text-ink">The full paper</h2>
                  <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3">
                    <a
                      href={`/api/papers/${paper.id}/file`}
                      className="press-ink inline-flex items-center gap-2 rounded bg-accent px-5 py-2.5 text-sm font-medium text-surface hover:bg-accent-dark"
                    >
                      <DownloadSimpleIcon size={17} aria-hidden="true" />
                      Download the PDF
                    </a>
                    <span className="text-sm text-muted-fg">
                      {formatFileSize(paper.fileSize)}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="relative max-w-md">
                  <h2 className="flex items-center gap-2 font-serif text-xl text-ink">
                    <LockSimpleIcon
                      size={18}
                      className="text-muted-fg"
                      aria-hidden="true"
                    />
                    Download the full paper
                  </h2>
                  <p className="mt-3 text-[0.9375rem] leading-relaxed text-ink-soft">
                    The abstract above is free to read. The PDF needs an account,
                    which costs nothing; signing in with Google creates one.
                  </p>
                  <Link
                    href={`/login?next=/p/${paper.slug}`}
                    className="press-ink mt-5 inline-block rounded bg-accent px-5 py-2.5 text-sm font-medium text-surface hover:bg-accent-dark"
                  >
                    Sign in to download
                  </Link>
                </div>
              )}
            </div>

            {/* Scholarly furniture: scholars cite what is easy to cite, and the
                review's product is being citable. Plain hairline, no new
                ornament — this page's ornament budget is already spent. */}
            <section className="mt-12 border-t border-rule pt-9">
              <h2 className="folio-label">Cite this paper</h2>
              <p className="mt-4 max-w-[62ch] text-[0.9375rem] leading-relaxed text-ink-soft">
                {citation}
              </p>
              <div className="mt-5 flex flex-wrap gap-2.5 print:hidden">
                <CopyButton text={citation} label="Copy citation" />
                <CopyButton text={bibtex} label="Copy BibTeX" />
              </div>
            </section>

            {alsoInIssue.length > 0 && issue && (
              <section className="mt-12 border-t border-rule pt-9 print:hidden">
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <h2 className="folio-label oldstyle-nums">
                    Also in Issue № {issue.number}
                  </h2>
                  <Link
                    href={`/issues#${issue.anchor}`}
                    className="text-sm text-accent transition-colors hover:text-accent-dark"
                  >
                    The full issue
                  </Link>
                </div>
                {/* Set as a contents leaf with leaders, the same register the
                    archive uses — one grammar for "here is a list of papers". */}
                <Reveal flat>
                  <ol className="mt-3">
                    {alsoInIssue.map((p, i) => (
                      <li
                        key={p.id}
                        className="folio-row mark-margin border-b border-rule py-4 last:border-b-0"
                        style={{ "--i": i } as React.CSSProperties}
                      >
                        <div className="flex items-baseline">
                          <TitleCarry slug={p.slug}>
                            <h3 className="min-w-0 font-serif text-lg leading-snug">
                              <Link
                                href={`/p/${p.slug}`}
                                className="title-link text-ink hover:text-accent"
                              >
                                {p.title}
                              </Link>
                            </h3>
                          </TitleCarry>
                          {/* A leader leads TO something; where the locator is hidden the
                                dots would trail off into nothing. */}
                            <span aria-hidden="true" className="leader max-sm:hidden" />
                          <span className="oldstyle-nums shrink-0 whitespace-nowrap text-sm text-muted-fg max-sm:hidden">
                            {formatDate(p.publishedAt)}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-muted-fg">
                          {p.authorLine}
                        </p>
                      </li>
                    ))}
                  </ol>
                </Reveal>
              </section>
            )}
          </div>

          {/* ---- The colophon, in the margin ----
               The scribe's closing record of what this document is, moved out
               of the foot and into the margin where marginalia belongs: while
               the reader is inside the abstract, what the thing is stays beside
               their hand. Sticky on wide screens; it simply follows the
               abstract on narrow ones, which is where a foot-of-page colophon
               was anyway. */}
          <aside className="lg:sticky lg:top-[calc(var(--head-h)+4rem)] lg:self-start lg:border-l lg:border-rule lg:pl-7">
            <h2 className="folio-label">Colophon</h2>
            <dl className="mt-4 text-sm">
              {[
                [
                  "Published",
                  paper.publishedAt ? formatDate(paper.publishedAt) : "—",
                ],
                ["Volume", issue ? `№ ${issue.number}, ${issue.label}` : "—"],
                ["Format", formatFileSize(paper.fileSize)],
                ["Journal", SITE_NAME],
                ["Citation key", `${paper.slug}${year ? `-${year}` : ""}`],
                ["Access", "Abstract open · PDF with a free account"],
              ].map(([term, value]) => (
                <div
                  key={term}
                  className="border-t border-rule py-3 first:border-t-0 first:pt-0"
                >
                  <dt className="eyebrow">{term}</dt>
                  <dd className="oldstyle-nums mt-1 font-serif text-[1.0625rem] leading-snug text-ink">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          </aside>
        </div>

        {/* ---- The page turns ----
             Reading on, plainly: the papers either side of this one across the
             whole archive. An abstract page that ends in a wall is a page the
             reader leaves. */}
        {(newer || older) && (
          <nav
            aria-label="More papers"
            className="mt-16 grid gap-4 border-t border-rule pt-9 sm:grid-cols-2 sm:gap-10 print:hidden"
          >
            {[
              { paper: newer, label: "Newer paper", forward: false },
              { paper: older, label: "Older paper", forward: true },
            ].map(({ paper: neighbour, label, forward }) =>
              neighbour ? (
                <Link
                  key={label}
                  href={`/p/${neighbour.slug}`}
                  className={`group mark-margin block py-4 ${
                    forward ? "sm:text-right" : ""
                  }`}
                >
                  <span
                    className={`eyebrow flex items-center gap-2 ${
                      forward ? "sm:justify-end" : ""
                    }`}
                  >
                    {!forward && (
                      <ArrowLeftIcon
                        size={13}
                        aria-hidden="true"
                        className="transition-transform duration-200 ease-[var(--ease-out-strong)] group-hover:-translate-x-0.5"
                      />
                    )}
                    {label}
                    {forward && (
                      <ArrowRightIcon
                        size={13}
                        aria-hidden="true"
                        className="transition-transform duration-200 ease-[var(--ease-out-strong)] group-hover:translate-x-0.5"
                      />
                    )}
                  </span>
                  <span className="title-link mt-2 block font-serif text-xl leading-snug text-ink group-hover:text-accent">
                    {neighbour.title}
                  </span>
                  <span className="mt-1 block text-sm text-muted-fg">
                    {neighbour.authorLine}
                  </span>
                </Link>
              ) : (
                // No neighbour on this side — the reader still gets a way on,
                // rather than a lopsided row with a hole in it.
                <Link
                  key={label}
                  href="/papers"
                  className={`group block py-4 ${forward ? "sm:text-right" : ""}`}
                >
                  <span
                    className={`eyebrow flex items-center gap-2 ${
                      forward ? "sm:justify-end" : ""
                    }`}
                  >
                    {forward ? "The archive" : "The archive"}
                  </span>
                  <span className="title-link mt-2 block font-serif text-xl leading-snug text-ink group-hover:text-accent">
                    {forward ? "Every paper, newest first" : "Every paper, newest first"}
                  </span>
                </Link>
              ),
            )}
          </nav>
        )}
      </div>
    </article>
  );
}

/** Cut to a word boundary at or before `max`, adding an ellipsis if shortened. */
function truncateAtWord(text: string, max: number): string {
  const flat = text.replace(/\s+/g, " ").trim();
  if (flat.length <= max) return flat;
  const cut = flat.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return `${cut.slice(0, lastSpace > 0 ? lastSpace : max)}…`;
}

/** Google Scholar's expected date shape: YYYY/M/D, in the site's timezone. */
function scholarDate(date: Date): string {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: "Asia/Tashkent",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}/${get("month")}/${get("day")}`;
}

function formatFileSize(bytes: number): string {
  const mb = bytes / 1024 / 1024;
  // Papers under 100 KB are almost certainly a mistake, but show something sane
  // rather than "0.0 MB".
  return mb < 0.1
    ? `PDF, ${Math.max(1, Math.round(bytes / 1024))} KB`
    : `PDF, ${mb.toFixed(1)} MB`;
}
