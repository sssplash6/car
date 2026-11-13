"use client";

import Link from "next/link";
import { useState, type PointerEvent, type FocusEvent, type ReactNode } from "react";
import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr";
import { PlateChip } from "@/app/_components/ui/IssuePlate";
import { cx } from "@/app/_components/ui/cx";
import { formatShortDate } from "@/lib/format";
import { No } from "@/app/_components/ui/Numero";

// The preview pane beside the papers list (wide screens only). It follows the
// row under the pointer or the keyboard focus: the issue's plate in miniature
// (its colour and drawing), then the title, authors and the opening of the
// abstract. At rest it shows the newest paper, so the column is never empty.
// Rows stay ordinary links; the pane is a visual aid (aria-hidden), since the
// paper page carries the full abstract.

export type PreviewItem = {
  slug: string;
  title: string;
  authors: string;
  date: string | null;
  snippet: string;
  issue: { number: number; label: string } | null;
  /** The paper's cover art; when set it takes the plate's place. */
  coverImage?: string | null;
};

export function PapersPreview({
  items,
  plates,
  children,
}: {
  items: PreviewItem[];
  /** Per issue number: its plate class and the drawing, rendered on the server. */
  plates: Record<number, { className: string; art: ReactNode }>;
  children: ReactNode;
}) {
  const [active, setActive] = useState<string | null>(null);
  const item = items.find((candidate) => candidate.slug === active) ?? items[0];

  function follow(event: PointerEvent | FocusEvent) {
    const row = (event.target as Element | null)?.closest?.("[data-slug]") as HTMLElement | null;
    const slug = row?.dataset.slug;
    if (slug && slug !== active) setActive(slug);
  }

  const plate = item?.issue ? plates[item.issue.number] : undefined;

  return (
    <div className="papers-layout">
      <div className="papers-list" onPointerOver={follow} onFocus={follow}>
        {children}
      </div>
      {item && (
        <aside className="papers-preview" aria-hidden="true">
          <div key={item.slug} className="papers-preview-in">
            {item.coverImage ? (
              <div className={cx("pv-plate pv-plate-cover", plate?.className)}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.coverImage} alt="" className="pv-cover" />
              </div>
            ) : plate && item.issue && (
              <div className={cx("pv-plate", plate.className)}>
                {plate.art}
                <span className="pv-num">{item.issue.number}</span>
              </div>
            )}
            {item.issue && (
              <p className="pv-eyebrow mt-5">
                <PlateChip number={item.issue.number} label={item.issue.label} />
                <span className="t-meta">
                  <No /> {item.issue.number} · {item.issue.label}
                </span>
              </p>
            )}
            <p className="pv-title">{item.title}</p>
            <p className="pv-authors">{item.authors}</p>
            <p className="pv-snippet">{item.snippet}</p>
            <div className="mt-5 flex items-center justify-between gap-4">
              {item.date && <span className="t-meta">{formatShortDate(item.date)}</span>}
              <Link href={`/p/${item.slug}`} className="link" tabIndex={-1}>
                <span>Read the abstract</span>
                <ArrowRightIcon aria-hidden="true" />
              </Link>
            </div>
          </div>
        </aside>
      )}
    </div>
  );
}
