import { STATUS_LABEL, isPaperStatus, type PaperStatus } from "@/lib/papers";

// Status uses the state triad, not the accent colour — the accent means "action",
// these mean state (ONBOARDING.md §4). The label carries the meaning too, so it
// survives for colour-blind readers rather than relying on hue alone.

const STYLES: Record<PaperStatus, string> = {
  DRAFT: "text-state-mute border-state-mute/40",
  SUBMITTED: "text-state-warn border-state-warn/40",
  PUBLISHED: "text-state-good border-state-good/40",
  REJECTED: "text-state-bad border-state-bad/40",
};

export function StatusPill({ status }: { status: string }) {
  // status is a plain String column, so a value written by an older migration or
  // by hand could be anything — fall back rather than crash the page.
  const known = isPaperStatus(status);
  const label = known ? STATUS_LABEL[status] : status;
  const style = known ? STYLES[status] : STYLES.DRAFT;

  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${style}`}
    >
      {label}
    </span>
  );
}
