import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getOptionalUser } from "@/lib/dal";
import { PAPER_STATUS } from "@/lib/papers";
import { SITE_NAME, formatDate, siteUrl } from "@/lib/site";

// A published paper's abstract page. Public and crawlable — the PDF behind it is
// gated, so this page carries all of the paper's search weight.
//
// Only PUBLISHED papers resolve here. An author checking their own pending
// submission does that from /submissions, which keeps this page's visibility rule
// to a single condition.

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

  // The abstract doubles as the meta description. Trimmed to ~155 chars because
  // Google truncates around there, and a description cut mid-word reads badly.
  const description = truncateAtWord(paper.abstract, 155);

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
    },
  };
}

export default async function PaperPage({ params }: PageProps) {
  const { slug } = await params;
  const paper = await findPublished(slug);

  if (!paper) notFound();

  const user = await getOptionalUser();

  // Flexible sampling markup. The abstract on this page is free and identical for
  // everyone — there is no cloaking here — but the full paper genuinely requires
  // registration, so the work is declared not-free with the gated region named by
  // cssSelector. Serving crawlers the PDF while showing readers a wall would be
  // cloaking and is penalised; this is the supported way to say "metered".
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
    publisher: { "@type": "Organization", name: "Freshman Academy" },
    url: `${siteUrl()}/p/${paper.slug}`,
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

      <h1 className="font-serif text-3xl leading-tight text-ink">{paper.title}</h1>
      <p className="mt-3 text-sm text-muted-fg">
        {paper.authorLine}
        {paper.publishedAt && ` · ${formatDate(paper.publishedAt)}`}
      </p>

      <h2 className="mt-12 font-serif text-lg text-ink">Abstract</h2>
      <p className="abstract-body mt-3 leading-relaxed text-ink/90">
        {paper.abstract}
      </p>

      <div className="gated-download mt-12 border-t border-line pt-8">
        {user ? (
          <>
            <a
              href={`/api/papers/${paper.id}/file`}
              className="inline-flex items-center rounded-md bg-brand px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-dark"
            >
              Download the full paper (PDF)
            </a>
            <p className="mt-2 text-xs text-muted-fg">
              {formatFileSize(paper.fileSize)}
            </p>
          </>
        ) : (
          <>
            <Link
              href={`/login?next=/p/${paper.slug}`}
              className="inline-flex items-center rounded-md bg-brand px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-dark"
            >
              Sign in to read the full paper
            </Link>
            <p className="mt-2 text-xs text-muted-fg">
              Free — the abstract above is the full summary.
            </p>
          </>
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

function formatFileSize(bytes: number): string {
  const mb = bytes / 1024 / 1024;
  // Sub-100 KB papers are almost certainly a mistake, but show something sane
  // rather than "0.0 MB".
  return mb < 0.1 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${mb.toFixed(1)} MB`;
}
