import Link from "next/link";
import { Drawing } from "@/app/_components/illustrations/Drawing";
import { PlateCarry } from "@/app/_components/motion/PlateCarry";
import { plateFor, plateFromLabel, type Quarter } from "@/lib/plates";
import { cx } from "./cx";

// An issue as an object (DESIGN.md §8.10): a soft plate in its season's
// pastel, its number in a large light serif, one line drawing of the region.
// Text and lines are always plate ink at 100% (ink on light, cream on dark).

export type PlateIssue = {
  number: number;
  year: number;
  quarter: Quarter;
  label: string;
  paperCount?: number;
};

const papers = (n: number) => `${n} ${n === 1 ? "paper" : "papers"}`;

export function IssuePlate({
  issue,
  variant,
  href,
  current = false,
  carry = false,
  draw = "view",
  className,
}: {
  issue: PlateIssue;
  variant: "hero" | "spread";
  href?: string;
  current?: boolean;
  /** "click": travels when clicked (home); "always": receives (/issues). */
  carry?: false | "click" | "always";
  draw?: "view" | "load" | "none";
  className?: string;
}) {
  const plate = plateFor(issue);
  const count = issue.paperCount;
  const label = `Issue ${issue.number}, ${issue.label}${count !== undefined ? `, ${papers(count)}` : ""}`;
  const classes = cx("plate", `plate-${variant}`, plate.className, className);

  const inner = (
    <>
      <div className="plate-top" aria-hidden="true">
        <span>
          {current && <i className="dot-accent" />}
          {issue.label}
        </span>
        {count !== undefined && <span>{papers(count)}</span>}
      </div>
      <Drawing name={plate.subject} size="plate" tone="plate" draw={draw} delay={200} />
      <span className="plate-num t-numeral" aria-hidden="true">
        {issue.number}
      </span>
    </>
  );

  const element = href ? (
    <Link href={href} className={classes} aria-label={label}>
      {inner}
    </Link>
  ) : (
    <div className={classes} role="img" aria-label={label}>
      {inner}
    </div>
  );

  return carry ? (
    <PlateCarry number={issue.number} mode={carry}>
      {element}
    </PlateCarry>
  ) : (
    element
  );
}

/** The 20 × 26 chip: the issue's colour and number, from issueFor()'s label.
    Decorative — callers name the issue in text beside it. */
export function PlateChip({
  number,
  label,
  carry = false,
  className,
}: {
  number: number;
  label: string;
  carry?: boolean;
  className?: string;
}) {
  const plate = plateFromLabel(number, label);
  const chip = (
    <span className={cx("plate-chip", plate.className, className)} aria-hidden="true">
      {number}
    </span>
  );
  return carry ? (
    <PlateCarry number={number} as="span">
      {chip}
    </PlateCarry>
  ) : (
    chip
  );
}
