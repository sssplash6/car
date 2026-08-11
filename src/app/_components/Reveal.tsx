"use client";

import { useLayoutEffect, useRef } from "react";

// Entrance reveal — the site's one general-purpose motion primitive.
//
// Entrances MATERIALIZE: opacity + a 14px rise + a slight blur that resolves
// (globals.css owns the keyframes/transitions). The blur is the difference
// between polish and PowerPoint; it is also cheap, because it only exists for
// the 600ms of the entrance.
//
// The server always renders content VISIBLE. Public pages are the site's whole
// search presence, so the markup must never ship hidden: a crawler, a no-JS
// reader, or anyone on a slow connection sees the page immediately. Motion is
// layered on top only after hydration, and only for elements still below the
// fold — which also means a deep-linked anchor never lands on invisible text.
//
// Two modes. Scroll mode (default) hides below-viewport elements post-
// hydration and lets each section resolve as the eye arrives. Load mode is for
// above-the-fold hero orchestration and is pure CSS (.reveal-load), so the
// choreography plays with the first paint instead of waiting for hydration.
export function Reveal({
  children,
  delay = 0,
  load = false,
  className,
}: {
  children: React.ReactNode;
  /** Seconds. Use 0.05–0.08 increments only for siblings that enter TOGETHER
      (an orchestrated group); elements that scroll in alone should keep 0, or
      the delay reads as lag. */
  delay?: number;
  /** Animate on first paint (hero orchestration) instead of on scroll into view. */
  load?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (load) return;
    const el = ref.current;
    if (!el) return;

    // The CSS fallback zeroes durations, but skipping entirely also avoids the
    // hide-then-instantly-show attribute churn.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // Only elements entirely below the viewport get the entrance. Anything
    // already on screen (first paint, back-navigation, anchor jump) is being
    // read right now — hiding it to animate it back would be motion for the
    // author, not the reader.
    if (el.getBoundingClientRect().top <= window.innerHeight) return;

    el.dataset.reveal = "pending";
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          // Removing the attribute lets the base transition carry it home.
          delete el.dataset.reveal;
          io.disconnect();
        }
      },
      // Fires at 20% visible so the motion is done before the element fully
      // arrives — matching the old whileInView amount.
      { threshold: 0.2 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [load]);

  const style = delay
    ? ({ "--reveal-delay": `${delay}s` } as React.CSSProperties)
    : undefined;

  if (load) {
    return (
      <div className={`reveal-load ${className ?? ""}`} style={style}>
        {children}
      </div>
    );
  }

  return (
    <div ref={ref} className={`reveal-scroll ${className ?? ""}`} style={style}>
      {children}
    </div>
  );
}
