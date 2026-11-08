import Link from "next/link";
import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cx } from "./cx";

// Pills (DESIGN.md §4.5). Buttons are ink; the accent is never a button
// colour. `href` renders a link: next/link for pages, a plain <a> for
// downloads, feeds and in-page anchors (client navigation and prefetch must
// never touch a file route).

export type ButtonVariant = "primary" | "secondary" | "ghost" | "on-door" | "link";
export type ButtonSize = "sm" | "md" | "lg";

export function buttonClass(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  extra?: string,
): string {
  return variant === "link" ? cx("link", extra) : cx("btn", `btn-${variant}`, `btn-${size}`, extra);
}

const isNativeHref = (href: string) =>
  href.startsWith("/api/") ||
  href.startsWith("#") ||
  href.endsWith(".xml") ||
  /^[a-z]+:/i.test(href);

type ButtonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  href?: string;
  icon?: ReactNode;
  /** Defaults to an arrow for the link variant; pass null for none. */
  iconEnd?: ReactNode;
  className?: string;
  children: ReactNode;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children">;

export function Button({
  variant = "primary",
  size = "md",
  href,
  icon,
  iconEnd,
  className,
  children,
  ...rest
}: ButtonProps) {
  const end =
    iconEnd !== undefined ? iconEnd : variant === "link" ? <ArrowRightIcon aria-hidden="true" /> : null;
  const classes = buttonClass(variant, size, className);
  const content = (
    <>
      {icon}
      {variant === "link" ? <span>{children}</span> : children}
      {end}
    </>
  );

  if (href) {
    if (isNativeHref(href)) {
      return (
        <a href={href} className={classes}>
          {content}
        </a>
      );
    }
    return (
      <Link href={href} className={classes}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" className={classes} {...rest}>
      {content}
    </button>
  );
}
