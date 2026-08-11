import { publishPaper, rejectPaper } from "@/app/admin/actions";
import { PendingButton } from "@/app/_components/PendingButton";

// One paper awaiting a decision. Server component; the buttons are client
// leaves (PendingButton) only so the editor sees the action acknowledge.
//
// Publish and reject are separate <form>s rather than one form with two named
// buttons, because a rejection carries a note and a publish must not.
export function ReviewCard({
  id,
  title,
  abstract,
  authorLine,
  submitterLabel,
  submittedAt,
  waitingDays,
}: {
  id: string;
  title: string;
  abstract: string;
  authorLine: string;
  submitterLabel: string;
  submittedAt: string;
  /** Whole days since submission — the queue's triage cue. */
  waitingDays: number | null;
}) {
  return (
    <article className="border-b border-rule pb-10 last:border-b-0">
      <h2 className="font-serif text-xl text-ink">{title}</h2>
      <p className="mt-1.5 text-sm text-muted-fg">{authorLine}</p>
      <p className="mt-0.5 text-xs text-muted-fg">
        Submitted {submittedAt} by {submitterLabel}
        {waitingDays !== null && waitingDays >= 1 && (
          // The staleness cue: state colour once a paper has waited long
          // enough that an author would reasonably wonder.
          <span className={waitingDays >= 14 ? "text-state-warn" : undefined}>
            {" "}
            · waiting {waitingDays} day{waitingDays === 1 ? "" : "s"}
          </span>
        )}
      </p>

      <p className="prose-plain mt-5 leading-relaxed text-ink/90">{abstract}</p>

      {/* inline + new tab: reading the PDF is step one of every review, and a
          forced download taxed each paper with a find-it-in-Downloads trip. */}
      <a
        href={`/api/papers/${id}/file?disposition=inline`}
        target="_blank"
        rel="noopener"
        className="mt-5 inline-block text-sm text-accent transition-colors hover:text-accent-dark"
      >
        Read the PDF
      </a>

      <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-start">
        <form action={publishPaper}>
          <input type="hidden" name="id" value={id} />
          <PendingButton
            pendingLabel="Publishing…"
            className="rounded bg-accent px-4 py-2 text-sm font-medium text-surface transition-colors hover:bg-accent-dark"
          >
            Publish
          </PendingButton>
        </form>

        <form action={rejectPaper} className="flex-1">
          <input type="hidden" name="id" value={id} />
          <label htmlFor={`note-${id}`} className="block text-xs font-medium text-ink">
            Note to the author — what needs revising?
          </label>
          <div className="mt-1.5 flex flex-col gap-2 sm:flex-row sm:items-start">
            {/* A textarea, not an input: the note IS the reject workflow, and a
                one-line field that submits on Enter mid-thought fought it.
                required, because a reasonless rejection tells the author
                nothing they can act on. text-base keeps iOS from zooming. */}
            <textarea
              id={`note-${id}`}
              name="reviewNote"
              required
              rows={2}
              maxLength={2000}
              className="flex-1 rounded border border-field bg-surface px-3 py-2 text-base leading-relaxed text-ink outline-none transition-colors focus:border-accent sm:text-sm"
            />
            <PendingButton
              pendingLabel="Returning…"
              className="shrink-0 rounded border border-state-bad/40 px-4 py-2 text-sm font-medium text-state-bad transition-colors hover:bg-state-bad/5"
            >
              Return for revision
            </PendingButton>
          </div>
        </form>
      </div>
    </article>
  );
}
