import Image from "next/image";
import Link from "next/link";
import { formatDate } from "@/lib/site";
import { paperImage } from "@/lib/placeholderImage";

export type PaperRowData = {
  id: string;
  slug: string;
  title: string;
  abstract: string;
  authorLine: string;
  publishedAt: Date | null;
};

// One paper in the /papers index. A thumbnail plus text rather than the homepage's
// numbered rows, because this list is browsed rather than read in order.
export function PaperRow({ paper }: { paper: PaperRowData }) {
  return (
    <article className="grid gap-5 border-b border-rule py-7 sm:grid-cols-[9rem_1fr] sm:gap-7">
      <Link
        href={`/p/${paper.slug}`}
        className="group relative block aspect-3/2 overflow-hidden sm:aspect-4/3"
        tabIndex={-1}
        aria-hidden="true"
      >
        <Image
          src={paperImage(paper.slug, 360, 270)}
          alt=""
          fill
          sizes="(max-width: 640px) 100vw, 9rem"
          className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
        />
      </Link>

      <div className="min-w-0">
        <h2 className="font-serif text-xl leading-snug">
          <Link
            href={`/p/${paper.slug}`}
            className="text-ink transition-colors hover:text-accent"
          >
            {paper.title}
          </Link>
        </h2>
        <p className="mt-1.5 text-sm text-muted-fg">
          {paper.authorLine}
          {paper.publishedAt && ` · ${formatDate(paper.publishedAt)}`}
        </p>
        {/* Clamped in CSS rather than truncated in JS: the full abstract stays in
            the DOM for crawlers while readers see two lines. */}
        <p className="mt-2.5 line-clamp-2 leading-relaxed text-ink-soft">
          {paper.abstract}
        </p>
      </div>
    </article>
  );
}
