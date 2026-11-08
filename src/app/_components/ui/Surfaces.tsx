import type { ReactNode } from "react";
import { cx } from "./cx";

// The three surfaces (DESIGN.md §4.3, §7): cards, the inset band, containers.
// Never a card inside a card; never a shadow in the page flow; at most one
// inset band per page and never two bands adjacent.

export function Card({
  kind,
  as: Tag = "div",
  id,
  overlay = false,
  className,
  children,
  ...aria
}: {
  kind: "filled" | "bordered";
  as?: "div" | "section" | "article" | "li";
  id?: string;
  /** Bordered card on the white overlay fill (forms) instead of the page. */
  overlay?: boolean;
  className?: string;
  children: ReactNode;
  "aria-labelledby"?: string;
}) {
  return (
    <Tag
      id={id}
      className={cx(
        kind === "filled" ? "card-filled" : "card-bordered",
        overlay && "card-overlay",
        className,
      )}
      {...aria}
    >
      {children}
    </Tag>
  );
}

export function Band({
  as: Tag = "section",
  id,
  className,
  children,
  ...aria
}: {
  as?: "section" | "div";
  id?: string;
  className?: string;
  children: ReactNode;
  "aria-labelledby"?: string;
  "aria-label"?: string;
}) {
  return (
    <Tag id={id} className={cx("band", className)} {...aria}>
      {children}
    </Tag>
  );
}

const WIDTH = {
  container: "wrap",
  list: "wrap-list",
  narrow: "wrap-narrow",
  form: "wrap-form",
} as const;

export function Container({
  width = "container",
  as: Tag = "div",
  className,
  children,
}: {
  width?: keyof typeof WIDTH;
  as?: "div" | "section" | "header" | "main";
  className?: string;
  children: ReactNode;
}) {
  return <Tag className={cx(WIDTH[width], className)}>{children}</Tag>;
}
