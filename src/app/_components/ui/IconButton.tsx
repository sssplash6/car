import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cx } from "./cx";

// Round icon button: 32px in the header, 36px elsewhere, 44px touch target.
// `dot` adds the 7px accent-mark dot (unread notifications).
export function IconButton({
  label,
  href,
  dot = false,
  size = 32,
  className,
  children,
  ...rest
}: {
  label: string;
  href?: string;
  dot?: boolean;
  size?: 32 | 36;
  className?: string;
  children: ReactNode;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children">) {
  const classes = cx("icon-btn", size === 36 && "icon-btn-36", className);
  const inner = (
    <>
      {children}
      {dot && <span className="icon-dot" aria-hidden="true" />}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={classes} aria-label={label} title={label}>
        {inner}
      </Link>
    );
  }
  return (
    <button type="button" className={classes} aria-label={label} title={label} {...rest}>
      {inner}
    </button>
  );
}
