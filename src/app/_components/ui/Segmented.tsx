"use client";

import Link from "next/link";
import { useLayoutEffect, useRef, useState } from "react";

// Segmented control (DESIGN.md §8.6): a track of links with one thumb that
// slides to the active item. Without JS the active link carries the fill
// itself; once measured, the thumb takes over and animates between choices.
export function Segmented({
  label,
  items,
  scroll = true,
}: {
  label: string;
  items: { href: string; label: string; count?: number; active: boolean }[];
  /** false keeps the reader's scroll position when switching (filters). */
  scroll?: boolean;
}) {
  const ref = useRef<HTMLElement>(null);
  const [ready, setReady] = useState(false);
  const activeHref = items.find((item) => item.active)?.href;

  useLayoutEffect(() => {
    const nav = ref.current;
    if (!nav) return;
    const measure = () => {
      const active = nav.querySelector<HTMLElement>("[aria-current]");
      const thumb = nav.querySelector<HTMLElement>(".seg-thumb");
      if (!active || !thumb) return;
      thumb.style.setProperty("--x", `${active.offsetLeft}px`);
      thumb.style.setProperty("--w", `${active.offsetWidth}px`);
    };
    measure();
    const frame = requestAnimationFrame(() => setReady(true));
    // Item widths change once the webfont lands.
    const observer = new ResizeObserver(measure);
    nav.querySelectorAll(".seg-item").forEach((el) => observer.observe(el));
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [activeHref]);

  return (
    <nav ref={ref} aria-label={label} className="seg" data-ready={ready || undefined}>
      <span className="seg-thumb" aria-hidden="true" />
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          scroll={scroll}
          className="seg-item"
          aria-current={item.active ? "page" : undefined}
        >
          {item.label}
          {typeof item.count === "number" && <span className="seg-count">{item.count}</span>}
        </Link>
      ))}
    </nav>
  );
}
