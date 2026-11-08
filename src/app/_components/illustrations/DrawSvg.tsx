"use client";

import { useRef, type SVGProps } from "react";
import { useReveal } from "@/app/_components/motion/useReveal";

// The client half of <Drawing> for view and scroll modes: the same SVG, plus
// the three-state draw contract on its own element (DESIGN.md §5.5). Absent on
// the server and above the fold; "pending" (hidden, no transition) once
// hydrated below the fold; "in" (drawing) on first intersection.

/** About's tulip is bound to CSS scroll timelines where they exist (desktop,
    motion allowed); everywhere else it falls back to drawing once in view. */
function scrollTimelineActive() {
  return (
    typeof CSS !== "undefined" &&
    CSS.supports("animation-timeline: view()") &&
    window.matchMedia("(min-width: 1024px)").matches
  );
}

export function DrawSvg({
  mode,
  children,
  ...props
}: SVGProps<SVGSVGElement> & { mode: "view" | "scroll" }) {
  const ref = useRef<SVGSVGElement>(null);
  useReveal(ref, {
    attr: "data-draw",
    skip: mode === "scroll" ? scrollTimelineActive : undefined,
  });

  return (
    <svg ref={ref} data-draw-mode={mode} {...props}>
      {children}
    </svg>
  );
}
