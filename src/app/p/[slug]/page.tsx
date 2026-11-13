import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeftIcon, ArrowRightIcon, DownloadSimpleIcon } from "@phosphor-icons/react/dist/ssr";
import { prisma } from "@/lib/prisma";
import { getOptionalUser } from "@/lib/dal";
import { PAPER_STATUS } from "@/lib/papers";
import { issueFor, tashkentQuarter } from "@/lib/issues";
import { SITE_NAME, formatDate, siteUrl } from "@/lib/site";
import { formatFileSize } from "@/lib/format";
import { plateSubject } from "@/lib/plates";
import { COPY } from "@/lib/content";
import { citeFormats } from "@/lib/cite";
import { AuthorLine } from "@/app/_components/AuthorLine";
import { TitleCarry } from "@/app/_components/TitleCarry";
import { Reveal } from "@/app/_components/motion/Reveal";
import { Button } from "@/app/_components/ui/Button";
import { RuleDraw } from "@/app/_components/ui/HeadlineStack";
import { PlateChip } from "@/app/_components/ui/IssuePlate";
import { DoorPanel } from "@/app/_components/ui/Paper";
import { CiteBlock } from "@/app/_components/ui/CiteBlock";
import { PaperRow } from "@/app/_components/ui/PaperRow";
import { RunningHead } from "@/app/_components/ui/RunningHead";
import { cx } from "@/app/_components/ui/cx";
import { No } from "@/app/_components/ui/Numero";

// A published paper's abstract page (DESIGN.md §9.4). Public and crawlable:
// the PDF behind it is gated, so this page carries all of the paper's search
// weight. Only PUBLISHED papers resolve here.
//
// One centred reading column, no rail: the title (carried from the row the
// reader clicked), the authors as doors into the archive, one meta line, the
// abstract in full and in one block, then the door to the PDF — the only dark
// surface before the footer — the citation, and the way on.

type PageProps = { params: Promise<{ slug: string }> };

const publishedSelect = {
  id: true,
  slug: true,
  title: true,
  abstract: true,
  authorLine: true,
  originalName: true,
  fileSize: true,
  coverImage: true,
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
  // because Google truncates around there.
  const description = truncateAtWord(paper.abstract, 155);

  return {
    title: paper.title,
    description,
    alternates: { canonical: `/p/${paper.slug}` },
    // The share card comes from this route's opengraph-image.tsx.
    openGraph: {
      type: "article",
      title: paper.title,
      description,
      url: `${siteUrl()}/p/${paper.slug}`,
      siteName: SITE_NAME,
      publishedTime: paper.publishedAt?.toISOString(),
    },
    // Highwire citation_* tags: Google Scholar's inclusion rules require these
    // and do NOT parse JSON-LD. citation_pdf_url is deliberately absent: the
    // PDF is gated, and pointing Scholar at a login wall is worse than pointing
    // it at the abstract.
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

  const [user, published] = await Promise.all([
    getOptionalUser(),
    prisma.paper.findMany({
      where: { status: PAPER_STATUS.PUBLISHED },
      select: { id: true, slug: true, title: true, authorLine: true, publishedAt: true },
    }),
  ]);

  const publishDates = published.flatMap((p) => (p.publishedAt ? [p.publishedAt] : []));

  // Which quarterly issue this paper belongs to (src/lib/issues.ts).
  const issue = paper.publishedAt ? issueFor(publishDates, paper.publishedAt) : null;

  // The rest of this paper's quarter, newest first.
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
        .slice(0, 3)
    : [];

  // The page turns: the papers either side of this one across the whole
  // archive, newest first.
  const ordered = published
    .flatMap((p) => (p.publishedAt ? [{ ...p, publishedAt: p.publishedAt }] : []))
    .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
  const here = ordered.findIndex((p) => p.id === paper.id);
  const newer = here > 0 ? ordered[here - 1] : null;
  const older = here >= 0 && here < ordered.length - 1 ? ordered[here + 1] : null;

  // Citations in four styles (src/lib/cite.ts), all from data on the page.
  const paperUrl = `${siteUrl()}/p/${paper.slug}`;
  const formats = citeFormats({
    authorLine: paper.authorLine,
    title: paper.title,
    year: paper.publishedAt?.getFullYear(),
    issue,
    url: paperUrl,
    journal: SITE_NAME,
    slug: paper.slug,
  });

  // Flexible sampling markup: the abstract is free and identical for everyone;
  // the full paper requires registration, so the work is declared not-free
  // with the gated region named by cssSelector (the door panel below).
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

  const fileUrl = `/api/papers/${paper.id}/file`;
  const size = formatFileSize(paper.fileSize);
  const gate = COPY.paper.gate;
  const d = (ms: number) => ({ "--d": `${ms}ms` }) as React.CSSProperties;

  return (
    <article className="page-end">
      <script
        type="application/ld+json"
        // Escaping "<" keeps a title containing "</script>" inside the tag.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />

      <header className="paper-head wrap">
        {issue && (
          <Link href={`/issues#${issue.anchor}`} className="paper-eyebrow fade-load">
            <PlateChip number={issue.number} label={issue.label} carry />
            <span className="t-meta">
              <No /> {issue.number} · {issue.label}
            </span>
          </Link>
        )}
        {/* The title carries from the row the reader clicked; it does not
            rise word by word (a morph landing on moving type fights itself). */}
        <TitleCarry slug={paper.slug} mode="always">
          <h1 className={cx("paper-title fade-load", paper.title.length > 80 ? "t-h2" : "t-title")}>
            {paper.title}
          </h1>
        </TitleCarry>
        <p className="paper-authors rise-load" style={d(300)}>
          <AuthorLine line={paper.authorLine} separator=" · " />
        </p>
        <RuleDraw />
        <p className="meta-line rise-load" style={d(360)}>
          {paper.publishedAt && (
            <>
              <span>Published {formatDate(paper.publishedAt)}</span>
              {" · "}
            </>
          )}
          <span>PDF, {size}</span>
          {" · "}
          {user ? (
            <a href={fileUrl}>Download</a>
          ) : (
            <a href="#the-full-paper">{COPY.paper.freeWithAccount}</a>
          )}
        </p>
      </header>

      <div id="rh-sentinel" aria-hidden="true" />
      <RunningHead
        title={paper.title}
        issue={issue}
        action={user ? { href: fileUrl, label: "Download" } : { href: "#the-full-paper", label: "Get the PDF" }}
        sentinelId="rh-sentinel"
      />

      <div className="wrap-narrow">
        {paper.coverImage && (
          <Reveal gesture="settle" className="paper-cover">
            {/* A plain img: covers come in any size and Next's optimiser
                needs the dimensions up front. Covers are public, like the
                abstract, so there is no gate here. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={paper.coverImage} alt={`Cover art for ${paper.title}`} loading="eager" />
          </Reveal>
        )}
        <Reveal as="section" className="abstract" aria-labelledby="abstract-label">
          <h2 id="abstract-label" className="t-meta">
            {COPY.paper.abstractLabel}
          </h2>
          <p className="t-read prose-plain">{paper.abstract}</p>
        </Reveal>

        {/* Named by the JSON-LD cssSelector above: renaming the class or the
            id silently breaks the metered-content declaration. */}
        <DoorPanel
          id="the-full-paper"
          className="gated-download"
          drawing={issue ? plateSubject(issue.number) : undefined}
          {...(user
            ? {
                title: gate.signedInTitle,
                line: `PDF · ${size}`,
                action: (
                  <a href={fileUrl} className="btn btn-on-door btn-lg">
                    <DownloadSimpleIcon aria-hidden="true" />
                    {gate.signedInAction}
                  </a>
                ),
              }
            : {
                title: gate.signedOutTitle,
                line: gate.signedOutBody,
                action: (
                  <Button variant="on-door" size="lg" href={`/login?next=/p/${paper.slug}`}>
                    {gate.signedOutAction}
                  </Button>
                ),
                aside: (
                  <Button variant="link" href="/about#readers" className="link-door">
                    {gate.why}
                  </Button>
                ),
              })}
        />

        <CiteBlock formats={formats} url={paperUrl} label={COPY.paper.citeLabel} />

        {alsoInIssue.length > 0 && issue && (
          <section className="also" aria-labelledby="also-title">
            <Reveal className="also-head">
              <h2 id="also-title" className="t-meta">
                {COPY.paper.alsoIn} <No /> {issue.number}
              </h2>
              <Button variant="link" href={`/issues#${issue.anchor}`}>
                {COPY.paper.fullIssue}
              </Button>
            </Reveal>
            <Reveal as="ol" gesture="rows" className="rows">
              {alsoInIssue.map((p, i) => (
                <PaperRow key={p.id} paper={p} index={i} titleSize="h4" meta="none" />
              ))}
            </Reveal>
          </section>
        )}

        <Reveal as="nav" className="pn" aria-label="More papers">
          {newer ? (
            <Link href={`/p/${newer.slug}`}>
              <span className="t-meta">
                <ArrowLeftIcon aria-hidden="true" />
                Newer paper
              </span>
              <span className="t-h4">{newer.title}</span>
              <span className="who">{newer.authorLine}</span>
            </Link>
          ) : (
            <Link href="/papers">
              <span className="t-meta">The archive</span>
              <span className="t-h4">Every paper, newest first</span>
            </Link>
          )}
          {older ? (
            <Link href={`/p/${older.slug}`} className="fwd">
              <span className="t-meta">
                Older paper
                <ArrowRightIcon aria-hidden="true" />
              </span>
              <span className="t-h4">{older.title}</span>
              <span className="who">{older.authorLine}</span>
            </Link>
          ) : (
            <Link href="/papers" className="fwd">
              <span className="t-meta">The archive</span>
              <span className="t-h4">Every paper, newest first</span>
            </Link>
          )}
        </Reveal>
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
