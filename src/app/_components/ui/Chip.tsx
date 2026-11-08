import type { ReactNode } from "react";
import { cx } from "./cx";

/** 24px meta chip. `current` = the "This quarter" chip: accent-mark dot, ink text. */
export function Chip({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: "neutral" | "current";
  className?: string;
}) {
  return (
    <span className={cx("chip", tone === "current" && "chip-current", className)}>
      {tone === "current" && <i className="dot-accent" aria-hidden="true" />}
      {children}
    </span>
  );
}

/** A printed key: ⌘K, esc. */
export function Kbd({ children, className }: { children: ReactNode; className?: string }) {
  return <kbd className={cx("kbd", className)}>{children}</kbd>;
}
