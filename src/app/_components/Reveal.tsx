"use client";

import { motion, useReducedMotion } from "motion/react";

// Entrance reveal — the site's one general-purpose motion primitive.
//
// Entrances MATERIALIZE: opacity + a 14px rise + a slight blur that resolves,
// which reads as coming into focus rather than sliding around. The blur is the
// difference between polish and PowerPoint; it is also cheap, because it only
// exists for the 600ms of the entrance.
//
// Two modes. Scroll mode (default) lets a section resolve after the eye
// arrives. Load mode is for above-the-fold hero orchestration only, where
// waiting for a scroll observer would delay the first paint's choreography.
//
// Isolated as a client leaf so the pages that use it stay server components,
// and it collapses to a plain render under prefers-reduced-motion rather than
// animating faster.
export function Reveal({
  children,
  delay = 0,
  load = false,
  className,
}: {
  children: React.ReactNode;
  /** Seconds. Use 0.05–0.08 increments to stagger siblings. */
  delay?: number;
  /** Animate on mount (hero orchestration) instead of on scroll into view. */
  load?: boolean;
  className?: string;
}) {
  const reduce = useReducedMotion();

  if (reduce) return <div className={className}>{children}</div>;

  const hidden = { opacity: 0, y: 14, filter: "blur(6px)" };
  const shown = { opacity: 1, y: 0, filter: "blur(0px)" };

  return (
    <motion.div
      className={className}
      initial={hidden}
      {...(load
        ? { animate: shown }
        : {
            whileInView: shown,
            // once: true so scrolling back up does not replay it, which reads
            // as a bug. amount 0.2 fires early enough that the motion is
            // finished before the element is fully in view.
            viewport: { once: true, amount: 0.2 },
          })}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
