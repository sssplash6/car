"use client";

import { motion, useReducedMotion } from "motion/react";

// Scroll-entry reveal.
//
// The only motion primitive on the site, deliberately. Its job is hierarchy: it
// lets a section resolve after the eye arrives rather than competing for
// attention on load. A research publication should not perform.
//
// Isolated as a client leaf so the pages that use it stay server components, and
// it collapses to a plain render under prefers-reduced-motion rather than
// animating faster.
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  /** Seconds. Use small increments to stagger siblings. */
  delay?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();

  if (reduce) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      // once: true so scrolling back up does not replay it, which reads as a bug.
      // amount 0.2 fires early enough that the motion is finished before the
      // element is fully in view.
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
