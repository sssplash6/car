"use client";

import { useEffect, useRef } from "react";
import { PlateChip } from "./IssuePlate";
import { No } from "@/app/_components/ui/Numero";

// The paper page's running head (DESIGN.md §8.17): once the paper's header has
// gone by, a slim bar keeps saying what you are reading and how to get it.
// Its bottom edge is the progress contour, filled by the root scroll timeline
// (CSS only, and only where scroll timelines exist and motion is allowed).

const CONTOUR =
  "M0 3 C 100 1.5 200 4.5 300 3 C 400 1.5 500 4.5 600 3 C 700 1.5 800 4.5 900 3 C 1000 1.5 1100 4.5 1200 3";

export function RunningHead({
  title,
  issue,
  action,
  sentinelId,
}: {
  title: string;
  issue?: { number: number; label: string } | null;
  action: { href: string; label: string };
  /** An element placed right after the paper header. */
  sentinelId: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const bar = ref.current;
    const sentinel = document.getElementById(sentinelId);
    if (!bar || !sentinel || !("IntersectionObserver" in window)) return;
    const headerH =
      parseInt(getComputedStyle(document.documentElement).getPropertyValue("--header-h"), 10) || 64;
    const io = new IntersectionObserver(
      ([entry]) => {
        const past =
          !entry.isIntersecting && entry.boundingClientRect.top <= (entry.rootBounds?.top ?? 0);
        if (past) bar.setAttribute("data-shown", "");
        else bar.removeAttribute("data-shown");
      },
      { rootMargin: `-${headerH}px 0px 0px 0px` },
    );
    io.observe(sentinel);
    return () => io.disconnect();
  }, [sentinelId]);

  return (
    <div ref={ref} className="running-head">
      <div className="wrap rh-inner">
        {issue && <PlateChip number={issue.number} label={issue.label} />}
        <span className="rh-title" aria-hidden="true">
          {title}
        </span>
        {issue && (
          <span className="t-meta max-sm:hidden" aria-hidden="true">
            <No /> {issue.number} · {issue.label}
          </span>
        )}
        <a className="btn btn-primary btn-sm" href={action.href}>
          <span className="max-sm:hidden">{action.label}</span>
          <span className="sm:hidden">PDF</span>
        </a>
      </div>
      <svg
        className="progress-contour"
        viewBox="0 0 1200 6"
        preserveAspectRatio="none"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        aria-hidden="true"
      >
        <path d={CONTOUR} pathLength={1} />
      </svg>
    </div>
  );
}
