"use client";

import { useLayoutEffect, type RefObject } from "react";

/**
 * The site's one entrance trigger (DESIGN.md §5.5, §6.2).
 *
 * The server always renders content VISIBLE: public pages are the site's whole
 * search presence, so nothing may ship hidden. After hydration, and only for an
 * element entirely below the viewport, this sets `pending` (hidden, no
 * transition) and then `in` on first intersection, which lets the gesture's CSS
 * transition carry it home. Anything already on screen, above it, or under
 * reduced motion is left alone.
 *
 * `skip` must be a stable (module-level) function; it runs once, in the effect.
 */
export function useReveal(
  ref: RefObject<Element | null>,
  {
    attr = "data-reveal",
    rootMargin = "0px 0px -10% 0px",
    skip,
    enabled = true,
  }: {
    attr?: "data-reveal" | "data-draw";
    rootMargin?: string;
    skip?: () => boolean;
    enabled?: boolean;
  } = {},
) {
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!("IntersectionObserver" in window)) return;
    if (skip?.()) return;
    // On screen (or scrolled past): being read right now, so never hidden.
    if (el.getBoundingClientRect().top < window.innerHeight) return;

    el.setAttribute(attr, "pending");
    // Any intersection at all, with the viewport's foot pulled up a tenth. Not
    // a percentage threshold: a list taller than the viewport could never meet
    // one, and would stay hidden.
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          el.setAttribute(attr, "in");
          io.disconnect();
        }
      },
      { rootMargin, threshold: 0 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, attr, rootMargin, skip, enabled]);
}
