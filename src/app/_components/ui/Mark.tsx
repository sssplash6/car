import type { CSSProperties } from "react";
import Image from "next/image";
import { cx } from "./cx";
import logo from "./logo.png";

// The logo: the hand-drawn sun-face roundel with "The Central Asian Review"
// lettered in its rays, cut to a circle with a transparent outside (source:
// the owner's drawing, 2026-11-15). Decorative (alt=""): every use sits next to
// the wordmark or inside a labelled link. The same file feeds the favicon,
// the home-screen icon and the share cards.
export function Mark({
  size,
  priority = false,
  className,
}: {
  size: number;
  /** Above the fold on every page (the header): load it eagerly. */
  priority?: boolean;
  className?: string;
}) {
  return (
    <Image
      src={logo}
      alt=""
      width={size}
      height={size}
      priority={priority}
      className={cx("mark-logo", className)}
    />
  );
}

/** Static skeleton block (DESIGN.md §8.20): surface-3, no shimmer. The page
    wraps a set of these in `.skeleton`, which appears only after 300ms. */
export function Skeleton({ className, style }: { className?: string; style?: CSSProperties }) {
  return <span className={cx("skel", className)} style={style} aria-hidden="true" />;
}
