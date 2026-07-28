import { STATUS_LABEL, isPaperStatus, type PaperStatus } from "@/lib/papers";

// Status uses the chart triad, not brand colours — brand means "action", these
// mean state (ONBOARDING.md §4). Text sits on a tinted background of the same
// hue rather than being coloured text alone, so the meaning survives for
// colour-blind readers via the label itself.
const STYLES: Record<PaperStatus, string> = {
  DRAFT: "text-chart-mute border-chart-mute/40",
  SUBMITTED: "text-chart-warn border-chart-warn/40",
  PUBLISHED: "text-chart-good border-chart-good/40",
  REJECTED: "text-chart-bad border-chart-bad/40",
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
