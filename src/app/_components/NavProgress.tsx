"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

// The loading line: while a page is on its way, a hand-drawn contour draws
// itself along the bottom edge of the header (the same line as the paper
// page's reading progress). It only appears if the wait passes ~150ms, so
// fast navigations never flash it.
//
// No router events exist in the App Router, so the start is a click on an
// internal link (captured before next/link handles it) or a "car:navigate"
// event (⌘K dispatches one before router.push). The end needs no event: the
// line is shown only while the URL is still the one the click left from.

const CONTOUR =
  "M0 3 C 100 1.5 200 4.5 300 3 C 400 1.5 500 4.5 600 3 C 700 1.5 800 4.5 900 3 C 1000 1.5 1100 4.5 1200 3";

const currentKey = () => `${location.pathname}?${new URLSearchParams(location.search).toString()}`;

export function NavProgress() {
  const pathname = usePathname();
  const search = useSearchParams();
  const key = `${pathname}?${search.toString()}`;
  const [pendingFrom, setPendingFrom] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    function start() {
      const from = currentKey();
      setPendingFrom(from);
      window.clearTimeout(timer.current);
      // A navigation that never lands (offline, an error page) must not leave
      // the line drawing forever.
      timer.current = window.setTimeout(() => setPendingFrom(null), 12000);
    }

    function onClick(event: MouseEvent) {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as Element | null)?.closest?.("a");
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) return;
      const url = new URL(anchor.href, location.href);
      if (url.origin !== location.origin || url.pathname.startsWith("/api/")) return;
      const to = `${url.pathname}?${url.searchParams.toString()}`;
      if (to === currentKey()) return; // same page, or only a #hash
      start();
    }

    document.addEventListener("click", onClick, true);
    window.addEventListener("car:navigate", start);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("car:navigate", start);
      window.clearTimeout(timer.current);
    };
  }, []);

  const loading = pendingFrom !== null && pendingFrom === key;

  return (
    <div className="nav-progress" data-active={loading || undefined} aria-hidden="true">
      <svg viewBox="0 0 1200 6" preserveAspectRatio="none" fill="none" stroke="currentColor" strokeLinecap="round">
        <path d={CONTOUR} pathLength={1} />
      </svg>
    </div>
  );
}
