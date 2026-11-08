import Link from "next/link";
import type { CSSProperties } from "react";
import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr";
import { TitleCarry } from "@/app/_components/TitleCarry";
import { formatShortDate } from "@/lib/format";
import { PlateChip } from "./IssuePlate";
import { cx } from "./cx";

// One paper in a list (DESIGN.md §8.9): title, authors, one meta. No glyph,
// no thumbnail, no numbering, and no abstract text at rest. The whole row is
// the link; hover is a background pseudo-element and an arrow, so it never
// moves another row. data-slug lets /papers' preview pane follow the row.

export type RowPaper = {
  slug: string;
  title: string;
  authorLine: string;
  publishedAt: Date | null;
  abstract?: string;
  issue?: { number: number; label: string } | null;
};

export function PaperRow({
  paper,
  index,
  titleSize = "h3",
  meta = "date",
  carry = true,
  className,
}: {
  paper: RowPaper;
  index: number;
  titleSize?: "h3" | "h4";
  meta?: "date" | "date-issue" | "none";
  carry?: boolean;
  className?: string;
}) {
  const title = (
    <h3 className={cx("row-title", `t-${titleSize}`)}>
      <Link href={`/p/${paper.slug}`}>{paper.title}</Link>
    </h3>
  );
  return (
    <li
      className={cx("row", `row-${titleSize}`, className)}
      data-slug={paper.slug}
      style={{ "--i": index } as CSSProperties}
    >
      <div>
        {carry ? <TitleCarry slug={paper.slug}>{title}</TitleCarry> : title}
        <p className="row-authors">{paper.authorLine}</p>
      </div>
      <div className="row-meta">
        {meta !== "none" && paper.publishedAt && (
          <span className="row-meta-stack">
            <time className="t-meta" dateTime={paper.publishedAt.toISOString()}>
              {formatShortDate(paper.publishedAt)}
            </time>
            {meta === "date-issue" && paper.issue && (
              <>
                <PlateChip number={paper.issue.number} label={paper.issue.label} />
                <span className="sr-only">
                  Issue {paper.issue.number}, {paper.issue.label}
                </span>
              </>
            )}
          </span>
        )}
        <ArrowRightIcon className="row-arrow" aria-hidden="true" />
      </div>
    </li>
  );
}
