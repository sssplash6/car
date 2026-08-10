"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { submitPaper, type SubmitState } from "@/app/submit/actions";

const MAX_UPLOAD_MB = 10;

function SubmitButton() {
  // useFormStatus must be read from a child of the <form>, not the component that
  // renders it — that is why this is split out rather than inlined below.
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="cursor-pointer rounded bg-accent px-4 py-2.5 text-sm font-medium text-surface transition-colors hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Uploading…" : "Submit for review"}
    </button>
  );
}

export function SubmitForm() {
  const [state, formAction] = useActionState<SubmitState, FormData>(submitPaper, {});

  return (
    <form action={formAction} className="mt-10 border-t border-rule pt-10">
      {state.error && (
        <p className="mb-8 rounded border border-state-bad/40 px-4 py-3 text-sm text-state-bad">
          {state.error}
        </p>
      )}

      <div className="space-y-8">
        <label className="block">
          <span className="text-sm font-medium text-ink">Title</span>
          <input
            name="title"
            required
            maxLength={300}
            className="mt-2 w-full rounded border border-rule bg-surface px-3 py-2 text-ink outline-none transition-colors focus:border-accent"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-ink">Authors</span>
          <span className="mt-1 block text-xs text-muted-fg">
            Separated by commas. Co-authors do not need accounts to be credited.
          </span>
          <input
            name="authorLine"
            required
            maxLength={300}
            placeholder="A. Karimova, R. Patel"
            className="mt-2 w-full rounded border border-rule bg-surface px-3 py-2 text-ink outline-none transition-colors focus:border-accent"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-ink">Abstract</span>
          <span className="mt-1 block text-xs text-muted-fg">
            Public and indexed by search engines. The PDF itself is not, so this is
            the only part of your paper that can be found by search, so make it
            complete.
          </span>
          <textarea
            name="abstract"
            required
            rows={10}
            minLength={100}
            maxLength={5000}
            className="mt-2 w-full rounded border border-rule bg-surface px-3 py-2 leading-relaxed text-ink outline-none transition-colors focus:border-accent"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-ink">Paper (PDF)</span>
          <span className="mt-1 block text-xs text-muted-fg">
            Up to {MAX_UPLOAD_MB} MB. Readers must sign in to download it.
          </span>
          {/* accept= filters the picker for convenience only; the server checks
              the actual leading bytes, since this attribute is trivially bypassed. */}
          <input
            type="file"
            name="file"
            required
            accept="application/pdf,.pdf"
            className="mt-2 block w-full text-sm text-muted-fg file:mr-4 file:cursor-pointer file:rounded file:border-0 file:bg-accent-soft file:px-4 file:py-2 file:text-sm file:font-medium file:text-accent"
          />
        </label>
      </div>

      <div className="mt-10">
        <SubmitButton />
        <p className="mt-3 text-xs text-muted-fg">
          Submissions are reviewed before publication. You will be emailed when a
          decision is made.
        </p>
      </div>
    </form>
  );
}
