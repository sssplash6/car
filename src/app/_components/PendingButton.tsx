"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { buttonClass, type ButtonSize } from "@/app/_components/ui/Button";

// Submit button that acknowledges its server action: the label swaps to the
// pending label, aria-busy is set, and the idle width is held so nothing
// beside it moves. No spinner (working surfaces stay still).
//
// Must be rendered INSIDE the <form> it reports on: useFormStatus reads the
// nearest ancestor form.
export function PendingButton({
  children,
  pendingLabel,
  variant = "primary",
  size = "md",
  className,
  disabled = false,
}: {
  children: ReactNode;
  /** Shown while the action runs, e.g. "Publishing…". */
  pendingLabel: string;
  variant?: "primary" | "secondary" | "ghost";
  size?: ButtonSize;
  className?: string;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();
  const ref = useRef<HTMLButtonElement>(null);
  const idleWidth = useRef(0);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (pending) {
      if (idleWidth.current) el.style.minInlineSize = `${idleWidth.current}px`;
    } else {
      el.style.minInlineSize = "";
      idleWidth.current = el.offsetWidth;
    }
  }, [pending]);

  return (
    <button
      ref={ref}
      type="submit"
      disabled={pending || disabled}
      aria-busy={pending || undefined}
      className={buttonClass(variant, size, className)}
    >
      {pending ? pendingLabel : children}
    </button>
  );
}
