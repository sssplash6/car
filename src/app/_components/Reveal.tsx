"use client";

import { useLayoutEffect, useRef } from "react";

// Entrance reveal — the site's general-purpose motion TRIGGER.
//
// It no longer owns a gesture, only the moment: it decides when an element has
// arrived and hands that over to the CSS grammar in globals.css, where the
// gesture belongs to the thing moving (.ink-set for type, .rule-draw for a
// rule, .folio-row for a run of contents, .reveal-plate for a photograph).
// Used bare it still carries the default block entrance — opacity plus a 10px
// rise, and no blur: hazing a 1100px section was one gesture applied to
// everything, which is the same as having no gesture at all.
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
  flat = false,
  className,
}: {
  children: React.ReactNode;
  /** Seconds. Use 0.05–0.08 increments only for siblings that enter TOGETHER
      (an orchestrated group); elements that scroll in alone should keep 0, or
      the delay reads as lag. */
  delay?: number;
  /** Animate on first paint (hero orchestration) instead of on scroll into view. */
  load?: boolean;
  /** Carry the trigger only: the wrapper stays put while its children (.ink-set,
      .rule-draw, .folio-row) perform. Without it a set headline would rise
      twice — once as words, once as a block. */
  flat?: boolean;
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
      // Any intersection at all, with the viewport's foot pulled up a tenth:
      // the entrance starts as the element's top crosses that line and is over
      // by the time it is properly on screen.
      //
      // NOT a percentage threshold. A Reveal now wraps whole lists — a contents
      // leaf enters as one object — and a list taller than five viewports can
      // never be 20% visible at once, so a threshold would leave a long archive
      // permanently hidden. This condition holds for a wrapper of any height.
      { threshold: 0, rootMargin: "0px 0px -10% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [load]);

  const style = delay
    ? ({ "--reveal-delay": `${delay}s` } as React.CSSProperties)
    : undefined;

  const flatClass = flat ? " reveal-flat" : "";

  if (load) {
    return (
      <div className={`reveal-load${flatClass} ${className ?? ""}`} style={style}>
        {children}
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className={`reveal-scroll${flatClass} ${className ?? ""}`}
      style={style}
    >
      {children}
    </div>
  );
}
