import { publishPaper, rejectPaper } from "@/app/admin/actions";

// One paper awaiting a decision. A server component: both buttons are plain form
// submissions, so this needs no client JavaScript at all.
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
}: {
  id: string;
  title: string;
  abstract: string;
  authorLine: string;
  submitterLabel: string;
  submittedAt: string;
}) {
  return (
    <article className="border-b border-rule pb-10 last:border-b-0">
      <h3 className="font-serif text-xl text-ink">{title}</h3>
      <p className="mt-1.5 text-sm text-muted-fg">{authorLine}</p>
      <p className="mt-0.5 text-xs text-muted-fg">
        Submitted {submittedAt} by {submitterLabel}
      </p>

      <p className="prose-plain mt-5 leading-relaxed text-ink/90">{abstract}</p>

      <a
        href={`/api/papers/${id}/file`}
        className="mt-5 inline-block text-sm text-accent transition-colors hover:text-accent-dark"
      >
        Read the PDF
      </a>

      <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-start">
        <form action={publishPaper}>
          <input type="hidden" name="id" value={id} />
          <button
            type="submit"
            className="cursor-pointer rounded bg-accent px-4 py-2 text-sm font-medium text-surface transition-colors hover:bg-accent-dark"
          >
            Publish
          </button>
        </form>

        <form action={rejectPaper} className="flex-1">
          <input type="hidden" name="id" value={id} />
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              name="reviewNote"
              maxLength={2000}
              placeholder="What needs revising? (shown to the author)"
              className="flex-1 rounded border border-rule bg-surface px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-accent"
            />
            <button
              type="submit"
              className="cursor-pointer rounded border border-state-bad/40 px-4 py-2 text-sm font-medium text-state-bad transition-colors hover:bg-state-bad/5"
            >
              Return for revision
            </button>
          </div>
        </form>
      </div>
    </article>
  );
}
