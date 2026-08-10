"use client";

import { motion, useReducedMotion } from "motion/react";

// Rising clip reveal for the homepage hero image: the picture is unveiled from
// the ground up, like masonry going up, while a slight scale settles out. Used
// once per page at most, on load — this is ceremony, and ceremony repeated
// stops being ceremony.
//
// clip-path and transform only, so the reveal never causes layout. Composes
// with the ArchFrame clip on the child, since each clips its own element.
export function ClipReveal({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  /** Seconds. */
  delay?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();

  if (reduce) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={className}
      initial={{ clipPath: "inset(100% 0% 0% 0%)" }}
      animate={{ clipPath: "inset(0% 0% 0% 0%)" }}
      transition={{ duration: 0.9, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.div
        className="h-full w-full"
        initial={{ scale: 1.06 }}
        animate={{ scale: 1 }}
        transition={{ duration: 1.1, delay, ease: [0.16, 1, 0.3, 1] }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}
