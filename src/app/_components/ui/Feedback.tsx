import type { ReactNode } from "react";
import { STATUS_LABEL, isPaperStatus } from "@/lib/papers";
import { Drawing } from "@/app/_components/illustrations/Drawing";
import type { IllName } from "@/app/_components/illustrations/types";
import { Button } from "./Button";
import { cx } from "./cx";

// Status marks, notices and empty states (DESIGN.md §8.7, §8.13, §8.14).
// Status is told by an 8px dot AND a word, in the state colour: never colour
// alone, never a coloured pill.

const TONE: Record<string, "good" | "warn" | "bad" | "mute"> = {
  DRAFT: "mute",
  SUBMITTED: "warn",
  PUBLISHED: "good",
  REJECTED: "bad",
  SENT: "good",
  SKIPPED: "warn",
  FAILED: "bad",
};

const EMAIL_LABEL: Record<string, string> = {
  SENT: "Sent",
  SKIPPED: "Skipped",
  FAILED: "Failed",
};

export function StatusMark({ status, className }: { status: string; className?: string }) {
  // status is a plain String column: an unknown value falls back, never crashes.
  const label = isPaperStatus(status) ? STATUS_LABEL[status] : (EMAIL_LABEL[status] ?? status);
  return <span className={cx("status", `tone-${TONE[status] ?? "mute"}`, className)}>{label}</span>;
}

export function Notice({
  tone = "info",
  children,
  action,
  role,
  className,
}: {
  tone?: "info" | "good" | "warn" | "bad";
  children: ReactNode;
  action?: ReactNode;
  /** Defaults to a live region (alert for bad, status otherwise); "none" for
      standing information. */
  role?: "status" | "alert" | "none";
  className?: string;
}) {
  const resolved = role ?? (tone === "bad" ? "alert" : "status");
  return (
    <div
      role={resolved === "none" ? undefined : resolved}
      className={cx("notice", `tone-${tone}`, className)}
    >
      <span className="notice-dot" aria-hidden="true" />
      <div className="notice-body">{children}</div>
      {action}
    </div>
  );
}

export function EmptyState({
  drawing,
  title,
  body,
  action,
  headingLevel = 2,
  className,
}: {
  drawing: IllName;
  title: string;
  body?: string;
  action?: { href: string; label: string };
  headingLevel?: 2 | 3;
  className?: string;
}) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  return (
    <div className={cx("empty", className)}>
      <Drawing name={drawing} size="sm" draw="view" />
      <Heading className="t-h3">{title}</Heading>
      {body && <p className="t-body text-ink-3">{body}</p>}
      {action && (
        <div className="actions">
          <Button variant="secondary" size="md" href={action.href}>
            {action.label}
          </Button>
        </div>
      )}
    </div>
  );
}
