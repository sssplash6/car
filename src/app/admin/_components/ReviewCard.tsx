import { ArrowUpRightIcon } from "@phosphor-icons/react/dist/ssr";
import { publishPaper, rejectPaper } from "@/app/admin/actions";
import { PendingButton } from "@/app/_components/PendingButton";
import { Field, Textarea } from "@/app/_components/ui/Field";
import { StatusMark } from "@/app/_components/ui/Feedback";
import { formatFileSize } from "@/lib/format";

// One paper awaiting a decision. Publish and return are separate <form>s, not
// one form with two buttons, because a return carries a note and a publish
// must not.
export function ReviewCard({
  id,
  title,
  abstract,
  authorLine,
  fileSize,
  submitterLabel,
  submittedAt,
  waitingDays,
}: {
  id: string;
  title: string;
  abstract: string;
  authorLine: string;
  fileSize: number;
  submitterLabel: string;
  submittedAt: string;
  /** Whole days since submission: the queue's triage cue. */
  waitingDays: number | null;
}) {
  return (
    <article className="card-bordered" aria-labelledby={`paper-${id}`}>
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2">
        <h3 id={`paper-${id}`} className="t-h3">
          {title}
        </h3>
        <StatusMark status="SUBMITTED" />
      </div>
      <p className="t-ui-sm mt-2 text-ink-3">
        {authorLine} · submitted {submittedAt} by {submitterLabel}
        {waitingDays !== null && waitingDays >= 1 && (
          // Warn colour once a paper has waited long enough that an author
          // would reasonably wonder.
          <span className={waitingDays >= 14 ? "text-warn" : undefined}>
            {" "}
            · waiting {waitingDays} day{waitingDays === 1 ? "" : "s"}
          </span>
        )}
        {" · "}
        {/* Inline, new tab: reading the PDF is step one of every review. */}
        <a
          href={`/api/papers/${id}/file?disposition=inline`}
          target="_blank"
          rel="noopener"
          className="prose-link inline-flex items-center gap-1 text-ink-2"
        >
          Open PDF, {formatFileSize(fileSize)}
          <ArrowUpRightIcon aria-hidden="true" className="size-3.5" />
        </a>
      </p>

      <p className="t-body prose-plain mt-5">{abstract}</p>

      <form action={publishPaper} className="mt-8">
        <input type="hidden" name="id" value={id} />
        <PendingButton pendingLabel="Publishing…">Publish</PendingButton>
      </form>

      <form action={rejectPaper} className="mt-8 border-t border-rule pt-6">
        <input type="hidden" name="id" value={id} />
        {/* required: a reasonless return tells the author nothing they can act
            on. A textarea, because the note IS the return workflow. */}
        <Field id={`note-${id}`} label="Note to the author: what needs revising?">
          <Textarea name="reviewNote" required rows={3} maxLength={2000} className="!min-h-28" />
        </Field>
        <div className="mt-4">
          <PendingButton variant="secondary" pendingLabel="Returning…">
            Return for revision
          </PendingButton>
        </div>
      </form>
    </article>
  );
}
