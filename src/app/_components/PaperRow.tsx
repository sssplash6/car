import Image from "next/image";
import Link from "next/link";
import type { StaticImageData } from "next/image";
import { formatDate } from "@/lib/site";
import { paperImage } from "@/lib/regionalImages";

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
//
// The thumbnail stays a small catalogue plate at every width — full-bleed on
// mobile it stopped being a plate and became a hero for a photo that is only
// decoration.
export function PaperRow({
  paper,
  image,
}: {
  paper: PaperRowData;
  /** Index pages pass a collision-bumped image; default is the canonical hash. */
  image?: StaticImageData;
}) {
  return (
    <article className="grid grid-cols-[6.5rem_1fr] gap-5 border-b border-rule py-7 sm:grid-cols-[9rem_1fr] sm:gap-7">
      <Link
        href={`/p/${paper.slug}`}
        className="group relative block self-start border border-rule bg-surface p-1 transition-colors hover:border-accent"
        tabIndex={-1}
        aria-hidden="true"
      >
        {/* Mounted like a plate in a catalogue: hairline, mount, then image. */}
        <span className="relative block aspect-4/3 overflow-hidden">
          <Image
            src={image ?? paperImage(paper.slug)}
            alt=""
            fill
            placeholder="blur"
            sizes="(max-width: 640px) 6.5rem, 9rem"
            className="object-cover transition-transform duration-200 ease-[var(--ease-out-strong)] group-hover:scale-[1.04]"
          />
        </span>
      </Link>

      <div className="min-w-0 max-w-[65ch]">
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
