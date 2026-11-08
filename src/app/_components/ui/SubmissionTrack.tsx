import { PAPER_STATUS } from "@/lib/papers";
import { cx } from "./cx";

// Where a submission is on its way: Submitted → Under review → Decision, as
// three dots joined by a hand-drawn line, the reached part inked and the
// current step lit in its status colour. The last step names the decision
// once there is one. The status mark beside it states the same in words.
export function SubmissionTrack({ status, className }: { status: string; className?: string }) {
  const reached =
    status === PAPER_STATUS.DRAFT ? 0 : status === PAPER_STATUS.SUBMITTED ? 1 : 2;
  const tone =
    status === PAPER_STATUS.PUBLISHED ? "good" : status === PAPER_STATUS.REJECTED ? "bad" : status === PAPER_STATUS.SUBMITTED ? "warn" : "mute";
  const labels = [
    status === PAPER_STATUS.DRAFT ? "Started" : "Submitted",
    "Under review",
    status === PAPER_STATUS.PUBLISHED ? "Published" : status === PAPER_STATUS.REJECTED ? "Returned" : "Decision",
  ];

  return (
    <ol className={cx("track", `tone-${tone}`, className)} aria-label="Progress">
      {labels.map((label, i) => (
        <li
          key={label}
          data-state={i < reached ? "done" : i === reached ? "current" : "todo"}
          aria-current={i === reached ? "step" : undefined}
        >
          <span className="track-dot" aria-hidden="true" />
          <span className="track-label">{label}</span>
        </li>
      ))}
    </ol>
  );
}
