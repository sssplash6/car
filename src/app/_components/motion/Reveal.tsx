"use client";

import { useRef, type CSSProperties, type ElementType, type ReactNode } from "react";
import { useReveal } from "./useReveal";

// One of the five gestures (DESIGN.md §6.2), applied to one block:
//   rise   — a section: opacity + 16px rise
//   rows   — a list: its children unroll, staggered by their --i
//   settle — a plate: 30px rise with a 0.985 → 1 scale
//   none   — the trigger only (WordRise's words respond to it)
// `load` plays the gesture on first paint in pure CSS instead of on scroll-in.
// One Reveal per section, never per paragraph.

type RevealProps = {
  children: ReactNode;
  gesture?: "rise" | "rows" | "settle" | "none";
  /** ms; load mode only. */
  delay?: number;
  load?: boolean;
  as?: "div" | "section" | "ol" | "ul" | "li" | "header" | "aside" | "nav";
  className?: string;
  id?: string;
  style?: CSSProperties;
  "aria-labelledby"?: string;
  "aria-label"?: string;
};

export function Reveal({
  children,
  gesture = "rise",
  delay,
  load = false,
  as = "div",
  className,
  style,
  ...rest
}: RevealProps) {
  const ref = useRef<HTMLElement>(null);
  useReveal(ref, { enabled: !load });

  const Tag = as as ElementType;
  const merged = delay ? ({ ...style, "--d": `${delay}ms` } as CSSProperties) : style;
  const classes = [load && gesture !== "none" ? `${gesture}-load` : "", className]
    .filter(Boolean)
    .join(" ");

  return (
    <Tag
      ref={ref}
      data-gesture={gesture}
      className={classes || undefined}
      style={merged}
      {...rest}
    >
      {children}
    </Tag>
  );
}
