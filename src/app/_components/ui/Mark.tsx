import type { CSSProperties } from "react";
import { DrawingFrom } from "@/app/_components/illustrations/render";
import { mark } from "@/app/_components/illustrations/data/mark";
import { cx } from "./cx";

// The logo: three nested contour rings of a summit seen from above, with the
// terracotta summit dot (DESIGN.md §5.4 #9). draw="session" animates only on
// the first page of a browser session (html[data-first-visit], set pre-paint
// in layout.tsx), so it never flashes after hydration.
export function Mark({
  size,
  draw = "none",
  tone = "ink",
  delay = 0,
  className,
}: {
  size: 24 | 32 | 96;
  draw?: "load" | "session" | "view" | "none";
  tone?: "ink" | "door";
  /** ms before the first ring draws. */
  delay?: number;
  className?: string;
}) {
  return (
    <DrawingFrom
      data={mark}
      name="mark"
      size={`mark-${size}`}
      tone={tone}
      draw={draw === "session" ? "none" : draw}
      delay={delay}
      stagger={120}
      className={cx(draw === "session" && "mark-draw", className)}
    />
  );
}

/** Static skeleton block (DESIGN.md §8.20): surface-3, no shimmer. The page
    wraps a set of these in `.skeleton`, which appears only after 300ms. */
export function Skeleton({ className, style }: { className?: string; style?: CSSProperties }) {
  return <span className={cx("skel", className)} style={style} aria-hidden="true" />;
}
