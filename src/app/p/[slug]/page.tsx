import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  ArrowLeftIcon,
  DownloadSimpleIcon,
  LockSimpleIcon,
} from "@phosphor-icons/react/dist/ssr";
import { prisma } from "@/lib/prisma";
import { getOptionalUser } from "@/lib/dal";
import { PAPER_STATUS } from "@/lib/papers";
import { SITE_NAME, formatDate, siteUrl } from "@/lib/site";
import { paperImage } from "@/lib/placeholderImage";

// A published paper's abstract page. Public and crawlable: the PDF behind it is
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

  // The abstract doubles as the meta description, trimmed to ~155 characters
  // because Google truncates around there and a description cut mid-word reads
  // badly.
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
      images: [paperImage(paper.slug, 1200, 630)],
    },
  };
}

export default async function PaperPage({ params }: PageProps) {
  const { slug } = await params;
  const paper = await findPublished(slug);

  if (!paper) notFound();

  const user = await getOptionalUser();

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

      {/* Header sits on a wider measure than the body, so the title can breathe
          while the abstract stays at a readable line length. */}
      <header className="border-b border-rule bg-surface">
        <div className="mx-auto w-full max-w-4xl px-6 pb-12 pt-10">
          <Link
            href="/papers"
            className="inline-flex items-center gap-1.5 text-sm text-muted-fg transition-colors hover:text-accent"
          >
            <ArrowLeftIcon size={15} aria-hidden="true" />
            All papers
          </Link>

          <h1 className="display-flush mt-7 font-serif text-[2.25rem] leading-[1.1] tracking-tight text-ink sm:text-[3rem]">
            {paper.title}
          </h1>

          <p className="mt-5 text-[0.9375rem] text-ink-soft">
            {paper.authorLine}
          </p>
          {paper.publishedAt && (
            <p className="mt-1 text-sm text-muted-fg">
              Published {formatDate(paper.publishedAt)}
            </p>
          )}
        </div>
      </header>

      <div className="relative mx-auto aspect-16/9 w-full max-w-4xl overflow-hidden sm:aspect-21/9">
        <Image
          src={paperImage(paper.slug, 1400, 600)}
          alt=""
          fill
          priority
          sizes="(max-width: 896px) 100vw, 56rem"
          className="object-cover"
        />
      </div>

      <div className="mx-auto w-full max-w-4xl px-6 py-14">
        <div className="max-w-[62ch]">
          <h2 className="font-serif text-xl text-ink">Abstract</h2>
          <p className="prose-plain mt-4 text-[1.0625rem] leading-[1.75] text-ink-soft">
            {paper.abstract}
          </p>
        </div>

        {/* The gated moment. Named by the JSON-LD cssSelector above, so renaming
            this class silently breaks the metered-content declaration. */}
        <div className="gated-download mt-14 border-t border-rule-strong pt-10">
          {user ? (
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
              <a
                href={`/api/papers/${paper.id}/file`}
                className="inline-flex items-center gap-2 rounded bg-accent px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-dark active:translate-y-px"
              >
                <DownloadSimpleIcon size={17} aria-hidden="true" />
                Download the full paper
              </a>
              <span className="text-sm text-muted-fg">
                PDF, {formatFileSize(paper.fileSize)}
              </span>
            </div>
          ) : (
            <div className="max-w-md">
              <h2 className="flex items-center gap-2 font-serif text-xl text-ink">
                <LockSimpleIcon
                  size={18}
                  className="text-muted-fg"
                  aria-hidden="true"
                />
                Read the full paper
              </h2>
              <p className="mt-3 text-[0.9375rem] leading-relaxed text-ink-soft">
                The abstract above is free to read. Downloading the full PDF needs
                an account, which costs nothing.
              </p>
              <Link
                href={`/login?next=/p/${paper.slug}`}
                className="mt-5 inline-block rounded bg-accent px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-dark active:translate-y-px"
              >
                Sign in to continue
              </Link>
            </div>
          )}
        </div>
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
  // Papers under 100 KB are almost certainly a mistake, but show something sane
  // rather than "0.0 MB".
  return mb < 0.1
    ? `${Math.max(1, Math.round(bytes / 1024))} KB`
    : `${mb.toFixed(1)} MB`;
}
