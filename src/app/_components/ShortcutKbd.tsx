"use client";

import { useSyncExternalStore } from "react";
import { cx } from "@/app/_components/ui/cx";

// ⌘K on Apple devices, Ctrl K everywhere else. The server renders ⌘K; the
// client corrects it after hydration without a mismatch warning.
const noop = () => () => {};
const isApple = () => /Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent);

export function useModKey(): string {
  return useSyncExternalStore(noop, () => (isApple() ? "⌘" : "Ctrl "), () => "⌘");
}

export function ShortcutKbd({ className, ...rest }: { className?: string; "aria-hidden"?: boolean }) {
  const mod = useModKey();
  return (
    <kbd className={cx("kbd", className)} {...rest}>
      {mod}K
    </kbd>
  );
}
